import type { InferSelectModel } from 'drizzle-orm';
import { users, conversations, chatMessages } from './schema';

// Create types from the schema tables
type User = InferSelectModel<typeof users>;
type Conversation = InferSelectModel<typeof conversations>;
type ChatMessage = InferSelectModel<typeof chatMessages>;

/**
 * Build a compact transcript from the most recent messages.
 * Output format is plain text lines prefixed with "User:" or "Vanar:".
 * Each row represents a message with its role.
 */
export function buildRecentTranscript(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) return '';
  let out = '';
  for (const m of messages) {
    if (m.role === 'user') {
      out += `User: ${m.content}\n`;
    } else if (m.role === 'assistant') {
      out += `Vanar: ${m.content}\n\n`;
    }
  }
  return out.trim();
}

// Types for the required JSON structure
// Each message represents a single message with role
export interface ChatMessageResponse {
	messageId: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	timestamp: string;
	parentId: string | null; // Direct previous message (conversation flow)
	previousId: string | null; // For "forking": original message you edited/regenerated from
	versionNumber: number;
	updatedAt: string; // When message was last updated
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
		conversations: dbConversations.map(conv => transformConversation(conv))
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
		role: dbMessage.role,
		content: dbMessage.content,
		timestamp: dbMessage.createdAt,
		parentId: dbMessage.parentId,
		previousId: dbMessage.previousId,
		versionNumber: dbMessage.versionNumber || 1,
		updatedAt: dbMessage.updatedAt
	};
}

/**
 * Transform raw DB messages (rows) to the chat view model used by the UI store.
 * Each row represents a single message with role.
 */
export function transformDbMessagesToView(dbMessages: any[]): Array<{
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
  previousId?: string | null;
  versionNumber?: number;
  parentId?: string | null;
}> {
  if (!dbMessages || !Array.isArray(dbMessages)) return [];
  return dbMessages.map((msg: any) => ({
    id: msg.id,
    role: msg.role || 'user',
    content: msg.content || '',
    createdAt: msg.createdAt,
    isStreaming: false,
    previousId: msg.previousId || null,
    versionNumber: msg.versionNumber || 1,
    parentId: msg.parentId || null
  }));
}

/**
 * Create a new message structure for a single message
 */
export function createMessageStructure(
	role: 'user' | 'assistant' | 'system',
	content: string,
	parentId: string | null = null, // Direct previous message (conversation flow)
	previousId: string | null = null, // For "forking": original message you edited/regenerated from
	versionNumber: number = 1
): Omit<ChatMessageResponse, 'messageId' | 'timestamp' | 'updatedAt'> {
	return {
		role,
		content,
		parentId,
		previousId,
		versionNumber
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
 * Build a conversation tree from messages, handling forks and versions
 */
export function buildConversationTree(messages: ChatMessage[]): any[] {
	if (!messages || messages.length === 0) return [];
	
	// Group messages by their branch (using parentId chain)
	const messageMap = new Map();
	const branches: any[] = [];
	
	// First pass: create message map
	messages.forEach(msg => {
		messageMap.set(msg.id, { ...msg, children: [] });
	});
	
	// Second pass: build parent-child relationships
	messages.forEach(msg => {
		if (msg.parentId && messageMap.has(msg.parentId)) {
			const parent = messageMap.get(msg.parentId);
			parent.children.push(messageMap.get(msg.id));
		} else {
			// Root message (no parent)
			branches.push(messageMap.get(msg.id));
		}
	});
	
	return branches;
}

/**
 * Get all versions of a specific message
 */
export function getMessageVersions(messages: ChatMessage[], messageId: string): ChatMessage[] {
	const message = messages.find(m => m.id === messageId);
	if (!message) return [];
	
	// Find all messages with the same previousId (forked from the same original)
	return messages.filter(m => m.previousId === message.previousId && m.role === message.role);
}

/**
 * Get the active branch of a conversation (excluding forked branches)
 */
export function getActiveBranch(messages: ChatMessage[]): ChatMessage[] {
	if (!messages || messages.length === 0) return [];
	
	// Find the latest message without a previousId (not forked)
	const latestNonForked = messages
		.filter(m => !m.previousId)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
	
	if (!latestNonForked) return messages;
	
	// Build the active branch by following parentId chain
	const activeBranch: ChatMessage[] = [];
	let currentMessage = latestNonForked;
	
	while (currentMessage) {
		activeBranch.unshift(currentMessage);
		currentMessage = messages.find(m => m.id === currentMessage.parentId);
	}
	
	return activeBranch;
}
