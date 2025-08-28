import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';

export interface BranchVersion {
	id: string;
	content: string;
	aiResponse: string | null;
	createdAt: string;
	versionNumber: number;
	messageIndex: number;
	hasChildren?: boolean;
	childrenCount?: number;
}

/**
 * Build a branch-aware conversation transcript using the new ChatGPT-style versioning system
 * Traverses the parentId chain and only includes active versions of messages
 * Does NOT include children from abandoned versions - only follows the active branch
 */
export async function buildBranchAwareTranscript(
	conversationId: string,
	activeVersions?: Record<string, string> // Map of versionGroupId -> active message ID
): Promise<string> {
	try {
		// Get all messages in the conversation
		const allMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.conversationId, conversationId),
			orderBy: [asc(chatMessages.createdAt)]
		});

		if (allMessages.length === 0) {
			return '';
		}

		// Create a map of messages by ID for quick lookup
		const messageMap = new Map();
		allMessages.forEach(msg => messageMap.set(msg.id, msg));

		// Create a map of versionGroupId to all versions
		const versionGroups = new Map<string, any[]>();
		allMessages.forEach(msg => {
			const groupId = msg.versionGroupId || msg.id;
			if (!versionGroups.has(groupId)) {
				versionGroups.set(groupId, []);
			}
			versionGroups.get(groupId)!.push(msg);
		});

		// Function to get the active version of a message
		const getActiveVersion = (message: any): any => {
			const groupId = message.versionGroupId || message.id;
			
			// If we have activeVersions map, use it
			if (activeVersions && activeVersions[groupId]) {
				const activeId = activeVersions[groupId];
				return messageMap.get(activeId) || message;
			}
			
			// Otherwise, use the message with the highest version number in the group
			const versions = versionGroups.get(groupId) || [message];
			return versions.reduce((latest, current) => 
				(current.versionNumber || 1) > (latest.versionNumber || 1) ? current : latest
			);
		};

		// Function to recursively build transcript following only active versions
		const buildTranscriptRecursive = (message: any, visited: Set<string> = new Set()): string => {
			if (visited.has(message.id)) return '';
			visited.add(message.id);

			// Get the active version of this message
			const activeMessage = getActiveVersion(message);
			
			// Add this message to transcript
			let transcript = `User: ${activeMessage.content}\nVanar: ${activeMessage.aiResponse || '[Waiting for response]'}\n\n`;
			
			// Find children of this active message (messages with this as parentId)
			const children = allMessages.filter(msg => msg.parentId === activeMessage.id);
			
			// Only include children of the active version - NOT children from abandoned versions
			for (const child of children) {
				transcript += buildTranscriptRecursive(child, visited);
			}
			
			return transcript;
		};

		// Start from root messages (no parentId)
		const rootMessages = allMessages.filter(msg => !msg.parentId);
		
		let fullTranscript = '';
		for (const root of rootMessages) {
			fullTranscript += buildTranscriptRecursive(root);
		}

		return fullTranscript.trim();
	} catch (error) {
		console.error('Error building branch-aware transcript:', error);
		throw error;
	}
}

/**
 * Get all versions of a message in a branch
 */
export async function getBranchVersions(branchId: string): Promise<BranchVersion[]> {
	try {
		// First try to find a message with this branchId
		let message = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.branchId, branchId)
		});

		// If not found, try to find a message with this ID
		if (!message) {
			message = await db.query.chatMessages.findFirst({
				where: eq(chatMessages.id, branchId)
			});
		}

		if (!message) {
			throw new Error('Message not found');
		}

		// Use the message's versionGroupId or its own ID for the new system
		const versionGroupId = message.versionGroupId || message.id;

		// Get all messages in the same version group
		const versions = await db.query.chatMessages.findMany({
			where: eq(chatMessages.versionGroupId, versionGroupId),
			orderBy: [desc(chatMessages.versionNumber)]
		});

		// Get all messages in the conversation to check for children
		const allMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.conversationId, message.conversationId)
		});

		return versions.map(msg => {
			// Count children for this version that belong to the same branch
			const children = allMessages.filter(child => 
				child.previousId === msg.id && 
				(child.branchId === msg.branchId || !child.branchId)
			);
			
			return {
				id: msg.id,
				content: msg.content,
				aiResponse: msg.aiResponse,
				createdAt: msg.createdAt.toISOString(),
				versionNumber: msg.versionNumber,
				messageIndex: msg.messageIndex || 1,
				hasChildren: children.length > 0,
				childrenCount: children.length
			};
		});
	} catch (error) {
		console.error('Error getting branch versions:', error);
		throw error;
	}
}

/**
 * Get all messages in a conversation that belong to the active branch
 * This function traverses the tree structure using the new versioning system
 * and returns only messages that are part of the active branch
 * Does NOT include children from abandoned versions
 */
export async function getBranchMessages(
	conversationId: string, 
	activeVersions?: Record<string, string> // Map of versionGroupId -> active message ID
): Promise<any[]> {
	try {
		// Get all messages in the conversation
		const allMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.conversationId, conversationId),
			orderBy: [asc(chatMessages.createdAt)]
		});

		if (allMessages.length === 0) {
			return [];
		}

		// Create a map for quick lookup
		const messageMap = new Map();
		allMessages.forEach(msg => messageMap.set(msg.id, msg));

		// Create a map of versionGroupId to all versions
		const versionGroups = new Map<string, any[]>();
		allMessages.forEach(msg => {
			const groupId = msg.versionGroupId || msg.id;
			if (!versionGroups.has(groupId)) {
				versionGroups.set(groupId, []);
			}
			versionGroups.get(groupId)!.push(msg);
		});

		// Function to get the active version of a message
		const getActiveVersion = (message: any): any => {
			const groupId = message.versionGroupId || message.id;
			
			// If we have activeVersions map, use it
			if (activeVersions && activeVersions[groupId]) {
				const activeId = activeVersions[groupId];
				return messageMap.get(activeId) || message;
			}
			
			// Otherwise, use the message with the highest version number in the group
			const versions = versionGroups.get(groupId) || [message];
			return versions.reduce((latest, current) => 
				(current.versionNumber || 1) > (latest.versionNumber || 1) ? current : latest
			);
		};

		// Function to recursively get messages in the active branch
		const getMessagesInBranch = (message: any, visited: Set<string> = new Set()): any[] => {
			if (visited.has(message.id)) return [];
			visited.add(message.id);

			// Get the active version of this message
			const activeMessage = getActiveVersion(message);
			const messages = [activeMessage];

			// Get children of this active message (messages with this as parentId)
			// Only include children of the active version - NOT children from abandoned versions
			const children = allMessages.filter(child => child.parentId === activeMessage.id);

			for (const child of children) {
				messages.push(...getMessagesInBranch(child, visited));
			}

			return messages;
		};

		// Start from root messages (no parentId)
		const rootMessages = allMessages.filter(msg => !msg.parentId);
		
		let allBranchMessages: any[] = [];
		for (const root of rootMessages) {
			allBranchMessages.push(...getMessagesInBranch(root));
		}

		// Sort by creation time
		return allBranchMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	} catch (error) {
		console.error('Error getting branch messages:', error);
		throw error;
	}
}
