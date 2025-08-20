import type { Conversation, ChatMessage, User } from './schema';

/**
 * Build a compact transcript from the most recent messages.
 * Output format is plain text lines prefixed with "User:" or "Vanar:".
 */
export function buildRecentTranscript(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) return '';
  let out = '';
  for (const m of messages) {
    if (m.sender === 'user') {
      out += `User: ${m.content}\n`;
    } else if (m.sender === 'ai') {
      out += `Vanar: ${m.aiResponse ?? ''}\n`;
    }
  }
  return out.trim();
}

// Types for the required JSON structure
export interface ChatMessageResponse {
  messageId: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'ai';
  aiResponse: string | null;
}

export interface ConversationResponse {
  conversationId: string;
  roomName: string;
  messages: ChatMessageResponse[];
}

export interface ChatHistoryResponse {
  userId: string;
  conversations: ConversationResponse[];
}

/**
 * Transform database data into the required JSON structure
 */
export function transformChatHistory(
  user: User,
  conversations: (Conversation & { messages: ChatMessage[] })[]
): ChatHistoryResponse {
  return {
    userId: user.id,
    conversations: conversations.map(conv => ({
      conversationId: conv.id,
      roomName: conv.roomName,
      messages: conv.messages.map(msg => ({
        messageId: msg.id,
        content: msg.content,
        timestamp: msg.createdAt.toISOString(),
        sender: msg.sender as 'user' | 'ai',
        aiResponse: msg.aiResponse
      }))
    }))
  };
}

/**
 * Transform a single conversation with its messages
 */
export function transformConversation(
  conversation: Conversation & { messages: ChatMessage[] }
): ConversationResponse {
  return {
    conversationId: conversation.id,
    roomName: conversation.roomName,
    messages: conversation.messages.map(msg => ({
      messageId: msg.id,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
      sender: msg.sender as 'user' | 'ai',
      aiResponse: msg.aiResponse
    }))
  };
}

/**
 * Transform a single chat message
 */
export function transformChatMessage(message: ChatMessage): ChatMessageResponse {
  return {
    messageId: message.id,
    content: message.content,
    timestamp: message.createdAt.toISOString(),
    sender: message.sender as 'user' | 'ai',
    aiResponse: message.aiResponse
  };
}

/**
 * Create a new conversation structure
 */
export function createConversationStructure(
  userId: string,
  roomName: string,
  messages: ChatMessage[] = []
): ConversationResponse {
  return {
    conversationId: '', // Will be set by database
    roomName,
    messages: messages.map(transformChatMessage)
  };
}

/**
 * Create a new message structure
 */
export function createMessageStructure(
  content: string,
  sender: 'user' | 'ai',
  aiResponse: string | null = null
): Omit<ChatMessageResponse, 'messageId' | 'timestamp'> {
  return {
    content,
    sender,
    aiResponse
  };
}
