import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { buildRecentTranscript } from '$lib/db/chatUtils';
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
	let userMessage: any = null; // Declare at function level for error handling
	let targetRoomId: string; // Declare at function level for error handling
	
	try {
		const body = await request.json();
		const message: string = body.message;
		const _history: HistoryTurn[] | undefined = Array.isArray(body.history) ? body.history : undefined;
		const roomId: string | undefined = body.roomId;
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!message || typeof message !== 'string') {
			throw new ValidationError('Message is required and must be a valid string');
		}

		// Get or create conversation
		let conversation;
		if (roomId) {
			// Find existing conversation
			conversation = await db.query.conversations.findFirst({
				where: and(
					eq(conversations.id, roomId),
					eq(conversations.userId, session.user.id)
				)
			});
			
			if (!conversation) {
				throw new ValidationError('Conversation not found or access denied');
			}
			targetRoomId = conversation.id; // Set target room ID
		} else {
			// Create new conversation
			const [newConversation] = await db.insert(conversations).values({
				userId: session.user.id,
				roomName: message.length > 40 ? message.slice(0, 40) + '…' : message
			}).returning();
			
			conversation = newConversation;
			targetRoomId = conversation.id; // Set target room ID
		}

		// Update conversation's updatedAt timestamp
		await db.update(conversations)
			.set({ updatedAt: new Date() })
			.where(eq(conversations.id, conversation.id));

		// Find the most recent message in this conversation to use as parentId
		const mostRecentMessage = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.roomId, targetRoomId),
			orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)],
			columns: { id: true, role: true, content: true, roomId: true }
		});

		// Determine the appropriate parentId and roomId based on conversation state
		let parentId = null;
		
		if (mostRecentMessage) {
			if (mostRecentMessage.role === 'assistant') {
				// If the most recent message is from assistant, link to it
				parentId = mostRecentMessage.id;
				targetRoomId = mostRecentMessage.roomId; // Use the room from previous message
				console.log(`Linking to completed message: ${parentId} in room: ${targetRoomId} (content: "${mostRecentMessage.content?.substring(0, 50)}...")`);
			} else {
				// If the most recent message is from user, find the last assistant message to maintain conversation flow
				const lastAssistantMessage = await db.query.chatMessages.findFirst({
					where: and(
						eq(chatMessages.roomId, targetRoomId),
						eq(chatMessages.role, 'assistant')
					),
					orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)],
					columns: { id: true, roomId: true }
				});
				parentId = lastAssistantMessage?.id || null;
				if (lastAssistantMessage?.roomId) {
					targetRoomId = lastAssistantMessage.roomId;
				}
				console.log(`Linking to last assistant message: ${parentId} in room: ${targetRoomId} (skipping user message: ${mostRecentMessage.id})`);
			}
		} else {
			console.log('First message in conversation, no parentId');
		}

		console.log(`Creating new message with parentId: ${parentId} in room: ${targetRoomId} for user: ${session.user.id}`);

		// Save user message
		const [userMessage] = await db.insert(chatMessages).values({
			roomId: targetRoomId,
			role: 'user',
			content: message,
			parentId: parentId,
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		// Check if Gemini API is available
		if (!genAI) {
			// Fallback: Save a simple response
			const fallbackResponse = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
			const [assistantMessage] = await db.insert(chatMessages).values({
				roomId: targetRoomId,
				role: 'assistant',
				content: fallbackResponse,
				parentId: userMessage.id,
				createdAt: new Date(),
				updatedAt: new Date()
			}).returning();
			
			return json({
				success: true,
				message: 'Message sent with fallback response',
				messageId: userMessage.id,
				assistantMessageId: assistantMessage.id,
				roomId: targetRoomId,
				response: fallbackResponse
			});
		}

		// Build conversation context from DB: stored summary + last 10 messages
		// Fetch last 10 messages for compact context, using parentId for proper threading
		const recentDbMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.roomId, targetRoomId),
			orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
			limit: 10
		});

		// Build threaded conversation context using parentId
		const buildThreadedTranscript = (messages: any[]) => {
			if (!messages || messages.length === 0) return '';
			
			let transcript = '';
			const messageMap = new Map();
			const validMessageIds = new Set();
			
			// Validate that all messages belong to the current room
			messages.forEach(msg => {
				if (msg.roomId === targetRoomId) {
					messageMap.set(msg.id, msg);
					validMessageIds.add(msg.id);
				} else {
					console.warn(`Skipping unauthorized message: ${msg.id} (roomId: ${msg.roomId})`);
				}
			});
			
			// Build transcript following the parentId chain, only using validated messages
			const processedIds = new Set();
			let currentMessage = messages[messages.length - 1]; // Start with the most recent
			
			while (currentMessage && !processedIds.has(currentMessage.id) && validMessageIds.has(currentMessage.id)) {
				processedIds.add(currentMessage.id);
				
				if (currentMessage.role === 'user') {
					transcript = `User: ${currentMessage.content}\n` + transcript;
				} else if (currentMessage.role === 'assistant') {
					transcript = `Vanar: ${currentMessage.content}\n\n` + transcript;
				}
				
				// Move to previous message in the chain, ensuring it's valid
				currentMessage = currentMessage.parentId && validMessageIds.has(currentMessage.parentId) 
					? messageMap.get(currentMessage.parentId) 
					: null;
			}
			
			return transcript.trim();
		};

		const transcript = buildThreadedTranscript(recentDbMessages);

		// Get the target conversation for summary and other metadata
		const targetConversation = await db.query.conversations.findFirst({
			where: eq(conversations.id, targetRoomId)
		});

		// Prepare the prompt with conversation context
		const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

${targetConversation?.summary ? `Conversation Summary:\n${targetConversation.summary}\n\n` : ''}Recent Conversation Context:\n${transcript}

User's latest message: ${message}

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
					
					// Save the complete assistant response to the database
					const [assistantMessage] = await db.insert(chatMessages).values({
						roomId: targetRoomId,
						role: 'assistant',
						content: fullResponse,
						parentId: userMessage.id,
						createdAt: new Date(),
						updatedAt: new Date()
					}).returning();
					
					// Send completion signal
					controller.enqueue(`data: ${JSON.stringify({ 
						done: true, 
						fullResponse,
						assistantMessageId: assistantMessage.id,
						roomId: targetRoomId
					})}\n\n`);
					
					// Periodically update rolling summary every 10 messages
					try {
						if (!session.user) {
							console.warn('Cannot generate summary: session.user is undefined');
							return;
						}
						
						const totalMessages = await db.query.chatMessages.findMany({
							where: eq(chatMessages.roomId, targetRoomId),
							columns: { id: true }
						});
						if (totalMessages.length % 10 === 0 && genAI) {
							const recentForSummary = await db.query.chatMessages.findMany({
								where: eq(chatMessages.roomId, targetRoomId),
								orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
								limit: 16
							});
							
							// Use the same threaded approach for summary generation
							const recentTranscript = buildThreadedTranscript(recentForSummary);
							const summaryText = targetConversation?.summary as string | null;
							const modelForSummary = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
							const summaryPrompt = `You maintain a concise, rolling summary of a chat between User and Vanar.\n\nExisting summary (may be empty):\n${summaryText || '(none)'}\n\nNew recent messages to incorporate (chronological):\n${recentTranscript}\n\nUpdate the summary in 5-10 short bullet points capturing key facts, decisions, tasks, user preferences, and unresolved questions.\n- Max 200 words.\n- Do not include timestamps or salutations.\n- Do not quote large passages; paraphrase.\n- Keep it neutral and factual.\n- Output only the updated summary.`;
							const summaryResult = await modelForSummary.generateContent(summaryPrompt);
							const updatedSummary = summaryResult.response.text();
							await db.update(conversations)
								.set({ 
									summary: updatedSummary, 
									summaryUpdatedAt: new Date(),
									updatedAt: new Date()
								})
								.where(eq(conversations.id, targetRoomId));
						}
					} catch (e) {
						console.warn('Summary update skipped:', e);
					}
					
					controller.close();
				} catch (error) {
					console.error('Error in stream processing:', error);
					
					// Save error response to database
					const errorMessage = "I apologize, but I encountered an error while processing your request. Please try again.";
					const [assistantMessage] = await db.insert(chatMessages).values({
						roomId: targetRoomId,
						role: 'assistant',
						content: errorMessage,
						parentId: userMessage.id,
						createdAt: new Date(),
						updatedAt: new Date()
					}).returning();
					
					controller.enqueue(`data: ${JSON.stringify({ 
						error: errorMessage,
						assistantMessageId: assistantMessage.id,
						roomId: targetRoomId
					})}\n\n`);
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
	} catch (error: any) {
		console.error('Chat API Error:', error);
		
		// Handle specific Google API errors
		let errorMessage = 'An error occurred while processing your request.';
		let shouldSaveToDb = true;
		
		if (error.status === 429) {
			// Rate limit exceeded
			errorMessage = "I'm currently experiencing high demand and can't process your request right now. Please try again in a few minutes. (Rate limit exceeded)";
		} else if (error.status === 403) {
			// API key issues or quota exceeded
			errorMessage = "The AI service is temporarily unavailable due to configuration issues. Please try again later.";
		} else if (error.status >= 500) {
			// Server errors
			errorMessage = "The AI service is experiencing technical difficulties. Please try again in a few minutes.";
		} else if (error.message?.includes('quota')) {
			// Quota exceeded
			errorMessage = "I've reached my daily response limit. Please try again tomorrow or contact support for assistance.";
		}
		
		// Save error response to database if it's a user-facing error and userMessage exists
		if (shouldSaveToDb && userMessage) {
			try {
				const [assistantMessage] = await db.insert(chatMessages).values({
					roomId: targetRoomId,
					role: 'assistant',
					content: errorMessage,
					parentId: userMessage.id,
					createdAt: new Date(),
					updatedAt: new Date()
				}).returning();
			} catch (dbError) {
				console.error('Failed to save error response to database:', dbError);
			}
		}
		
		// Return error as streaming response to maintain consistency
		const errorStream = new ReadableStream({
			start(controller) {
				const errorData = JSON.stringify({ 
					error: errorMessage,
					done: true,
					roomId: targetRoomId
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
}

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to view chat history');
		}

		const roomId = url.searchParams.get('roomId');
		console.log('GET /api/chat - roomId:', roomId, 'userId:', session.user.id);

		if (roomId) {
			// Get messages for a specific conversation
			console.log('Fetching messages for room:', roomId);
			
			// First check if conversation exists and belongs to user
			const conversation = await db.query.conversations.findFirst({
				where: and(
					eq(conversations.id, roomId),
					eq(conversations.userId, session.user.id)
				),
				columns: {
					id: true,
					userId: true
				}
			});

			console.log('Found conversation:', conversation ? 'yes' : 'no');
			if (conversation) {
				console.log('Conversation userId:', conversation.userId, 'session userId:', session.user.id);
			}

			if (!conversation) {
				throw new AuthError('Conversation not found or access denied');
			}

			// Query messages separately
			const messages = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, roomId),
				orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
				columns: {
					id: true,
					role: true,
					content: true,
					createdAt: true,
					updatedAt: true,
					parentId: true,
					previousId: true,
					versionNumber: true
				}
			});

			console.log('Found messages:', messages.length);
			return json({ messages });
		} else {
			// Get all conversations with message counts, filtering out empty ones
			console.log('Fetching all conversations for user:', session.user.id);
			
			const userConversations = await db.query.conversations.findMany({
				where: eq(conversations.userId, session.user.id),
				orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)],
				columns: {
					id: true,
					roomName: true,
					createdAt: true,
					updatedAt: true
				},
				with: {
					messages: {
						columns: { id: true } // Only get message IDs for counting
					}
				}
			});

			console.log('Found conversations:', userConversations.length);

			// Filter out conversations with no messages
			const nonEmptyConversations = userConversations
				.filter(conv => conv.messages.length > 0)
				.map(conv => ({
					id: conv.id,
					roomName: conv.roomName,
					createdAt: conv.createdAt,
					updatedAt: conv.updatedAt,
					messageCount: conv.messages.length
				}));

			console.log('Non-empty conversations:', nonEmptyConversations.length);
			return json({ conversations: nonEmptyConversations });
		}
	} catch (error) {
		console.error('GET /api/chat error:', error);
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
		const { roomId, roomName, messages } = body;

		if (!roomId) {
			throw new ValidationError('Room ID is required');
		}

		// Verify the conversation belongs to the current user
		const existingConversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, roomId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!existingConversation) {
			throw new AuthError('Conversation not found or access denied');
		}

		// Update conversation room name
		if (roomName) {
			await db.update(conversations)
				.set({ 
					roomName,
					updatedAt: new Date()
				})
				.where(eq(conversations.id, roomId));
		}

		// Optional: allow updating summary via PUT for admin/tools
		if (typeof body.summary === 'string') {
			await db.update(conversations)
				.set({ summary: body.summary, summaryUpdatedAt: new Date(), updatedAt: new Date() })
				.where(eq(conversations.id, roomId));
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
		const { messageIds, roomIds } = body;

		// Delete specific messages
		if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
			// First verify all messages belong to rooms owned by the current user
			const userMessages = await db.query.chatMessages.findMany({
				where: inArray(chatMessages.id, messageIds),
				columns: { id: true, roomId: true }
			});

			// Check if all messages belong to rooms owned by the current user
			const roomIdsToCheck = [...new Set(userMessages.map(msg => msg.roomId))];
			const userRooms = await db.query.conversations.findMany({
				where: and(
					inArray(conversations.id, roomIdsToCheck),
					eq(conversations.userId, session.user.id)
				),
				columns: { id: true }
			});
			
			const userRoomIds = new Set(userRooms.map(room => room.id));
			const allOwned = userMessages.every(msg => userRoomIds.has(msg.roomId));
			
			if (!allOwned) {
				throw new AuthError('You can only delete messages from your own conversations');
			}

			// Delete the messages
			await db.delete(chatMessages)
				.where(
					inArray(chatMessages.id, messageIds)
				);
		}
		
		// Delete specific conversations
		if (roomIds && Array.isArray(roomIds) && roomIds.length > 0) {
			// First verify all conversations belong to the current user
			const userConversations = await db.query.conversations.findMany({
				where: inArray(conversations.id, roomIds),
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
					inArray(conversations.id, roomIds)
				);
		}

		// If no specific IDs provided, clear all for the user
		if ((!messageIds || messageIds.length === 0) && (!roomIds || roomIds.length === 0)) {
			// Delete all conversations for the user (messages will be deleted due to CASCADE)
			await db.delete(conversations)
				.where(eq(conversations.userId, session.user!.id));
		}

		return json({ success: true, message: 'Chat data deleted successfully' });
	} catch (error) {
		return handleApiError(error);
	}
}

// Test endpoint to check database connectivity and basic queries
export const PATCH: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to test database connection');
		}

		// Test basic database connectivity
		const testResult = {
			database: 'connected',
			schema: {} as any,
			user: session.user.id,
			timestamp: new Date().toISOString()
		};

		// Check conversations table structure
		try {
			const convCount = await db.query.conversations.findMany({
				where: eq(conversations.userId, session.user.id),
				columns: { id: true },
				limit: 1
			});
			testResult.schema.conversations = {
				accessible: true,
				count: convCount.length,
				hasUpdatedAt: true // Assume it exists for now
			};
		} catch (error: any) {
			testResult.schema.conversations = {
				accessible: false,
				error: error.message
			};
		}

		// Check chatMessages table structure
		try {
			const msgCount = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, 'test'),
				columns: { id: true, parentId: true, updatedAt: true }, // Check for these columns
				limit: 1
			});
			testResult.schema.chatMessages = {
				accessible: true,
				count: msgCount.length,
				hasUpdatedAt: true, // Assume it exists for now
				hasParentId: true // Assume it exists for now
			};
		} catch (error: any) {
			testResult.schema.chatMessages = {
				accessible: false,
				error: error.message
			};
		}

		return json(testResult);
	} catch (error) {
		return handleApiError(error);
	}
}
