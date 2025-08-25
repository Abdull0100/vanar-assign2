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
    out += `User: ${m.content}\n`;
    if (m.aiResponse) {
      out += `Vanar: ${m.aiResponse}\n`;
    }
  }
  return out.trim();
}

// Types for the required JSON structure
// Each message represents a complete Q&A pair
export interface ChatMessageResponse {
	messageId: string;
	content: string; // User query/context
	timestamp: string;
	// sender: 'user' | 'ai'; // Removed
	aiResponse: string | null; // AI response (null if pending, text if complete)
	previousId: string | null; // Link to previous chat in same room
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
		content: dbMessage.content,
		timestamp: dbMessage.createdAt,
		aiResponse: dbMessage.aiResponse,
		previousId: dbMessage.previousId,
		updatedAt: dbMessage.updatedAt
	};
}

/**
 * Transform raw DB messages (rows) to the chat view model used by the UI store.
 * Each row already represents a complete Q&A pair in the new schema.
 */
export function transformDbMessagesToView(dbMessages: any[]): Array<{
  id: string;
  content: string;
  aiResponse: string | null;
  createdAt: string;
  isStreaming?: boolean;
}> {
  if (!dbMessages || !Array.isArray(dbMessages)) return [];
  return dbMessages.map((msg: any) => ({
    id: msg.id,
    content: msg.content || '',
    aiResponse: msg.aiResponse ?? null,
    createdAt: msg.createdAt,
    isStreaming: false
  }));
}

/**
 * Create a new message structure for a Q&A pair
 */
export function createMessageStructure(
	content: string, // User query/context
	aiResponse: string | null = null, // AI response (null initially, filled when AI responds)
	previousId: string | null = null // Link to previous chat in same room
): Omit<ChatMessageResponse, 'messageId' | 'timestamp' | 'updatedAt'> {
	return {
		content,
		aiResponse,
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
