import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { eq, and, desc, gt } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';

// Import env vars from $env
import { GEMINI_API_KEY } from '$env/static/private';

// Initialize Gemini AI only if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const POST: RequestHandler = async ({ request, locals, params }) => {
	try {
		const session = await locals.getSession?.();
		if (!session?.user?.id) {
			throw new AuthError('Please sign in to edit messages');
		}

		const body = await request.json();
		const { newContent } = body;

		if (!newContent || typeof newContent !== 'string') {
			throw new ValidationError('New content is required and must be a valid string');
		}

		// Get the message ID from the URL
		const messageId = params.id;
		if (!messageId) {
			throw new ValidationError('Message ID is required');
		}

		// Find the original message and verify ownership
		const originalMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.role, 'user')
			)
		});

		if (!originalMessage) {
			throw new ValidationError('User message not found');
		}

		// Verify the conversation belongs to the current user
		const conversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, originalMessage.roomId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!conversation) {
			throw new AuthError('Conversation not found or access denied');
		}

		// Find the last assistant message before this user message to maintain conversation flow
		const lastAssistantMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.roomId, originalMessage.roomId),
				eq(chatMessages.role, 'assistant'),
				gt(chatMessages.createdAt, originalMessage.createdAt)
			),
			orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)]
		});

		// Create a forked user message
		const [forkedUserMessage] = await db.insert(chatMessages).values({
			roomId: originalMessage.roomId,
			role: 'user',
			content: newContent,
			parentId: lastAssistantMessage?.id || null,
			previousId: originalMessage.id, // Link to the original message
			versionNumber: 1,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		// Generate a new AI response for the forked message
		let newAssistantMessage;
		if (genAI) {
			// Build conversation context from the fork point
			const recentMessages = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, originalMessage.roomId),
				orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
				limit: 20
			});

			// Build transcript up to the fork point
			const buildTranscript = (messages: any[], forkPointId: string) => {
				let transcript = '';
				const messageMap = new Map();
				messages.forEach(msg => messageMap.set(msg.id, msg));
				
				let currentMessage = messageMap.get(forkPointId);
				while (currentMessage) {
					if (currentMessage.role === 'user') {
						transcript = `User: ${currentMessage.content}\n` + transcript;
					} else if (currentMessage.role === 'assistant') {
						transcript = `Vanar: ${currentMessage.content}\n\n` + transcript;
					}
					currentMessage = currentMessage.parentId ? messageMap.get(currentMessage.parentId) : null;
				}
				return transcript.trim();
			};

			const transcript = buildTranscript(recentMessages, forkedUserMessage.id);
			
			// Generate AI response
			const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

Recent Conversation Context:
${transcript}

User's latest message: ${newContent}

Please provide a helpful response. Keep it conversational and relevant to the context.`;

			const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(prompt);
			const aiResponse = result.response.text();

			// Save the new assistant response
			[newAssistantMessage] = await db.insert(chatMessages).values({
				roomId: originalMessage.roomId,
				role: 'assistant',
				content: aiResponse,
				parentId: forkedUserMessage.id,
				previousId: null,
				versionNumber: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
		} else {
			// Fallback response if AI is unavailable
			const fallbackResponse = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
			[newAssistantMessage] = await db.insert(chatMessages).values({
				roomId: originalMessage.roomId,
				role: 'assistant',
				content: fallbackResponse,
				parentId: forkedUserMessage.id,
				previousId: null,
				versionNumber: 1,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
		}

		// Update conversation timestamp
		await db.update(conversations)
			.set({ updatedAt: new Date() })
			.where(eq(conversations.id, originalMessage.roomId));

		return json({
			success: true,
			message: 'Message forked successfully',
			forkedUserMessage: {
				id: forkedUserMessage.id,
				content: forkedUserMessage.content,
				previousId: forkedUserMessage.previousId,
				parentId: forkedUserMessage.parentId,
				roomId: forkedUserMessage.roomId
			},
			newAssistantMessage: {
				id: newAssistantMessage.id,
				content: newAssistantMessage.content,
				parentId: newAssistantMessage.parentId,
				roomId: newAssistantMessage.roomId
			}
		});

	} catch (error) {
		console.error('Message edit API Error:', error);
		return handleApiError(error);
	}
};

export const PUT: RequestHandler = async ({ request, locals, params }) => {
	try {
		const session = await locals.getSession?.();
		if (!session?.user?.id) {
			throw new AuthError('Please sign in to regenerate messages');
		}

		// Get the message ID from the URL
		const messageId = params.id;
		if (!messageId) {
			throw new ValidationError('Message ID is required');
		}

		// Find the original assistant message and verify ownership
		const originalMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.role, 'assistant')
			)
		});

		if (!originalMessage) {
			throw new ValidationError('Assistant message not found');
		}

		// Verify the conversation belongs to the current user
		const conversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, originalMessage.roomId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!conversation) {
			throw new AuthError('Conversation not found or access denied');
		}

		// Find the user message that triggered this assistant response
		if (!originalMessage.parentId) {
			throw new ValidationError('Assistant message has no parent user message');
		}
		
		const userMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.roomId, originalMessage.roomId),
				eq(chatMessages.role, 'user'),
				eq(chatMessages.id, originalMessage.parentId)
			)
		});

		if (!userMessage) {
			throw new ValidationError('Parent user message not found');
		}

		// Get the current version number for this message
		const currentVersions = await db.query.chatMessages.findMany({
			where: and(
				eq(chatMessages.roomId, originalMessage.roomId),
				eq(chatMessages.role, 'assistant'),
				eq(chatMessages.parentId, userMessage.id)
			),
			orderBy: (chatMessages, { desc }) => [desc(chatMessages.versionNumber)]
		});

		const nextVersionNumber = currentVersions.length > 0 ? Math.max(...currentVersions.map(m => m.versionNumber)) + 1 : 1;

		// Generate a new AI response
		let newContent;
		if (genAI) {
			// Build conversation context up to the user message
			const recentMessages = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, originalMessage.roomId),
				orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
				limit: 20
			});

			// Build transcript up to the user message
			const buildTranscript = (messages: any[], userMessageId: string) => {
				let transcript = '';
				const messageMap = new Map();
				messages.forEach(msg => messageMap.set(msg.id, msg));
				
				let currentMessage = messageMap.get(userMessageId);
				while (currentMessage) {
					if (currentMessage.role === 'user') {
						transcript = `User: ${currentMessage.content}\n` + transcript;
					} else if (currentMessage.role === 'assistant') {
						transcript = `Vanar: ${currentMessage.content}\n\n` + transcript;
					}
					currentMessage = currentMessage.parentId ? messageMap.get(currentMessage.parentId) : null;
				}
				return transcript.trim();
			};

			const transcript = buildTranscript(recentMessages, userMessage.id);
			
			// Generate AI response
			const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

Recent Conversation Context:
${transcript}

User's latest message: ${userMessage.content}

Please provide a helpful response. Keep it conversational and relevant to the context.`;

			const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(prompt);
			newContent = result.response.text();
		} else {
			// Fallback response if AI is unavailable
			newContent = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
		}

		// Create a new forked assistant message
		const [newAssistantMessage] = await db.insert(chatMessages).values({
			roomId: originalMessage.roomId,
			role: 'assistant',
			content: newContent,
			parentId: userMessage.id,
			previousId: originalMessage.id, // Link to the original message
			versionNumber: nextVersionNumber,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		// Delete all future messages in this branch (messages that come after the regenerated point)
		const futureMessages = await db.query.chatMessages.findMany({
			where: and(
				eq(chatMessages.roomId, originalMessage.roomId),
				gt(chatMessages.createdAt, originalMessage.createdAt)
			)
		});

		// Delete future messages that are not part of other branches
		for (const futureMsg of futureMessages) {
			// Check if this message is part of a different branch
			let isInDifferentBranch = false;
			let currentMsg: any = futureMsg;
			
			while (currentMsg?.parentId) {
				if (currentMsg.parentId === originalMessage.id) {
					isInDifferentBranch = true;
					break;
				}
				const parentMsg = await db.query.chatMessages.findFirst({
					where: eq(chatMessages.id, currentMsg.parentId)
				});
				if (!parentMsg) break;
				currentMsg = parentMsg;
			}
			
			if (!isInDifferentBranch) {
				await db.delete(chatMessages)
					.where(eq(chatMessages.id, futureMsg.id));
			}
		}

		// Update conversation timestamp
		await db.update(conversations)
			.set({ updatedAt: new Date() })
			.where(eq(conversations.id, originalMessage.roomId));

		return json({
			success: true,
			message: 'Message regenerated successfully',
			newAssistantMessage: {
				id: newAssistantMessage.id,
				content: newAssistantMessage.content,
				previousId: newAssistantMessage.previousId,
				versionNumber: newAssistantMessage.versionNumber
			}
		});

	} catch (error) {
		console.error('Message regenerate API Error:', error);
		return handleApiError(error);
	}
};
