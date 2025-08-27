import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { getActiveBranch, saveMessage } from '$lib/db/chatUtils';
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
	let assistantMessage: any = null; // Assistant placeholder to update
	let targetConversationId: string; // Declare at function level for error handling
	
	try {
		const body = await request.json();
		const message: string = body.message;
		const _history: HistoryTurn[] | undefined = Array.isArray(body.history) ? body.history : undefined;
		const conversationId: string | undefined = body.conversationId;
		const previousIdFromClient: string | undefined = body.previousId;
		const parentIdFromClient: string | undefined = body.parentId;
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
			targetConversationId = conversation.id; // Set targetConversationId
		} else {
			// Create new conversation
			const [newConversation] = await db.insert(conversations).values({
				userId: session.user.id,
				roomName: message.length > 40 ? message.slice(0, 40) + '…' : message
			}).returning();
			
			conversation = newConversation;
			targetConversationId = conversation.id; // Set targetConversationId
		}

		// Update conversation's updatedAt timestamp
		await db.update(conversations)
			.set({ updatedAt: new Date() })
			.where(eq(conversations.id, conversation.id));

		// Determine parent for the active branch and optional previousId for forking
		const allMessagesForBranch = await db.query.chatMessages.findMany({
			where: eq(chatMessages.roomId, targetConversationId),
			orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)]
		});
		const branch = getActiveBranch(allMessagesForBranch as any);
		const lastInBranch = branch[branch.length - 1];
		const parentId = parentIdFromClient ?? (lastInBranch ? lastInBranch.id : null);
		const previousId = previousIdFromClient || null;

		// Save user message using centralized logic
		userMessage = await saveMessage({
			roomId: targetConversationId,
			userId: session.user.id,
			role: 'user',
			content: message,
			parentId,
			previousId
		});

		// Create assistant placeholder to update later
		assistantMessage = await saveMessage({
			roomId: targetConversationId,
			userId: session.user.id,
			role: 'assistant',
			content: '',
			parentId: userMessage.id,
			previousId
		});

		// Check if Gemini API is available
		if (!genAI) {
			// Fallback: Save a simple response on assistant placeholder
			const fallbackResponse = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
			await db.update(chatMessages)
				.set({ 
					content: fallbackResponse,
					updatedAt: new Date()
				})
				.where(eq(chatMessages.id, assistantMessage.id));
			
			return json({
				success: true,
				message: 'Message sent with fallback response',
				messageId: userMessage.id,
				conversationId: targetConversationId, // Return the target conversation ID
				response: fallbackResponse
			});
		}

		// Build conversation context from DB: stored summary + last 10 messages
		// Fetch last 10 messages for compact context
		const recentDbMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.roomId, targetConversationId), // Use target conversation ID
			orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
			limit: 10
		});

		// Build conversation transcript using role-based messages
		const buildTranscript = (messages: any[]) => {
			if (!messages || messages.length === 0) return '';
			let transcript = '';
			for (const msg of messages) {
				if (msg.roomId !== targetConversationId) continue;
				if (msg.role === 'user') transcript += `User: ${msg.content}\n`;
				else if (msg.role === 'assistant') transcript += `Vanar: ${msg.content}\n\n`;
			}
			return transcript.trim();
		};

		const transcript = buildTranscript(recentDbMessages);

		// Get the target conversation for summary and other metadata
		const targetConversation = await db.query.conversations.findFirst({
			where: eq(conversations.id, targetConversationId)
		});

		// Analyze message content to determine response formatting requirements
		const lowerMessage = message.toLowerCase();
		let formattingInstructions = "";
		
		if (lowerMessage.includes('table') || lowerMessage.includes('list') || lowerMessage.includes('data')) {
			formattingInstructions = `
CRITICAL: If the user is asking for a table, list, or data presentation, you MUST respond with a properly formatted Markdown table.
Use this exact format:
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

Do not use any other table format. Always use | for column separators and - for header separators.`;
		} else if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
			formattingInstructions = `
Please provide a detailed and comprehensive explanation with clear structure.
Use bullet points or numbered lists when appropriate for better readability.`;
		} else if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('vs')) {
			formattingInstructions = `
Please provide a clear comparison with structured points.
Use a table format if comparing multiple items, or use clear bullet points for differences.`;
		} else if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('script')) {
			formattingInstructions = `
Please provide clean, well-commented code with explanations.
Use proper code blocks with language specification.`;
		}

		// Prepare the prompt with conversation context
		const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

IMPORTANT FORMATTING INSTRUCTIONS:
- When presenting tables, always use proper Markdown table formatting with headers and aligned columns
- Use | to separate columns and - to create header separators
- Ensure tables are properly aligned and readable
- Example table format:
  | Column 1 | Column 2 | Column 3 |
  |----------|----------|----------|
  | Data 1   | Data 2   | Data 3   |
  | Data 4   | Data 5   | Data 6   |

${formattingInstructions}

${targetConversation?.summary ? `Conversation Summary:\n${targetConversation.summary}\n\n` : ''}Recent Conversation Context:\n${transcript}

User's latest message: ${message}

Please provide a helpful response. Keep it conversational and relevant to the context. When presenting data in table format, ensure it's properly formatted using Markdown table syntax.`;

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
					
					// Post-process the response to ensure proper formatting
					let processedResponse = fullResponse;
					
					// If user asked for a table, ensure the response contains proper table formatting
					if (lowerMessage.includes('table') || lowerMessage.includes('list') || lowerMessage.includes('data')) {
						// Check if response contains table-like content but not properly formatted
						if (fullResponse.includes('|') && !fullResponse.includes('|----|')) {
							// Try to fix table formatting by adding header separators
							const lines = fullResponse.split('\n');
							const processedLines = [];
							let foundTable = false;
							
							for (let i = 0; i < lines.length; i++) {
								const line = lines[i];
								processedLines.push(line);
								
								// If this line looks like a table header (contains | and has multiple columns)
								if (line.includes('|') && line.split('|').length > 2 && !foundTable) {
									// Add header separator on the next line
									const columnCount = line.split('|').length - 2; // -2 because split creates empty strings at start/end
									const separator = '|' + '----|'.repeat(columnCount);
									processedLines.push(separator);
									foundTable = true;
								}
							}
							
							processedResponse = processedLines.join('\n');
						}
					}
					
					// Save the processed response to the database on assistant message
					await db.update(chatMessages)
						.set({ 
							content: processedResponse,
							updatedAt: new Date()
						})
						.where(eq(chatMessages.id, assistantMessage.id));
					
					// Send completion signal
					controller.enqueue(`data: ${JSON.stringify({ 
						done: true, 
						fullResponse,
						conversationId: targetConversationId // Include the target conversation ID
					})}\n\n`);
					
					// Periodically update rolling summary every 10 messages
					try {
						if (!session.user) {
							console.warn('Cannot generate summary: session.user is undefined');
							return;
						}
						
						const totalMessages = await db.query.chatMessages.findMany({
							where: eq(chatMessages.roomId, targetConversationId), // Use target conversation ID
							columns: { id: true }
						});
						if (totalMessages.length % 10 === 0 && genAI) {
							const recentForSummary = await db.query.chatMessages.findMany({
								where: eq(chatMessages.roomId, targetConversationId), // Use target conversation ID
								orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
								limit: 16
							});
							
							// Use the same threaded approach for summary generation
							const recentTranscript = buildTranscript(recentForSummary);
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
								.where(eq(conversations.id, targetConversationId)); // Use target conversation ID
						}
					} catch (e) {
						console.warn('Summary update skipped:', e);
					}
					
					controller.close();
				} catch (error) {
					console.error('Error in stream processing:', error);
					
					// Save error response to database on assistant message
					const isRateLimited = (error as any)?.status === 429 || (error as any)?.message?.includes('quota');
					const errorMessage = isRateLimited
						? "I'm currently experiencing high demand and can't process your request right now. Please try again in a few minutes."
						: "I apologize, but I encountered an error while processing your request. Please try again.";
					await db.update(chatMessages)
						.set({ 
							content: errorMessage,
							updatedAt: new Date()
						})
						.where(eq(chatMessages.id, assistantMessage.id));
					
					controller.enqueue(`data: ${JSON.stringify({ 
						error: errorMessage,
						conversationId: targetConversationId // Include the target conversation ID
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
		if (shouldSaveToDb && assistantMessage) {
			try {
				await db.update(chatMessages)
					.set({ 
						content: errorMessage,
						updatedAt: new Date()
					})
					.where(eq(chatMessages.id, assistantMessage.id));
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
					conversationId: targetConversationId // Include the target conversation ID
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

		const conversationId = url.searchParams.get('conversationId');
		console.log('GET /api/chat - conversationId:', conversationId, 'userId:', session.user.id);

		if (conversationId) {
			// Get messages for a specific conversation
			console.log('Fetching messages for conversation:', conversationId);
			
			// First check if conversation exists and belongs to user
			const conversation = await db.query.conversations.findFirst({
				where: and(
					eq(conversations.id, conversationId),
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

			// Build active branch with optional selected forks
			const selectedForksParam = url.searchParams.get('selectedForks');
			let selectedForks: Record<string, number> | undefined;
			if (selectedForksParam) {
				try { selectedForks = JSON.parse(selectedForksParam); } catch {}
			}
			const allMessagesForBranch = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, conversationId),
				orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)]
			});
			const branch = getActiveBranch(allMessagesForBranch as any);
			const messages = branch.map((m: any) => ({
				id: m.id,
				role: m.role,
				content: m.content,
				createdAt: m.createdAt,
				updatedAt: m.updatedAt,
				parentId: m.parentId,
				previousId: m.previousId,
				versionNumber: m.versionNumber,
				totalForks: m.totalForks ?? 0,
				selectedForkNumber: m.selectedForkNumber ?? 1
			}));
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
		const { conversationId, roomName, messages } = body;

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

		// Update conversation room name
		if (roomName) {
			await db.update(conversations)
				.set({ 
					roomName,
					updatedAt: new Date()
				})
				.where(eq(conversations.id, conversationId));
		}

		// Optional: allow updating summary via PUT for admin/tools
		if (typeof body.summary === 'string') {
			await db.update(conversations)
				.set({ summary: body.summary, summaryUpdatedAt: new Date(), updatedAt: new Date() })
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
			// Fetch their roomIds
			const msgs = await db.query.chatMessages.findMany({
				where: inArray(chatMessages.id, messageIds),
				columns: { id: true, roomId: true }
			});
			const roomIds = Array.from(new Set(msgs.map((m) => m.roomId)));
			// Verify the rooms belong to the user
			const rooms = await db.query.conversations.findMany({
				where: inArray(conversations.id, roomIds),
				columns: { id: true, userId: true }
			});
			const allOwned = rooms.every((r) => r.userId === session.user!.id);
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
				columns: { id: true, previousId: true, updatedAt: true }, // Check for these columns
				limit: 1
			});
			testResult.schema.chatMessages = {
				accessible: true,
				count: msgCount.length,
				hasUpdatedAt: true, // Assume it exists for now
				hasPreviousId: true // Assume it exists for now
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
