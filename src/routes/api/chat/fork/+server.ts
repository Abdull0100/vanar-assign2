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
		const { messageId, editedContent } = body;
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!messageId || !editedContent) {
			throw new ValidationError('Message ID and edited content are required');
		}

		// Get the original message
		const originalMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.userId, session.user.id)
			)
		});

		if (!originalMessage) {
			throw new ValidationError('Message not found or access denied');
		}

		// Get the conversation to ensure user owns it
		const conversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, originalMessage.conversationId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!conversation) {
			throw new ValidationError('Conversation not found or access denied');
		}

		// Determine branch ID and get next version number
		const branchId = originalMessage.branchId || originalMessage.id;
		
		// Get the maximum version number for this branch
		const maxVersionResult = await db
			.select({ maxVersion: sql<number>`MAX(${chatMessages.versionNumber})` })
			.from(chatMessages)
			.where(eq(chatMessages.branchId, branchId));
		
		const nextVersionNumber = (maxVersionResult[0]?.maxVersion || 0) + 1;

		// Create the forked message
		const [forkedMessage] = await db.insert(chatMessages).values({
			conversationId: originalMessage.conversationId,
			userId: session.user.id,
			content: editedContent,
			aiResponse: null, // Will be filled when AI responds
			previousId: originalMessage.previousId, // Same chronological position
			parentMessageId: originalMessage.id, // Points to the message this was forked from
			branchId: branchId, // Same branch as original
			versionNumber: nextVersionNumber,
			isForked: true,
			originalMessageId: branchId, // Points to the original root message
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

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
			
			return json({
				success: true,
				message: 'Message forked with fallback response',
				messageId: forkedMessage.id,
				conversationId: originalMessage.conversationId,
				response: fallbackResponse
			});
		}

		// Build branch-aware context for the AI
		const transcript = await buildBranchAwareTranscript(
			originalMessage.id,
			branchId,
			forkedMessage.id
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
		const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContentStream(prompt);
		const stream = new ReadableStream({
			async start(controller) {
				try {
					let fullResponse = '';
					
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
