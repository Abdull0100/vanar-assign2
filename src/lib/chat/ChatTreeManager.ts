import { writable, type Writable } from 'svelte/store';

export interface TreeNode {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	parentId: string | null;
	childrenIds: string[];
	createdAt: string;
	updatedAt: string;
	isStreaming?: boolean;
	conversationId: string;
	userId: string;
}

export interface BranchNavigation {
	messageId: string;
	currentIndex: number;
	totalBranches: number;
	childrenIds: string[];
}

export class ChatTreeManager {
	private messages: Map<string, TreeNode> = new Map();
	private activePath: string[] = [];
	private activePathStore: Writable<string[]> = writable([]);
	private branchNavigationStore: Writable<BranchNavigation[]> = writable([]);

	constructor() {
		// Initialize with empty state
	}

	/**
	 * Get the active path as a reactive store
	 */
	getActivePathStore(): Writable<string[]> {
		return this.activePathStore;
	}

	/**
	 * Get branch navigation info as a reactive store
	 */
	getBranchNavigationStore(): Writable<BranchNavigation[]> {
		return this.branchNavigationStore;
	}

	/**
	 * Add a message to the tree (append to current active path)
	 */
	addMessage(message: Omit<TreeNode, 'parentId' | 'childrenIds'>): TreeNode {
		const parentId = this.activePath.length > 0 ? this.activePath[this.activePath.length - 1] : null;

		const treeNode: TreeNode = {
			...message,
			parentId,
			childrenIds: []
		};

		// Add to messages map
		this.messages.set(message.id, treeNode);

		// Update parent's children if exists
		if (parentId) {
			const parent = this.messages.get(parentId);
			if (parent) {
				parent.childrenIds.push(message.id);
				this.messages.set(parentId, parent);
			}
		}

		// Add to active path
		this.activePath.push(message.id);
		this.updateStores();

		return treeNode;
	}

	/**
	 * Add a message as a child of a specific message (for continuing a specific branch)
	 */
	addMessageToBranch(message: Omit<TreeNode, 'parentId' | 'childrenIds'>, parentMessageId: string): TreeNode {
		const treeNode: TreeNode = {
			...message,
			parentId: parentMessageId,
			childrenIds: []
		};

		// Add to messages map
		this.messages.set(message.id, treeNode);

		// Update parent's children if exists
		const parent = this.messages.get(parentMessageId);
		if (parent) {
			parent.childrenIds.push(message.id);
			this.messages.set(parentMessageId, parent);
		}

		// Update active path to follow this new branch
		this.switchBranch(message.id);
		this.updateStores();

		return treeNode;
	}

	/**
	 * Fork a message (edit user message or regenerate assistant message)
	 */
	forkMessage(messageId: string, newContent: string, newRole?: 'user' | 'assistant'): TreeNode {
		const originalMessage = this.messages.get(messageId);
		if (!originalMessage) {
			throw new Error(`Message ${messageId} not found`);
		}

		// Create new message with same parent
		const forkedMessage: TreeNode = {
			id: crypto.randomUUID(),
			role: newRole || originalMessage.role,
			content: newContent,
			parentId: originalMessage.parentId,
			childrenIds: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			conversationId: originalMessage.conversationId,
			userId: originalMessage.userId
		};

		// Add to messages map
		this.messages.set(forkedMessage.id, forkedMessage);

		// Update parent's children if exists
		if (originalMessage.parentId) {
			const parent = this.messages.get(originalMessage.parentId);
			if (parent) {
				parent.childrenIds.push(forkedMessage.id);
				this.messages.set(originalMessage.parentId, parent);
			}
		}

		// Update active path to follow the new fork
		// Build path from root to the forked message
		const pathToForkedMessage = this.getPathToMessage(forkedMessage.id);
		this.activePath = pathToForkedMessage;
		this.updateStores();

		return forkedMessage;
	}

	/**
	 * Switch to a different branch at a fork point
	 */
	switchBranch(messageId: string): void {
		const message = this.messages.get(messageId);
		if (!message) {
			throw new Error(`Message ${messageId} not found`);
		}

		// Find the path to this message
		const pathToMessage = this.getPathToMessage(messageId);
		if (pathToMessage.length === 0) {
			throw new Error(`Could not find path to message ${messageId}`);
		}

		// Update active path and extend it to include all descendants
		this.activePath = this.buildFullPathFrom(pathToMessage);
		this.updateStores();
	}

	/**
	 * Switch to a specific branch by index at a fork point
	 */
	switchToBranchByIndex(parentMessageId: string, branchIndex: number): void {
		const parent = this.messages.get(parentMessageId);
		if (!parent) {
			throw new Error(`Parent message ${parentMessageId} not found`);
		}

		if (branchIndex < 0 || branchIndex >= parent.childrenIds.length) {
			throw new Error(`Invalid branch index ${branchIndex}`);
		}

		const targetMessageId = parent.childrenIds[branchIndex];
		this.switchBranch(targetMessageId);
	}

	/**
	 * Get the active conversation as a linear array
	 */
	getActiveConversation(): TreeNode[] {
		return this.activePath.map(id => this.messages.get(id)).filter(Boolean) as TreeNode[];
	}

	/**
	 * Get all messages in the tree
	 */
	getAllMessages(): TreeNode[] {
		return Array.from(this.messages.values());
	}

	/**
	 * Get a specific message by ID
	 */
	getMessage(messageId: string): TreeNode | undefined {
		return this.messages.get(messageId);
	}

	/**
	 * Get children of a message
	 */
	getChildren(messageId: string): TreeNode[] {
		const message = this.messages.get(messageId);
		if (!message) return [];
		
		return message.childrenIds
			.map(id => this.messages.get(id))
			.filter(Boolean) as TreeNode[];
	}

	/**
	 * Get sibling index and total siblings for branch navigation
	 */
	getSiblingInfo(messageId: string): { currentIndex: number; totalSiblings: number; parentId: string | null } {
		const message = this.messages.get(messageId);
		if (!message || !message.parentId) {
			return { currentIndex: 0, totalSiblings: 1, parentId: null };
		}

		const parent = this.messages.get(message.parentId);
		if (!parent) {
			return { currentIndex: 0, totalSiblings: 1, parentId: null };
		}

		const currentIndex = parent.childrenIds.indexOf(messageId);
		return {
			currentIndex: currentIndex >= 0 ? currentIndex : 0,
			totalSiblings: parent.childrenIds.length,
			parentId: message.parentId
		};
	}

	/**
	 * Load messages from database format
	 */
	loadFromDatabase(messages: any[]): void {
		this.messages.clear();
		this.activePath = [];

		// First, add all messages to the map
		for (const msg of messages) {
			// Skip messages that don't have required fields
			if (!msg.id || !msg.content) {
				continue;
			}

			const treeNode: TreeNode = {
				id: msg.id,
				role: msg.role || 'user',
				content: msg.content || '',
				parentId: msg.parentId || null,
				childrenIds: msg.childrenIds || [],
				createdAt: msg.createdAt || new Date().toISOString(),
				updatedAt: msg.updatedAt || new Date().toISOString(),
				conversationId: msg.conversationId || '',
				userId: msg.userId || ''
			};
			this.messages.set(msg.id, treeNode);
		}

		// Find the most recent message to determine which branch the user was working on
		let mostRecentMessage: TreeNode | null = null;
		let mostRecentTime = 0;

		for (const message of this.messages.values()) {
			const messageTime = new Date(message.updatedAt).getTime();
			if (messageTime > mostRecentTime) {
				mostRecentTime = messageTime;
				mostRecentMessage = message;
			}
		}

		if (mostRecentMessage) {
			// Build path to the most recent message (the branch user was working on)
			const pathToRecentMessage = this.getPathToMessage(mostRecentMessage.id);
			this.activePath = this.buildFullPathFrom(pathToRecentMessage);
			console.log('Setting active path to most recent message branch:', mostRecentMessage.id);
		} else {
			// Find the root message (no parent)
			const rootMessages = Array.from(this.messages.values()).filter(msg => !msg.parentId);

			if (rootMessages.length > 0) {
				// Start with the first root message and build full path including all descendants
				const rootPath = [rootMessages[0].id];
				this.activePath = this.buildFullPathFrom(rootPath);
			} else {
				// If no root messages, treat all messages as linear (legacy support)
				// Sort by creation time to maintain chronological order
				const sortedMessages = Array.from(this.messages.values())
					.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
				this.activePath = sortedMessages.map(msg => msg.id);
			}
		}

		this.updateStores();
	}

	/**
	 * Get the tree structure for visualization
	 */
	getTreeStructure(): any {
		const roots = Array.from(this.messages.values()).filter(msg => !msg.parentId);
		
		const buildNode = (message: TreeNode): any => {
			const children = this.getChildren(message.id);
			return {
				id: message.id,
				role: message.role,
				content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
				children: children.map(child => buildNode(child)),
				isActive: this.activePath.includes(message.id)
			};
		};

		return roots.map(root => buildNode(root));
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages.clear();
		this.activePath = [];
		this.updateStores();
	}

	/**
	 * Private helper to build active path from a starting message
	 */
	private buildActivePath(startMessageId: string): void {
		const path: string[] = [];
		let currentId: string | null = startMessageId;

		while (currentId) {
			path.push(currentId);
			const message = this.messages.get(currentId);
			if (!message || message.childrenIds.length === 0) {
				break;
			}
			// Follow the first child (default path)
			currentId = message.childrenIds[0];
		}

		// If the path is too short (only 1 message), it might be a legacy conversation
		// In that case, build a linear path from all messages
		if (path.length === 1) {
			const sortedMessages = Array.from(this.messages.values())
				.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			this.activePath = sortedMessages.map(msg => msg.id);
		} else {
			this.activePath = path;
		}
	}

	/**
	 * Private helper to build full path from a starting path, including all descendants
	 */
	private buildFullPathFrom(startingPath: string[]): string[] {
		const fullPath = [...startingPath];
		let currentId: string | null = startingPath[startingPath.length - 1];

		while (currentId) {
			const message = this.messages.get(currentId);
			if (!message || message.childrenIds.length === 0) {
				break;
			}

			// Find which child is currently in the active path (if any)
			let nextChild: string | null = null;
			for (const childId of message.childrenIds) {
				const childMessage = this.messages.get(childId);
				if (childMessage && !fullPath.includes(childId)) {
					nextChild = childId;
					break;
				}
			}

			if (!nextChild) {
				// No more children to add
				break;
			}

			fullPath.push(nextChild);
			currentId = nextChild;
		}

		return fullPath;
	}

	/**
	 * Private helper to get path to a specific message
	 */
	private getPathToMessage(messageId: string): string[] {
		const path: string[] = [];
		let currentId: string | null = messageId;

		// Build path backwards from target to root
		while (currentId) {
			path.unshift(currentId);
			const message = this.messages.get(currentId);
			currentId = message?.parentId || null;
		}

		return path;
	}

	/**
	 * Private helper to switch to a specific branch
	 */
	private switchToBranch(messageId: string): void {
		const pathToMessage = this.getPathToMessage(messageId);
		this.activePath = pathToMessage;
	}

	/**
	 * Private helper to update reactive stores
	 */
	private updateStores(): void {
		this.activePathStore.set([...this.activePath]);
		
		// Update branch navigation info
		const branchNavigation: BranchNavigation[] = [];
		
		for (const messageId of this.activePath) {
			const message = this.messages.get(messageId);
			if (message && message.childrenIds.length > 1) {
				const siblingInfo = this.getSiblingInfo(messageId);
				branchNavigation.push({
					messageId,
					currentIndex: siblingInfo.currentIndex,
					totalBranches: siblingInfo.totalSiblings,
					childrenIds: message.childrenIds
				});
			}
		}
		
		this.branchNavigationStore.set(branchNavigation);
	}

	/**
	 * Get the current active message ID
	 */
	getCurrentActiveMessageId(): string | null {
		return this.activePath.length > 0 ? this.activePath[this.activePath.length - 1] : null;
	}

	/**
	 * Check if a message is in the active path
	 */
	isInActivePath(messageId: string): boolean {
		return this.activePath.includes(messageId);
	}

	/**
	 * Get the depth of a message in the tree
	 */
	getMessageDepth(messageId: string): number {
		const path = this.getPathToMessage(messageId);
		return path.length - 1;
	}

	/**
	 * Get all fork points (messages with multiple children)
	 */
	getForkPoints(): TreeNode[] {
		return Array.from(this.messages.values()).filter(msg => msg.childrenIds.length > 1);
	}
}
