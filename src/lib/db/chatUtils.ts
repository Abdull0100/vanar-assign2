import type { InferSelectModel } from 'drizzle-orm';
import { users, conversations, chatMessages } from './schema';

// Create types from the schema tables
type User = InferSelectModel<typeof users>;
type Conversation = InferSelectModel<typeof conversations>;
type ChatMessage = InferSelectModel<typeof chatMessages>;

/**
 * Build a compact transcript from the most recent messages.
 * Output format is plain text lines prefixed with "User:" or "Vanar:".
 * Each row represents a complete Q&A pair.
 */
export function buildRecentTranscript(messages: ChatMessage[]): string {
	if (!messages || messages.length === 0) return '';
	let out = '';
	for (const m of messages) {
		// Each row contains user context + AI response
		if (m.role === 'user') {
			out += `User: ${m.content}\n`;
		} else if (m.role === 'assistant') {
			out += `Vanar: ${m.content}\n`;
		}
	}
	return out.trim();
}

// Types for the required JSON structure
// Each message represents a single message with role-based content
export interface ChatMessageResponse {
	messageId: string;
	role: 'user' | 'assistant' | 'system';
	content: string; // Message content
	timestamp: string;
	parentId: string | null; // Parent message ID for forking
	childrenIds: string[]; // Child message IDs for forks
	updatedAt: string; // When message was last updated
	// Legacy field for backward compatibility
	previousId: string | null; // Link to previous chat in same room (deprecated)
}

export interface ConversationResponse {
	id: string;
	roomName: string;
	userId: string;
	summary: string | null;
	summaryUpdatedAt: string | null;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
}

export interface ChatHistoryResponse {
	conversations: ConversationResponse[];
}

/**
 * Transform database data into the required JSON structure
 */
export function transformChatHistory(dbConversations: any[]): ChatHistoryResponse {
	return {
		conversations: dbConversations.map((conv) => transformConversation(conv))
	};
}

export function transformConversation(dbConversation: any): ConversationResponse {
	return {
		id: dbConversation.id,
		roomName: dbConversation.roomName,
		userId: dbConversation.userId,
		summary: dbConversation.summary,
		summaryUpdatedAt: dbConversation.summaryUpdatedAt,
		createdAt: dbConversation.createdAt,
		updatedAt: dbConversation.updatedAt,
		messageCount: dbConversation.messages?.length || 0
	};
}

export function transformChatMessage(dbMessage: any): ChatMessageResponse {
	return {
		messageId: dbMessage.id,
		role: dbMessage.role || 'user',
		content: dbMessage.content,
		timestamp: dbMessage.createdAt,
		parentId: dbMessage.parentId,
		childrenIds: dbMessage.childrenIds || [],
		updatedAt: dbMessage.updatedAt,
		// Legacy field for backward compatibility
		previousId: dbMessage.previousId
	};
}

/**
 * Transform raw DB messages (rows) to the chat view model used by the UI store.
 * Each row represents a single message with role-based content.
 */
export function transformDbMessagesToView(dbMessages: any[]): Array<{
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	createdAt: string;
	isStreaming?: boolean;
}> {
	if (!dbMessages || !Array.isArray(dbMessages)) return [];
	return dbMessages.map((msg: any) => ({
		id: msg.id,
		role: msg.role || 'user',
		content: msg.content || '',
		createdAt: msg.createdAt,
		isStreaming: false
	}));
}

/**
 * Create a new message structure for a single message
 */
export function createMessageStructure(
	role: 'user' | 'assistant' | 'system',
	content: string, // Message content
	parentId: string | null = null, // Parent message ID for forking
	childrenIds: string[] = [], // Child message IDs for forks
	previousId: string | null = null // Legacy: Link to previous chat in same room
): Omit<ChatMessageResponse, 'messageId' | 'timestamp' | 'updatedAt'> {
	return {
		role,
		content,
		parentId,
		childrenIds,
		previousId
	};
}

export function createEmptyConversation(): Omit<ConversationResponse, 'id' | 'messageCount'> {
	return {
		roomName: '',
		userId: '', // Will be set by database
		summary: null,
		summaryUpdatedAt: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

/**
 * Utility functions for working with message forking
 */

/**
 * Get the root message of a conversation thread
 */
export function getRootMessage(messages: ChatMessage[]): ChatMessage | null {
	return messages.find((msg) => !msg.parentId) || null;
}

/**
 * Get all child messages of a specific parent message
 */
export function getChildMessages(messages: ChatMessage[], parentId: string): ChatMessage[] {
	return messages.filter((msg) => msg.parentId === parentId);
}

/**
 * Get the full conversation thread starting from a root message
 */
export function getConversationThread(
	messages: ChatMessage[],
	rootMessageId: string
): ChatMessage[] {
	const thread: ChatMessage[] = [];
	const visited = new Set<string>();

	function traverse(messageId: string) {
		if (visited.has(messageId)) return;
		visited.add(messageId);

		const message = messages.find((msg) => msg.id === messageId);
		if (!message) return;

		thread.push(message);

		// Traverse children
		const children = messages.filter((msg) => msg.parentId === messageId);
		children.forEach((child) => traverse(child.id));
	}

	traverse(rootMessageId);
	return thread;
}

/**
 * Check if a message has any forks (children)
 */
export function hasForks(message: ChatMessage): boolean {
	return Boolean(message.childrenIds && message.childrenIds.length > 0);
}

/**
 * Get the depth of a message in the conversation tree
 */
export function getMessageDepth(messages: ChatMessage[], messageId: string): number {
	let depth = 0;
	let currentMessage = messages.find((msg) => msg.id === messageId);

	while (currentMessage?.parentId) {
		depth++;
		currentMessage = messages.find((msg) => msg.id === currentMessage?.parentId);
	}

	return depth;
}
