import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';

// Import env vars from $env
import { GEMINI_API_KEY } from '$env/static/private';

// Initialize Gemini AI only if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

type HistoryTurn = { message: string; response: string };

// Fallback responses for when AI is unavailable
const fallbackResponses = [
	"I'm currently experiencing high demand and can't process your request right now. Please try again in a few minutes.",
	"Due to temporary service limitations, I'm unable to respond at the moment. Please check back later.",
	"I apologize, but I'm temporarily unavailable. Please try again in a short while.",
	"Service is currently busy. Please wait a moment and try again.",
	"I'm experiencing technical difficulties. Please try again shortly."
];

function getRandomFallbackResponse(): string {
	return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const message: string = body.message;
		const history: HistoryTurn[] | undefined = Array.isArray(body.history) ? body.history : undefined;
		const conversationId: string | undefined = body.conversationId;
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!message || typeof message !== 'string') {
			throw new ValidationError('Message is required and must be a valid string');
		}

		// Get or create conversation
		let conversation;
		if (conversationId) {
			// Find existing conversation
			conversation = await db.query.conversations.findFirst({
				where: and(
					eq(conversations.id, conversationId),
					eq(conversations.userId, session.user.id)
				)
			});
			
			if (!conversation) {
				throw new ValidationError('Conversation not found or access denied');
			}
		} else {
			// Create new conversation
			const [newConversation] = await db.insert(conversations).values({
				userId: session.user.id,
				title: message.length > 40 ? message.slice(0, 40) + '…' : message
			}).returning();
			
			conversation = newConversation;
		}

		// Check if Gemini API is available
		if (!genAI) {
			const fallbackResponse = "I apologize, but the AI chat service is currently unavailable. The Gemini API key is not configured. Please contact your administrator to set up the GEMINI_API_KEY environment variable.";
			
			// Save fallback response to database
			await db.insert(chatMessages).values({
				conversationId: conversation.id,
				userId: session.user.id,
				message,
				response: fallbackResponse
			});

			return json({ 
				response: fallbackResponse,
				conversationId: conversation.id
			});
		}

		// Build conversation transcript from history (limit to recent turns)
		let transcript = '';
		if (history && history.length > 0) {
			const recent = history.slice(-20); // keep last 20 pairs
			for (const turn of recent) {
				if (turn.message) transcript += `User: ${turn.message}\n`;
				if (turn.response) transcript += `Vanar: ${turn.response}\n`;
			}
		}

		const systemInstruction = `You are Vanar, an advanced AI Chat Bot similar to Gemini and ChatGPT.

Persona and behavior:
- Behave like a professional, friendly, and knowledgeable chatbot.
- Be adaptive: casual tone for casual chats, professional tone for work queries.
- Support coding help, explanations, brainstorming, and research.
- Remember context within the current conversation transcript provided.
- If asked "Who are you?", always reply exactly: "I am Vanar, your AI assistant.".

Capabilities:
- Provide clear, concise, and professional answers.
- You can continue a conversation from earlier points using the provided transcript.
- Prefer structured, skimmable responses when helpful.
`;

		// Compose the final prompt including transcript and the new user message
		const prompt = `${transcript ? `Conversation so far:\n${transcript}\n` : ''}User: ${message}\nVanar:`;

		try {
			// Generate AI response with streaming
			const model = genAI.getGenerativeModel({ 
				model: 'gemini-1.5-flash',
				systemInstruction
			});
			const result = await model.generateContentStream(prompt);
			
			let fullResponse = '';
			
			// Create a readable stream for the response
			const stream = new ReadableStream({
				async start(controller) {
					try {
						for await (const chunk of result.stream) {
							const chunkText = chunk.text();
							fullResponse += chunkText;
							// Send each chunk to the client
							const data = JSON.stringify({ 
								chunk: chunkText, 
								done: false 
							});
							controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
						}
						// Send completion signal
						const endData = JSON.stringify({ 
							chunk: '', 
							done: true,
							fullResponse 
						});
						controller.enqueue(new TextEncoder().encode(`data: ${endData}\n\n`));
						// Save complete response to database
						await db.insert(chatMessages).values({
							conversationId: conversation.id,
							userId: session.user!.id,
							message,
							response: fullResponse
						});
						controller.close();
					} catch (error) {
						console.error('Streaming error:', error);
						const errorData = JSON.stringify({ 
							error: 'Failed to generate response',
							done: true 
						});
						controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
						controller.close();
					}
				}
			});

			return new Response(stream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type',
				}
			});
		} catch (apiError: any) {
			console.error('Google AI API Error:', apiError);
			
			// Handle specific Google API errors
			let errorMessage = 'An error occurred while processing your request.';
			let shouldSaveToDb = true;
			
			if (apiError.status === 429) {
				// Rate limit exceeded
				errorMessage = "I'm currently experiencing high demand and can't process your request right now. Please try again in a few minutes. (Rate limit exceeded)";
			} else if (apiError.status === 403) {
				// API key issues or quota exceeded
				errorMessage = "The AI service is temporarily unavailable due to configuration issues. Please try again later.";
			} else if (apiError.status >= 500) {
				// Server errors
				errorMessage = "The AI service is experiencing technical difficulties. Please try again in a few minutes.";
			} else if (apiError.message?.includes('quota')) {
				// Quota exceeded
				errorMessage = "I've reached my daily response limit. Please try again tomorrow or contact support for assistance.";
			}
			
			// Save error response to database if it's a user-facing error
			if (shouldSaveToDb) {
				try {
					await db.insert(chatMessages).values({
						conversationId: conversation.id,
						userId: session.user.id,
						message,
						response: errorMessage
					});
				} catch (dbError) {
					console.error('Failed to save error response to database:', dbError);
				}
			}
			
			// Return error as streaming response to maintain consistency
			const errorStream = new ReadableStream({
				start(controller) {
					const errorData = JSON.stringify({ 
						error: errorMessage,
						done: true 
					});
					controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
					controller.close();
				}
			});
			
			return new Response(errorStream, {
				headers: {
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					'Connection': 'keep-alive',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': 'Content-Type',
				}
			});
		}
	} catch (error) {
		console.error('Chat API Error:', error);
		return handleApiError(error);
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to view chat history');
		}

		// Get conversations with their messages for the user
		const userConversations = await db.query.conversations.findMany({
			where: eq(conversations.userId, session.user.id),
			orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
			with: {
				messages: {
					orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)]
				}
			}
		});

		return json({ conversations: userConversations });
	} catch (error) {
		return handleApiError(error);
	}
}

export const PUT: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to update conversations');
		}

		const body = await request.json();
		const { conversationId, title, messages } = body;

		if (!conversationId) {
			throw new ValidationError('Conversation ID is required');
		}

		// Verify the conversation belongs to the current user
		const existingConversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, conversationId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!existingConversation) {
			throw new AuthError('Conversation not found or access denied');
		}

		// Update conversation title
		if (title) {
			await db.update(conversations)
				.set({ 
					title,
					updatedAt: new Date()
				})
				.where(eq(conversations.id, conversationId));
		}

		// For now, we'll just update the conversation metadata
		// In a more sophisticated system, you might want to sync individual message deletions
		// This would require more complex logic to handle message ordering and relationships

		return json({ success: true, message: 'Conversation updated successfully' });
	} catch (error) {
		return handleApiError(error);
	}
}

export const DELETE: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to delete chat messages');
		}

		const body = await request.json();
		const { messageIds, conversationIds } = body;

		// Delete specific messages
		if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
			// First verify all messages belong to the current user
			const userMessages = await db.query.chatMessages.findMany({
				where: inArray(chatMessages.id, messageIds),
				columns: { id: true, userId: true }
			});

			// Check if all messages belong to the current user
			const allOwned = userMessages.every(msg => msg.userId === session.user!.id);
			if (!allOwned) {
				throw new AuthError('You can only delete your own messages');
			}

			// Delete the messages
			await db.delete(chatMessages)
				.where(
					inArray(chatMessages.id, messageIds)
				);
		}
		
		// Delete specific conversations
		if (conversationIds && Array.isArray(conversationIds) && conversationIds.length > 0) {
			// First verify all conversations belong to the current user
			const userConversations = await db.query.conversations.findMany({
				where: inArray(conversations.id, conversationIds),
				columns: { id: true, userId: true }
			});

			// Check if all conversations belong to the current user
			const allOwned = userConversations.every(conv => conv.userId === session.user!.id);
			if (!allOwned) {
				throw new AuthError('You can only delete your own conversations');
			}

			// Delete the conversations (messages will be deleted due to CASCADE)
			await db.delete(conversations)
				.where(
					inArray(conversations.id, conversationIds)
				);
		}

		// If no specific IDs provided, clear all for the user
		if ((!messageIds || messageIds.length === 0) && (!conversationIds || conversationIds.length === 0)) {
			// Delete all conversations for the user (messages will be deleted due to CASCADE)
			await db.delete(conversations)
				.where(eq(conversations.userId, session.user!.id));
		}

		return json({ success: true, message: 'Chat data deleted successfully' });
	} catch (error) {
		return handleApiError(error);
	}
}
