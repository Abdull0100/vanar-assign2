import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';
import { buildBranchAwareTranscript } from '$lib/services/chat/buildBranchAwareTranscript';

// Import env vars from $env
import { GEMINI_API_KEY } from '$env/static/private';

// Initialize Gemini AI only if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const { conversationId, messageId, editedContent } = body;
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!conversationId || !messageId || !editedContent) {
			return new Response(JSON.stringify({ error: "Missing conversationId, messageId, or editedContent" }), { status: 400 });
		}

		// Get the original message with all constraints
		const originalMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.conversationId, conversationId),
				eq(chatMessages.userId, session.user.id)
			)
		});

		if (!originalMessage) {
			return new Response(JSON.stringify({ error: "Message not found or access denied" }), { status: 404 });
		}

		// Get the conversation to ensure user owns it
		const conversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, conversationId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!conversation) {
			return new Response(JSON.stringify({ error: "Conversation not found or access denied" }), { status: 400 });
		}

		// Handle versioning metadata
		// versionGroupId = original message's versionGroupId (or originalMessage.id if none)
		const versionGroupId = originalMessage.versionGroupId || originalMessage.id;
		
		// versionNumber = (max versionNumber in that group) + 1
		const maxVersionResult = await db
			.select({ maxVersion: sql<number>`MAX(${chatMessages.versionNumber})` })
			.from(chatMessages)
			.where(eq(chatMessages.versionGroupId, versionGroupId));
		
		const nextVersionNumber = (maxVersionResult[0]?.maxVersion || 0) + 1;
		
		// Get the message index for this message in the conversation
		const messageIndex = originalMessage.messageIndex || 1;

		// Step 4 — Insert the Forked Message
		// Create a new DB entry with clean versioning metadata
		const forkedMessageData = {
			conversationId: originalMessage.conversationId,
			userId: session.user.id,
			parentId: originalMessage.parentId,
			versionGroupId: versionGroupId,
			versionNumber: nextVersionNumber,
			content: editedContent, // Use the edited content
			aiResponse: null, // Will be filled when AI responds
			messageIndex: messageIndex,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const [forkedMessage] = await db.insert(chatMessages).values(forkedMessageData).returning();

		// Update the active version to the new forked message
		// This ensures the new version is immediately visible in the UI
		console.log('Created forked message:', forkedMessage.id, 'for version group:', versionGroupId);

		// DON'T update existing child messages - they should remain attached to the original message
		// This creates a proper tree structure where:
		// - Original message keeps its children
		// - Forked message starts a new branch
		// - When switching versions, we show only the active branch

		// Check if Gemini API is available
		if (!genAI) {
			// Fallback: Save a simple response
			const fallbackResponse = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
			await db.update(chatMessages)
				.set({ 
					aiResponse: fallbackResponse,
					updatedAt: new Date()
				})
				.where(eq(chatMessages.id, forkedMessage.id));
			
			// Return the forked message as JSON with fallback response
			return json({
				forkedMessage: forkedMessage,
				response: fallbackResponse,
				messageId: forkedMessage.id,
				conversationId: originalMessage.conversationId
			});
		}

		// Check for API quota issues before proceeding
		try {
			// Test API availability with a simple request
			const testModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
			await testModel.generateContent('test');
		} catch (error: any) {
			console.log('API test failed:', error.status, error.message);
			if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
				// API quota exceeded - save fallback response
				const fallbackResponse = "I've reached my daily response limit. Please try again tomorrow or contact support for assistance.";
				await db.update(chatMessages)
					.set({ 
						aiResponse: fallbackResponse,
						updatedAt: new Date()
					})
					.where(eq(chatMessages.id, forkedMessage.id));
				
				// Return the forked message as JSON
				return json(forkedMessage);
			}
			// If it's not a quota error, re-throw it
			throw error;
		}

		// Build branch-aware context for the AI
		const transcript = await buildBranchAwareTranscript(
			originalMessage.conversationId
		);

		// Prepare the prompt with conversation context
		const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

IMPORTANT FORMATTING INSTRUCTIONS:
- When presenting tables, always use proper Markdown table formatting with headers and aligned columns
- Use | to separate columns and - to create header separators
- Ensure tables are properly aligned and readable

Conversation Context:\n${transcript}

User's latest message: ${editedContent}

Please provide a helpful response. Keep it conversational and relevant to the context.`;

		// Stream the response
		let result;
		try {
			result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContentStream(prompt);
		} catch (error: any) {
			console.log('Stream generation failed:', error.status, error.message);
			if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
				// API quota exceeded - save fallback response
				const fallbackResponse = "I've reached my daily response limit. Please try again tomorrow or contact support for assistance.";
				await db.update(chatMessages)
					.set({ 
						aiResponse: fallbackResponse,
						updatedAt: new Date()
					})
					.where(eq(chatMessages.id, forkedMessage.id));
				
				// Return the forked message as JSON with fallback response
				return json({
					forkedMessage: forkedMessage,
					response: fallbackResponse,
					messageId: forkedMessage.id,
					conversationId: originalMessage.conversationId
				});
			}
			throw error;
		}
		const stream = new ReadableStream({
			async start(controller) {
				try {
					let fullResponse = '';
					
					// Send the forked message data first
					controller.enqueue(`data: ${JSON.stringify({ 
						forkedMessage: forkedMessage,
						messageId: forkedMessage.id,
						conversationId: originalMessage.conversationId
					})}\n\n`);
					
					for await (const chunk of result.stream) {
						const chunkText = chunk.text();
						fullResponse += chunkText;
						
						// Send the chunk to the client
						controller.enqueue(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
					}
					
					// Save the complete response to the database
					await db.update(chatMessages)
						.set({ 
							aiResponse: fullResponse,
							updatedAt: new Date()
						})
						.where(eq(chatMessages.id, forkedMessage.id));
					
					// Send completion signal
					controller.enqueue(`data: ${JSON.stringify({ 
						done: true, 
						messageId: forkedMessage.id,
						conversationId: originalMessage.conversationId
					})}\n\n`);
					
					controller.close();
				} catch (error) {
					console.error('Error in fork stream processing:', error);
					controller.enqueue(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
					controller.close();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive'
			}
		});

	} catch (error) {
		console.error('Fork API Error:', error);
		return handleApiError(error);
	}
};
