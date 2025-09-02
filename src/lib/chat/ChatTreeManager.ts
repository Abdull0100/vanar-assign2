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
	attachedDocumentId?: string | null;
	attachedDocumentName?: string | null;
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

		console.log('Forking message:', {
			originalId: messageId,
			originalParentId: originalMessage.parentId,
			newContent: newContent.substring(0, 50)
		});

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

		console.log('Created forked message:', {
			id: forkedMessage.id,
			parentId: forkedMessage.parentId
		});

		// Add to messages map
		this.messages.set(forkedMessage.id, forkedMessage);

		// Update parent's children if exists
		if (originalMessage.parentId) {
			const parent = this.messages.get(originalMessage.parentId);
			if (parent) {
				parent.childrenIds.push(forkedMessage.id);
				this.messages.set(originalMessage.parentId, parent);
				console.log('Updated parent childrenIds:', parent.childrenIds);
			}
		} else {
			console.log('Original message has no parent (root message), forked message will also be root');
		}

		// Update active path to follow the new fork
		// Build path from root to the forked message
		const pathToForkedMessage = this.getPathToMessage(forkedMessage.id);
		console.log('Path to forked message:', pathToForkedMessage);
		this.activePath = pathToForkedMessage;
		this.updateStores();

		return forkedMessage;
	}

	/**
	 * Ensure virtual root is properly maintained
	 */
	private ensureVirtualRoot(): void {
		const virtualRoots = Array.from(this.messages.values()).filter(msg => msg.id.startsWith('virtual-root-'));
		if (virtualRoots.length === 0) return;

		const virtualRoot = virtualRoots[0];

		// Get all messages that are either:
		// 1. True root messages (no parentId)
		// 2. Messages whose parentId points to the virtual root
		const actualRootMessages = Array.from(this.messages.values()).filter(msg => {
			if (msg.id.startsWith('virtual-root-')) return false;
			if (!msg.parentId) return true; // True root messages
			return msg.parentId === virtualRoot.id; // Messages parented to virtual root
		});

		// Update virtual root's childrenIds if needed
		const currentChildren = new Set(virtualRoot.childrenIds);
		const actualRoots = new Set(actualRootMessages.map(msg => msg.id));

		// Check if we need to update childrenIds
		const needsUpdate = currentChildren.size !== actualRoots.size ||
			[...currentChildren].some(id => !actualRoots.has(id)) ||
			[...actualRoots].some(id => !currentChildren.has(id));

		if (needsUpdate) {
			virtualRoot.childrenIds = actualRootMessages.map(msg => msg.id);
			this.messages.set(virtualRoot.id, virtualRoot);
			console.log('Updated virtual root childrenIds:', virtualRoot.childrenIds);
		}

		// Ensure all root messages point to virtual root
		actualRootMessages.forEach(rootMsg => {
			if (rootMsg.parentId !== virtualRoot.id) {
				rootMsg.parentId = virtualRoot.id;
				this.messages.set(rootMsg.id, rootMsg);
			}
		});
	}

	/**
	 * Switch to a different branch at a fork point
	 */
	switchBranch(messageId: string): void {
		const message = this.messages.get(messageId);
		if (!message) {
			throw new Error(`Message ${messageId} not found`);
		}

		// Ensure virtual root is properly maintained before switching
		this.ensureVirtualRoot();

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
	getActiveConversation(includeVirtualRoots = false): TreeNode[] {
		if (includeVirtualRoots) {
			return this.activePath
				.map(id => this.messages.get(id))
				.filter(Boolean) as TreeNode[];
		}

		return this.activePath
			.map(id => this.messages.get(id))
			.filter(Boolean)
			.filter(msg => !msg!.id.startsWith('virtual-root-')) as TreeNode[]; // Exclude virtual root messages
	}

	/**
	 * Get the full active path including virtual roots (for navigation purposes)
	 */
	getFullActivePath(): string[] {
		return this.activePath;
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
				userId: msg.userId || '',
				attachedDocumentId: msg.attachedDocumentId || null,
				attachedDocumentName: msg.attachedDocumentName || null
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

		// Find the root messages (no parent)
		const rootMessages = Array.from(this.messages.values()).filter(msg => !msg.parentId);
		console.log('Found root messages:', rootMessages.length, rootMessages.map(m => ({ id: m.id, content: m.content.substring(0, 30) })));

		if (rootMessages.length > 1) {
			// Multiple root messages - create a virtual root to handle branching
			console.log('Multiple root messages detected - creating virtual root for branch navigation');

			// Check if virtual root already exists
			const existingVirtualRoots = Array.from(this.messages.values()).filter(msg => msg.id.startsWith('virtual-root-'));
			let virtualRootId: string;

			if (existingVirtualRoots.length > 0) {
				// Use existing virtual root
				virtualRootId = existingVirtualRoots[0].id;
				console.log('Using existing virtual root:', virtualRootId);
			} else {
				// Create deterministic virtual root ID based on conversation ID
				// Find conversation ID from any message
				const conversationId = rootMessages[0]?.conversationId || 'unknown';
				virtualRootId = `virtual-root-${conversationId}`;
				const virtualRoot: TreeNode = {
					id: virtualRootId,
					role: 'system',
					content: 'Conversation Root',
					parentId: null,
					childrenIds: rootMessages.map(msg => msg.id),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					conversationId: rootMessages[0].conversationId,
					userId: rootMessages[0].userId
				};

				// Add virtual root to messages
				this.messages.set(virtualRootId, virtualRoot);
				console.log('Virtual root created:', virtualRootId, 'with children:', virtualRoot.childrenIds);
			}

			// Update all root messages to point to virtual root
			rootMessages.forEach(rootMsg => {
				rootMsg.parentId = virtualRootId;
				this.messages.set(rootMsg.id, rootMsg);
			});

			// Use the most recent message overall to determine the active branch
			// Build path from root to the most recent message
			if (mostRecentMessage) {
				const pathToMostRecent = this.getPathToMessage(mostRecentMessage.id);
				this.activePath = this.buildFullPathFrom(pathToMostRecent);
				console.log('Setting active path to most recent message branch:', mostRecentMessage.id, 'path:', this.activePath);
			} else {
				// Fallback to most recent root message if no most recent message found
				const mostRecentRoot = rootMessages.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
				const pathToRecentRoot = this.getPathToMessage(mostRecentRoot.id);
				this.activePath = this.buildFullPathFrom(pathToRecentRoot);
				console.log('Fallback: Setting active path to most recent root branch:', mostRecentRoot.id, 'path:', this.activePath);
			}

		} else if (rootMessages.length === 1) {
			// Single root message - standard behavior
			console.log('Single root message - using standard path building');
			const rootPath = [rootMessages[0].id];
			this.activePath = this.buildFullPathFrom(rootPath);
		} else {
			// No root messages - fallback to linear
			console.log('No root messages found - using linear fallback');
			const sortedMessages = Array.from(this.messages.values())
				.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
			this.activePath = sortedMessages.map(msg => msg.id);
		}

		// Ensure virtual root is properly maintained
		this.ensureVirtualRoot();

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

			// Find the most recent child to continue the path
			let nextChild: string | null = null;
			let mostRecentTime = 0;

			for (const childId of message.childrenIds) {
				const childMessage = this.messages.get(childId);
				if (childMessage && !fullPath.includes(childId)) {
					const childTime = new Date(childMessage.updatedAt).getTime();
					if (childTime > mostRecentTime) {
						mostRecentTime = childTime;
						nextChild = childId;
					}
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
