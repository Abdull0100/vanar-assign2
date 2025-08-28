import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages, conversations } from '$lib/db/schema';
import { buildRecentTranscript } from '$lib/db/chatUtils';
import { eq, inArray, and, asc, desc } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';
import { ChatTreeManager, type TreeNode, type BranchNavigation } from '$lib/chat/ChatTreeManager';

// Import env vars from $env
import { GEMINI_API_KEY } from '$env/static/private';
import { ActivityTracker, trackChatMessage } from '$lib/activityTracker';

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
	let targetConversationId: string | undefined; // Declare at function level for error handling
	
	try {
		const body = await request.json();
		const message: string = body.message;
		const _history: HistoryTurn[] | undefined = Array.isArray(body.history) ? body.history : undefined;
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
			targetConversationId = conversation.id; // Set targetConversationId
		} else {
			// Create new conversation
			const [newConversation] = await db.insert(conversations).values({
				userId: session.user.id,
				roomName: message.length > 40 ? message.slice(0, 40) + '…' : message
			}).returning();
			
			conversation = newConversation;
			targetConversationId = conversation.id; // Set targetConversationId

			// Track conversation created
			try {
				const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
				const ua = request.headers.get('user-agent') || undefined;
				await ActivityTracker.trackUserActivity(
					session.user.id,
					'conversation_created',
					'User started a new conversation',
					{ conversationId: targetConversationId },
					ip,
					ua
				);
			} catch {}
		}

		// Update conversation's updatedAt timestamp
		await db.update(conversations)
			.set({ updatedAt: new Date() })
			.where(eq(conversations.id, conversation.id));

		// Find the most recent message in this conversation to use as previousId
		const mostRecentMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.conversationId, targetConversationId), // Use target conversation ID
				eq(chatMessages.userId, session.user.id)
			),
			orderBy: [desc(chatMessages.createdAt)],
			columns: { id: true, role: true, content: true, conversationId: true }
		});

		// Determine the appropriate previousId and conversationId based on conversation state
		let previousId = null;
		
		if (mostRecentMessage) {
			if (mostRecentMessage.role === 'assistant') {
				// If the most recent message is an assistant response, link to it
				previousId = mostRecentMessage.id;
				targetConversationId = mostRecentMessage.conversationId; // Use the conversation from previous message
				console.log(`Linking to completed message: ${previousId} in conversation: ${targetConversationId} (content: "${mostRecentMessage.content?.substring(0, 50)}...")`);
			} else {
				// If the most recent message is a user message, 
				// find the last assistant message to maintain conversation flow
				const lastAssistantMessage = await db.query.chatMessages.findFirst({
					where: and(
						eq(chatMessages.conversationId, targetConversationId), // Use target conversation ID
						eq(chatMessages.userId, session.user.id),
						eq(chatMessages.role, 'assistant')
					),
					orderBy: [desc(chatMessages.createdAt)],
					columns: { id: true, conversationId: true }
				});
				previousId = lastAssistantMessage?.id || null;
				if (lastAssistantMessage?.conversationId) {
					targetConversationId = lastAssistantMessage.conversationId;
				}
				console.log(`Linking to last assistant message: ${previousId} in conversation: ${targetConversationId} (skipping user message: ${mostRecentMessage.id})`);
			}
		} else {
			console.log('First message in conversation, no previousId');
		}

		console.log(`Creating new message with previousId: ${previousId} in conversation: ${targetConversationId} for user: ${session.user.id}`);

		// Get all messages for this conversation to build tree structure
		const allMessages = await db.query.chatMessages.findMany({
			where: and(
				eq(chatMessages.conversationId, targetConversationId),
				eq(chatMessages.userId, session.user.id)
			),
			orderBy: [asc(chatMessages.createdAt)]
		});

		// Create tree manager and load existing messages
		const treeManager = new ChatTreeManager();
		treeManager.loadFromDatabase(allMessages);

		// Determine the correct parent for the new message
		// It should be the last message in the current active branch
		let parentMessageId: string | null = null;
		const activeConversation = treeManager.getActiveConversation();

		if (activeConversation.length > 0) {
			// Use the last message in the active conversation as the parent
			parentMessageId = activeConversation[activeConversation.length - 1].id;
			console.log('Adding new message as child of:', parentMessageId);
		}

		// Add user message to tree
		const userTreeNode = parentMessageId
			? treeManager.addMessageToBranch({
				id: crypto.randomUUID(),
				role: 'user',
				content: message,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				conversationId: targetConversationId,
				userId: session.user.id
			}, parentMessageId)
			: treeManager.addMessage({
				id: crypto.randomUUID(),
				role: 'user',
				content: message,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				conversationId: targetConversationId,
				userId: session.user.id
			});

		// Save user message to database
		const [userMessage] = await db.insert(chatMessages).values({
			id: userTreeNode.id,
			conversationId: targetConversationId,
			userId: session.user.id,
			role: 'user',
			content: message,
			parentId: userTreeNode.parentId,
			childrenIds: userTreeNode.childrenIds,
			previousId: previousId, // Set previousId for database compatibility
			createdAt: new Date(),
			updatedAt: new Date()
		}).returning();

		// Update parent's childrenIds if it exists
		if (userTreeNode.parentId) {
			const treeParent = treeManager.getMessage(userTreeNode.parentId);
			const updatedChildrenIds = treeParent ? treeParent.childrenIds : userTreeNode.childrenIds;
			
			await db.update(chatMessages)
				.set({ 
					childrenIds: updatedChildrenIds,
					updatedAt: new Date()
				})
				.where(eq(chatMessages.id, userTreeNode.parentId));
			console.log('Updated user message parent childrenIds to:', updatedChildrenIds);
		}

		// Track chat message
		try {
			const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
			const ua = request.headers.get('user-agent') || undefined;
			await trackChatMessage(session.user.id, 1, ip, ua);
		} catch {}

		// Check if Gemini API is available
		if (!genAI) {
			// Fallback: Create assistant response message
			const fallbackResponse = "I'm sorry, but I'm currently unable to process your request. Please try again later.";
			await db.insert(chatMessages).values({
				conversationId: targetConversationId,
				userId: session.user.id,
				role: 'assistant',
				content: fallbackResponse,
				parentId: userMessage.id,
				createdAt: new Date(),
				updatedAt: new Date()
			});
			
			return json({
				success: true,
				message: 'Message sent with fallback response',
				messageId: userMessage.id,
				conversationId: targetConversationId, // Return the target conversation ID
				response: fallbackResponse
			});
		}

		// Build conversation context from DB: stored summary + last 10 messages
		// Fetch last 10 messages for compact context, using previousId for proper threading
		const recentDbMessages = await db.query.chatMessages.findMany({
			where: and(
				eq(chatMessages.conversationId, targetConversationId), // Use target conversation ID
				eq(chatMessages.userId, session.user.id)
			),
			orderBy: [asc(chatMessages.createdAt)],
			limit: 10
		});

		// Build threaded conversation context using previousId with security validation
		const buildThreadedTranscript = (messages: any[]) => {
			if (!messages || messages.length === 0 || !session.user) return '';
			
			let transcript = '';
			const messageMap = new Map();
			const validMessageIds = new Set();
			
			// Validate that all messages belong to the current user and conversation
			messages.forEach(msg => {
				if (msg.userId === session.user!.id && msg.conversationId === targetConversationId) { // Use target conversation ID
					messageMap.set(msg.id, msg);
					validMessageIds.add(msg.id);
				} else {
					console.warn(`Skipping unauthorized message: ${msg.id} (userId: ${msg.userId}, conversationId: ${msg.conversationId})`);
				}
			});
			
			// Build transcript following the previousId chain, only using validated messages
			const processedIds = new Set();
			let currentMessage = messages[messages.length - 1]; // Start with the most recent
			
			while (currentMessage && !processedIds.has(currentMessage.id) && validMessageIds.has(currentMessage.id)) {
				processedIds.add(currentMessage.id);
				
				if (currentMessage.role === 'assistant') {
					// Assistant response
					transcript = `Vanar: ${currentMessage.content}\n\n` + transcript;
				} else if (currentMessage.role === 'user') {
					// User message
					transcript = `User: ${currentMessage.content}\n\n` + transcript;
				}
				
				// Move to previous message in the chain, ensuring it's valid
				currentMessage = currentMessage.previousId && validMessageIds.has(currentMessage.previousId) 
					? messageMap.get(currentMessage.previousId) 
					: null;
			}
			
			return transcript.trim();
		};

		const transcript = buildThreadedTranscript(recentDbMessages);

		// Get the target conversation for summary and other metadata
		const targetConversation = await db.query.conversations.findFirst({
			where: eq(conversations.id, targetConversationId)
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
					
					// Save the complete response as a new assistant message using tree structure
					if (session.user && targetConversationId) {
						// Add assistant message to tree
						const assistantTreeNode = treeManager.addMessage({
							id: crypto.randomUUID(),
							role: 'assistant',
							content: fullResponse,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							conversationId: targetConversationId,
							userId: session.user.id
						});

						// Save to database
						await db.insert(chatMessages).values({
							id: assistantTreeNode.id,
							conversationId: targetConversationId,
							userId: session.user.id,
							role: 'assistant',
							content: fullResponse,
							parentId: assistantTreeNode.parentId,
							childrenIds: assistantTreeNode.childrenIds,
							previousId: userMessage.id, // Link to the user message that triggered this response
							createdAt: new Date(),
							updatedAt: new Date()
						});

						// Update parent's childrenIds if it exists
						if (assistantTreeNode.parentId) {
							const treeParent = treeManager.getMessage(assistantTreeNode.parentId);
							const updatedChildrenIds = treeParent ? treeParent.childrenIds : assistantTreeNode.childrenIds;
							
							await db.update(chatMessages)
								.set({ 
									childrenIds: updatedChildrenIds,
									updatedAt: new Date()
								})
								.where(eq(chatMessages.id, assistantTreeNode.parentId));
							console.log('Updated assistant message parent childrenIds to:', updatedChildrenIds);
						}
					}
					
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
							where: and(
								eq(chatMessages.conversationId, targetConversationId!), // Use target conversation ID
								eq(chatMessages.userId, session.user.id)
							),
							columns: { id: true }
						});
						if (totalMessages.length % 10 === 0 && genAI) {
							const recentForSummary = await db.query.chatMessages.findMany({
								where: and(
									eq(chatMessages.conversationId, targetConversationId!), // Use target conversation ID
									eq(chatMessages.userId, session.user.id)
								),
								orderBy: [asc(chatMessages.createdAt)],
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
								.where(eq(conversations.id, targetConversationId!)); // Use target conversation ID
						}
					} catch (e) {
						console.warn('Summary update skipped:', e);
					}
					
					controller.close();
				} catch (error) {
					console.error('Error in stream processing:', error);
					
					// Save error response as assistant message
					const errorMessage = "I apologize, but I encountered an error while processing your request. Please try again.";
					if (session.user && targetConversationId) {
						await db.insert(chatMessages).values({
							conversationId: targetConversationId,
							userId: session.user.id,
							role: 'assistant',
							content: errorMessage,
							parentId: userMessage.id,
							createdAt: new Date(),
							updatedAt: new Date()
						});
					}
					
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
		
		// Save error response as assistant message if it's a user-facing error and userMessage exists
		if (shouldSaveToDb && userMessage && targetConversationId) {
			try {
				const session = await locals.getSession?.();
				if (session?.user) {
					await db.insert(chatMessages).values({
						conversationId: targetConversationId,
						userId: session.user.id,
						role: 'assistant',
						content: errorMessage,
						parentId: userMessage.id,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}
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

			// Query all messages for tree structure
			const allMessages = await db.query.chatMessages.findMany({
				where: eq(chatMessages.conversationId, conversationId),
				orderBy: [asc(chatMessages.createdAt)]
			});



			// Create tree manager and load messages
			const treeManager = new ChatTreeManager();
			treeManager.loadFromDatabase(allMessages);

			// Get active conversation (linear view)
			const activeConversation = treeManager.getActiveConversation();
			
			// Fallback: if tree manager returns empty or too few messages, use linear order
			const finalMessages = activeConversation.length > 0 ? activeConversation : allMessages;
			
			// Additional fallback: if we still have no messages, return empty array
			if (finalMessages.length === 0) {
				return json({ 
					messages: [],
					treeStructure: null,
					branchNavigation: [],
					allMessages: 0
				});
			}
			const treeStructure = treeManager.getTreeStructure();
			
			// Get branch navigation data (not the store)
			const branchNavigationData: BranchNavigation[] = [];
			const activePath = finalMessages.map(msg => msg.id);
			
			// Check each message in the active path for branch navigation
			for (const messageId of activePath) {
				const message = treeManager.getMessage(messageId);
				if (message && message.childrenIds && message.childrenIds.length > 1) {
					// This message has multiple children, so it needs branch navigation
					// Find which child is currently in the active path
					let currentChildIndex = 0;
					for (let i = 0; i < message.childrenIds.length; i++) {
						const childId = message.childrenIds[i];
						const childIndex = activePath.indexOf(childId);
						if (childIndex !== -1) {
							currentChildIndex = i;
							break;
						}
					}

					branchNavigationData.push({
						messageId,
						currentIndex: currentChildIndex,
						totalBranches: message.childrenIds.length,
						childrenIds: message.childrenIds
					});
				}
			}

			// Also check for branch navigation on messages that have multiple children but might not be in active path
			// This is important for showing branch navigation on forked messages
			const treeMessages = treeManager.getAllMessages();
			for (const message of treeMessages) {
				if (message.childrenIds && message.childrenIds.length > 1 && !branchNavigationData.find(nav => nav.messageId === message.id)) {
					// Find which child is currently in the active path
					let currentChildIndex = 0;
					for (let i = 0; i < message.childrenIds.length; i++) {
						const childId = message.childrenIds[i];
						const childIndex = activePath.indexOf(childId);
						if (childIndex !== -1) {
							currentChildIndex = i;
							break;
						}
					}

					branchNavigationData.push({
						messageId: message.id,
						currentIndex: currentChildIndex,
						totalBranches: message.childrenIds.length,
						childrenIds: message.childrenIds
					});
				}
			}


			
			// Transform active conversation to the format expected by the frontend
			const transformedMessages = finalMessages.map(msg => ({
				id: msg.id,
				role: msg.role || 'user', // Fallback for messages without role
				content: msg.content || '',
				createdAt: msg.createdAt || new Date().toISOString(),
				isStreaming: false
			}));
			
			console.log('Returning conversation data:', {
				messagesCount: transformedMessages.length,
				treeStructure: treeStructure.length,
				branchNavigationCount: branchNavigationData.length,
				activePath: treeManager.getActiveConversation().map(msg => msg.id)
			});
			
			return json({ 
				messages: transformedMessages,
				treeStructure,
				branchNavigation: branchNavigationData,
				activePath: treeManager.getActiveConversation().map(msg => msg.id),
				allMessages: allMessages.length
			});
		} else {
			// Get all conversations with message counts, filtering out empty ones
			console.log('Fetching all conversations for user:', session.user.id);
			
			const userConversations = await db.query.conversations.findMany({
				where: eq(conversations.userId, session.user.id),
				orderBy: [desc(conversations.updatedAt)],
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

// Test endpoint to check database connectivity and basic queries
export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to perform tree operations');
		}

		const body = await request.json();
		const { action, messageId, newContent, conversationId, branchIndex } = body;

		console.log('PATCH request body:', { action, messageId, newContent, conversationId, branchIndex });

		if (!action || !messageId) {
			throw new ValidationError('Action and messageId are required');
		}

		// Get the conversation and verify ownership
		const conversation = await db.query.conversations.findFirst({
			where: and(
				eq(conversations.id, conversationId),
				eq(conversations.userId, session.user.id)
			)
		});

		if (!conversation) {
			throw new AuthError('Conversation not found or access denied');
		}

		// Get all messages for this conversation
		const allMessages = await db.query.chatMessages.findMany({
			where: and(
				eq(chatMessages.conversationId, conversationId),
				eq(chatMessages.userId, session.user.id)
			),
			orderBy: [asc(chatMessages.createdAt)]
		});

		// Create tree manager and load messages
		const treeManager = new ChatTreeManager();
		treeManager.loadFromDatabase(allMessages);

		let result: any = {};

		switch (action) {
			case 'fork_message':
				try {
					if (!newContent) {
						throw new ValidationError('New content is required for forking');
					}
					
									const originalMessage = treeManager.getMessage(messageId);
				if (!originalMessage) {
					console.error('Original message not found:', messageId);
					console.log('Available messages in tree manager:', Array.from(treeManager.getAllMessages()).map(m => ({ id: m.id, content: m.content.substring(0, 50) })));
					console.log('All messages from database:', allMessages.map(m => ({ id: m.id, content: m.content.substring(0, 50) })));
					throw new ValidationError('Message not found');
				}
					
					console.log('Forking message:', messageId, 'with content:', newContent);

				// Create forked message in tree
				const forkedMessage = treeManager.forkMessage(messageId, newContent);
				console.log('Created forked message:', forkedMessage.id);
				
				// Determine previousId for database compatibility
				let previousId = null;
				if (forkedMessage.parentId) {
					// If forked message has a parent, use the parent's previousId
					const parent = await db.query.chatMessages.findFirst({
						where: eq(chatMessages.id, forkedMessage.parentId)
					});
					previousId = parent?.previousId || forkedMessage.parentId;
				}
				
				// Save forked message to database
				try {
					await db.insert(chatMessages).values({
						id: forkedMessage.id,
						conversationId: forkedMessage.conversationId,
						userId: forkedMessage.userId,
						role: forkedMessage.role,
						content: forkedMessage.content,
						parentId: forkedMessage.parentId,
						childrenIds: forkedMessage.childrenIds,
						previousId: previousId, // Set previousId for database compatibility
						createdAt: new Date(forkedMessage.createdAt),
						updatedAt: new Date(forkedMessage.updatedAt)
					});
					console.log('Saved forked message to database');
				} catch (dbError) {
					console.error('Failed to save forked message to database:', dbError);
					throw new Error('Failed to save forked message to database');
				}

				// Update parent's childrenIds if it exists
				if (forkedMessage.parentId) {
					try {
						const parent = await db.query.chatMessages.findFirst({
							where: eq(chatMessages.id, forkedMessage.parentId)
						});
						if (parent) {
							// Get the current childrenIds from the tree manager (which has the updated list)
							const treeParent = treeManager.getMessage(forkedMessage.parentId);
							const updatedChildrenIds = treeParent ? treeParent.childrenIds : [...(parent.childrenIds || []), forkedMessage.id];
							
							await db.update(chatMessages)
								.set({ 
									childrenIds: updatedChildrenIds,
									updatedAt: new Date()
								})
								.where(eq(chatMessages.id, forkedMessage.parentId));
							console.log('Updated parent childrenIds to:', updatedChildrenIds);
						}
					} catch (parentError) {
						console.error('Failed to update parent childrenIds:', parentError);
						// Don't throw here, the fork was successful
					}
				}

				// If this is a user message fork, generate AI response
				if (forkedMessage.role === 'user' && genAI) {
					try {
						// Get conversation context for AI response
						const activeConversation = treeManager.getActiveConversation();
						// Convert TreeNode[] to the format expected by buildRecentTranscript
						const conversationForTranscript = activeConversation.map(msg => ({
							id: msg.id,
							role: msg.role,
							content: msg.content,
							createdAt: new Date(msg.createdAt),
							updatedAt: new Date(msg.updatedAt),
							userId: msg.userId,
							conversationId: msg.conversationId,
							parentId: msg.parentId,
							childrenIds: msg.childrenIds,
							previousId: null // Not needed for transcript
						}));
						const transcript = buildRecentTranscript(conversationForTranscript);
						
						const prompt = `You are Vanar, a helpful AI assistant. You are having a conversation with a user. Please respond naturally and helpfully to their message.

Recent Conversation Context:\n${transcript}

User's latest message: ${newContent}

Please provide a helpful response. Keep it conversational and relevant to the context.`;

						// Generate AI response
						const aiResult = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent(prompt);
						const aiResponse = aiResult.response.text();

						// Create AI response message in tree
						const aiMessage = treeManager.addMessage({
							id: crypto.randomUUID(),
							role: 'assistant',
							content: aiResponse,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
							conversationId: forkedMessage.conversationId,
							userId: forkedMessage.userId
						});

						// Save AI response to database
						await db.insert(chatMessages).values({
							id: aiMessage.id,
							conversationId: aiMessage.conversationId,
							userId: aiMessage.userId,
							role: aiMessage.role,
							content: aiMessage.content,
							parentId: aiMessage.parentId,
							childrenIds: aiMessage.childrenIds,
							previousId: forkedMessage.id, // Link to the forked user message
							createdAt: new Date(aiMessage.createdAt),
							updatedAt: new Date(aiMessage.updatedAt)
						});

						// Update parent's childrenIds
						if (aiMessage.parentId) {
							const treeParent = treeManager.getMessage(aiMessage.parentId);
							const updatedChildrenIds = treeParent ? treeParent.childrenIds : aiMessage.childrenIds;
							
							await db.update(chatMessages)
								.set({ 
									childrenIds: updatedChildrenIds,
									updatedAt: new Date()
								})
								.where(eq(chatMessages.id, aiMessage.parentId));
							console.log('Updated AI response parent childrenIds to:', updatedChildrenIds);
						}

						result = {
							success: true,
							message: 'Message forked and AI response generated',
							forkedMessage,
							aiResponse: aiMessage,
							activePath: treeManager.getActiveConversation().map(msg => msg.id)
						};
					} catch (aiError) {
						console.error('Failed to generate AI response for fork:', aiError);
						result = {
							success: true,
							message: 'Message forked successfully, but AI response failed',
							forkedMessage,
							activePath: treeManager.getActiveConversation().map(msg => msg.id)
						};
					}
				} else {
					result = {
						success: true,
						message: 'Message forked successfully',
						forkedMessage,
						activePath: treeManager.getActiveConversation().map(msg => msg.id)
					};
				}
				} catch (forkError) {
					console.error('Fork operation failed:', forkError);
					const errorMessage = forkError instanceof Error ? forkError.message : 'Unknown error';
					throw new Error(`Failed to fork message: ${errorMessage}`);
				}
				break;

			case 'switch_branch':
				if (typeof branchIndex !== 'number') {
					throw new ValidationError('Branch index is required for switching branches');
				}

				const parentMessage = treeManager.getMessage(messageId);
				if (!parentMessage) {
					throw new ValidationError('Parent message not found');
				}

				treeManager.switchToBranchByIndex(messageId, branchIndex);
				const switchedActiveConversation = treeManager.getActiveConversation();

				// Recalculate branch navigation after switching
				const switchedActivePath = switchedActiveConversation.map(msg => msg.id);
				const switchedBranchNavigationData: BranchNavigation[] = [];

				// Check each message in the new active path for branch navigation
				for (const msgId of switchedActivePath) {
					const message = treeManager.getMessage(msgId);
					if (message && message.childrenIds && message.childrenIds.length > 1) {
						// Find which child is currently in the active path
						let currentChildIndex = 0;
						for (let i = 0; i < message.childrenIds.length; i++) {
							const childId = message.childrenIds[i];
							const childIndex = switchedActivePath.indexOf(childId);
							if (childIndex !== -1) {
								currentChildIndex = i;
								break;
							}
						}

						switchedBranchNavigationData.push({
							messageId: msgId,
							currentIndex: currentChildIndex,
							totalBranches: message.childrenIds.length,
							childrenIds: message.childrenIds
						});
					}
				}

				// Also check for branch navigation on messages that have multiple children but might not be in active path
				const treeMessages = treeManager.getAllMessages();
				for (const message of treeMessages) {
					if (message.childrenIds && message.childrenIds.length > 1 && !switchedBranchNavigationData.find(nav => nav.messageId === message.id)) {
						// Find which child is currently in the active path
						let currentChildIndex = 0;
						for (let i = 0; i < message.childrenIds.length; i++) {
							const childId = message.childrenIds[i];
							const childIndex = switchedActivePath.indexOf(childId);
							if (childIndex !== -1) {
								currentChildIndex = i;
								break;
							}
						}

						switchedBranchNavigationData.push({
							messageId: message.id,
							currentIndex: currentChildIndex,
							totalBranches: message.childrenIds.length,
							childrenIds: message.childrenIds
						});
					}
				}

				result = {
					success: true,
					message: 'Branch switched successfully',
					activePath: switchedActivePath,
					activeConversation: switchedActiveConversation.map(msg => ({
						id: msg.id,
						role: msg.role,
						content: msg.content,
						createdAt: msg.createdAt,
						isStreaming: false
					})),
					branchNavigation: switchedBranchNavigationData
				};
				break;

			case 'get_tree_structure':
				const activeConversationForTree = treeManager.getActiveConversation();
				result = {
					success: true,
					treeStructure: treeManager.getTreeStructure(),
					activePath: activeConversationForTree.map(msg => msg.id),
					activeConversation: activeConversationForTree.map(msg => ({
						id: msg.id,
						role: msg.role,
						content: msg.content,
						createdAt: msg.createdAt,
						isStreaming: false
					})),
					branchNavigation: [] // Will be populated by the frontend
				};
				break;

			default:
				throw new ValidationError('Invalid action');
		}

		return json(result);
	} catch (error) {
		return handleApiError(error);
	}
}
