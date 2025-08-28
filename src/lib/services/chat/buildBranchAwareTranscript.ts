import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface BranchVersion {
	id: string;
	content: string;
	aiResponse: string | null;
	createdAt: string;
	versionNumber: number;
}

/**
 * Build a branch-aware conversation transcript
 * Walks the previousId chain but replaces messages with their active versions
 */
export async function buildBranchAwareTranscript(
	messageId: string,
	branchId: string,
	activeVersionId: string
): Promise<string> {
	try {
		// Get the target message to start from
		const targetMessage = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.id, messageId)
		});

		if (!targetMessage) {
			throw new Error('Target message not found');
		}

		// Get all messages in the conversation up to this point
		const allMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.conversationId, targetMessage.conversationId),
			orderBy: [desc(chatMessages.createdAt)],
			limit: 50 // Reasonable limit for context
		});

		// Create a map of messages by ID for quick lookup
		const messageMap = new Map();
		allMessages.forEach(msg => messageMap.set(msg.id, msg));

		// Get the active version message
		const activeVersion = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.id, activeVersionId)
		});

		if (!activeVersion) {
			throw new Error('Active version not found');
		}

		// Build transcript following the previousId chain
		let transcript = '';
		const processedIds = new Set();
		let currentMessage = targetMessage;

		while (currentMessage && !processedIds.has(currentMessage.id)) {
			processedIds.add(currentMessage.id);

			// Check if this message is part of the branch we're replacing
			if (currentMessage.branchId === branchId) {
				// Use the active version instead
				transcript = `User: ${activeVersion.content}\nVanar: ${activeVersion.aiResponse || '[Waiting for response]'}\n\n` + transcript;
			} else {
				// Use the original message
				transcript = `User: ${currentMessage.content}\nVanar: ${currentMessage.aiResponse || '[Waiting for response]'}\n\n` + transcript;
			}

			// Move to previous message in the chain
			currentMessage = currentMessage.previousId ? messageMap.get(currentMessage.previousId) : null;
		}

		return transcript.trim();
	} catch (error) {
		console.error('Error building branch-aware transcript:', error);
		throw error;
	}
}

/**
 * Get all versions of a message in a branch
 */
export async function getBranchVersions(messageId: string): Promise<BranchVersion[]> {
	try {
		// First get the message to find its branch
		const message = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.id, messageId)
		});

		if (!message) {
			throw new Error('Message not found');
		}

		const branchId = message.branchId || message.id;

		// Get all messages in the same branch
		const versions = await db.query.chatMessages.findMany({
			where: eq(chatMessages.branchId, branchId),
			orderBy: [desc(chatMessages.versionNumber)]
		});

		return versions.map(msg => ({
			id: msg.id,
			content: msg.content,
			aiResponse: msg.aiResponse,
			createdAt: msg.createdAt.toISOString(),
			versionNumber: msg.versionNumber
		}));
	} catch (error) {
		console.error('Error getting branch versions:', error);
		throw error;
	}
}
