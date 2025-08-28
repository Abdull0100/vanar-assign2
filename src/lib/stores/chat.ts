import { writable, derived, type Writable } from 'svelte/store';
import { transformDbMessagesToView } from '$lib/db/chatUtils';

// Define ChatMessage structure matching the specification
export type ChatMessage = {
	id: string;
	parentId?: string;           // Links to parent message
	versionGroupId: string;      // Groups all versions of the same logical message
	versionNumber: number;       // Increases with edits
	content: string;
	role: "user" | "assistant";
	aiResponse: string | null;
	createdAt: string;
	isStreaming?: boolean;
	updatedAt?: string;
	// Legacy fields for backward compatibility
	parentMessageId?: string;
	originalMessageId?: string;
	branchId?: string;
	messageIndex?: number;
	isForked?: boolean;
};

export type ConversationVersion = {
	id: string;
	messages: ChatMessage[];
	createdAt: string;
	versionNumber: number;
};

export type Conversation = {
	id: string;
	roomName: string;
	createdAt: string;
	updatedAt: string;
	messageCount?: number;
	messages: ChatMessage[];
	versions?: ConversationVersion[];
	currentVersionId?: string;
};

export function createChatStore(userId: string | null) {
	const messages = writable<ChatMessage[]>([]);
	const conversations = writable<Conversation[]>([]);
	const currentConversationId = writable<string | null>(null);
	const loading = writable(false);
	const error = writable('');

	// Store state: activeVersions maps versionGroupId to active message ID
	const activeVersions = writable<Map<string, string>>(new Map());

	// Legacy stores for backward compatibility
	const selectedVersionByBranch = writable<Record<string, string>>({});
	const activeBranchId = writable<string | null>(null);

	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; title: string } | null>(null);
	const showDeleteAllModal = writable(false);
	const deleteAllTarget = writable<{ title: string } | null>(null);

	let retryCountdown = 0;
	let retryTimer: ReturnType<typeof setInterval> | null = null;
	let errorRetryCount = 0;

	const storageKey = () => `vanar_conversations_${userId || 'anon'}`;
	const generateId = () => crypto.randomUUID();

	const currentConversation = derived(
		[conversations, currentConversationId],
		([$conversations, $currentConversationId]) =>
			$conversations.find((c) => c.id === $currentConversationId) || null
	);

	// Derived store for active transcript - only shows active versions and their children
	const activeTranscript = derived(
		[messages, activeVersions],
		([$messages, $activeVersions]) => {
			console.log('Building active transcript with', $messages.length, 'messages');
			const transcript: ChatMessage[] = [];
			const messageMap = new Map();
			$messages.forEach(msg => messageMap.set(msg.id, msg));

			const versionGroups = new Map<string, ChatMessage[]>();
			$messages.forEach(msg => {
				const groupId = msg.versionGroupId || msg.id;
				if (!versionGroups.has(groupId)) {
					versionGroups.set(groupId, []);
				}
				versionGroups.get(groupId)!.push(msg);
			});

			const getActiveVersion = (message: ChatMessage): ChatMessage => {
				const groupId = message.versionGroupId || message.id;
				if ($activeVersions.has(groupId)) {
					const activeId = $activeVersions.get(groupId)!;
					const activeMsg = messageMap.get(activeId);
					if (activeMsg) {
						console.log('Using active version for group', groupId, ':', activeId);
						return activeMsg;
					}
				}
				const versions = versionGroups.get(groupId) || [message];
				const latest = versions.reduce((latest, current) =>
					(current.versionNumber || 1) > (latest.versionNumber || 1) ? current : latest
				);
				console.log('Using latest version for group', groupId, ':', latest.id);
				return latest;
			};

			const followBranch = (msg: ChatMessage, currentTranscript: ChatMessage[], visited: Set<string>) => {
				if (visited.has(msg.id)) return;
				visited.add(msg.id);

				const activeMsg = getActiveVersion(msg);
				console.log('Adding message to transcript:', activeMsg.id, activeMsg.content.substring(0, 50));
				currentTranscript.push(activeMsg);

				const children = $messages.filter(m => m.parentId === activeMsg.id);
				console.log('Found', children.length, 'children for message', activeMsg.id);
				for (const child of children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
					followBranch(child, currentTranscript, visited);
				}
			};

			const roots = $messages.filter(m => !m.parentId);
			console.log('Found', roots.length, 'root messages');
			const visited = new Set<string>();
			for (const root of roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
				followBranch(root, transcript, visited);
			}
			
			console.log('Built transcript with', transcript.length, 'messages');
			return transcript;
		}
	);

	let saveTimeout: ReturnType<typeof setTimeout>;
	function saveConversationsToStorage() {
		try {
			const currentData = { 
				currentConversationId: getValue(currentConversationId),
				activeVersions: Object.fromEntries(getValue(activeVersions))
			};
			localStorage.setItem(storageKey(), JSON.stringify(currentData));
		} catch {}
	}

	function debouncedSaveToStorage() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveConversationsToStorage, 500);
	}

	function loadConversationsFromStorage() {
		// Always add sample conversations for demonstration
		const sampleConversations: Conversation[] = [
			{
				id: 'sample-1',
				roomName: 'How are you?',
				createdAt: new Date(Date.now() - 86400000).toISOString(),
				updatedAt: new Date(Date.now() - 86400000).toISOString(),
				messageCount: 2,
				messages: []
			},
			{
				id: 'sample-2',
				roomName: 'Tell me about some of the latest AI developments',
				createdAt: new Date(Date.now() - 172800000).toISOString(),
				updatedAt: new Date(Date.now() - 172800000).toISOString(),
				messageCount: 5,
				messages: []
			},
			{
				id: 'sample-3',
				roomName: 'I am good',
				createdAt: new Date(Date.now() - 259200000).toISOString(),
				updatedAt: new Date(Date.now() - 259200000).toISOString(),
				messageCount: 3,
				messages: []
			},
			{
				id: 'sample-4',
				roomName: 'HY BRO',
				createdAt: new Date(Date.now() - 345600000).toISOString(),
				updatedAt: new Date(Date.now() - 345600000).toISOString(),
				messageCount: 4,
				messages: []
			},
			{
				id: 'sample-5',
				roomName: 'New Chat',
				createdAt: new Date(Date.now() - 432000000).toISOString(),
				updatedAt: new Date(Date.now() - 432000000).toISOString(),
				messageCount: 1,
				messages: []
			},
			{
				id: 'sample-6',
				roomName: 'Another conversation about technology',
				createdAt: new Date(Date.now() - 518400000).toISOString(),
				updatedAt: new Date(Date.now() - 518400000).toISOString(),
				messageCount: 6,
				messages: []
			},
			{
				id: 'sample-7',
				roomName: 'Quick question about programming',
				createdAt: new Date(Date.now() - 604800000).toISOString(),
				updatedAt: new Date(Date.now() - 604800000).toISOString(),
				messageCount: 2,
				messages: []
			},
			{
				id: 'sample-8',
				roomName: 'Discussion about web development',
				createdAt: new Date(Date.now() - 691200000).toISOString(),
				updatedAt: new Date(Date.now() - 691200000).toISOString(),
				messageCount: 8,
				messages: []
			},
			{
				id: 'sample-9',
				roomName: 'AI and machine learning chat',
				createdAt: new Date(Date.now() - 777600000).toISOString(),
				updatedAt: new Date(Date.now() - 777600000).toISOString(),
				messageCount: 7,
				messages: []
			},
			{
				id: 'sample-10',
				roomName: 'General conversation',
				createdAt: new Date(Date.now() - 864000000).toISOString(),
				updatedAt: new Date(Date.now() - 864000000).toISOString(),
				messageCount: 3,
				messages: []
			}
		];
		conversations.set(sampleConversations);
		if (sampleConversations.length > 0) {
			currentConversationId.set(sampleConversations[0].id);
		}
		
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) {
				const parsed = JSON.parse(raw);
				currentConversationId.set(parsed.currentConversationId || sampleConversations[0].id);
				if (parsed.activeVersions) {
					activeVersions.set(new Map(Object.entries(parsed.activeVersions)));
				}
			}
			messages.set([]);
		} catch {}
	}

	function transformDatabaseMessages(dbMessages: any[]): ChatMessage[] {
		console.log('Transforming', dbMessages.length, 'database messages');
		const transformed = transformDbMessagesToView(dbMessages).map(msg => {
			const result = {
				...msg,
				// Map legacy fields to new structure
				versionGroupId: msg.versionGroupId || msg.id,
				versionNumber: msg.versionNumber || 1,
				parentId: msg.parentMessageId,
				role: (msg.aiResponse ? "assistant" : "user") as "user" | "assistant",
				// Keep legacy fields for backward compatibility
				parentMessageId: msg.parentMessageId,
				originalMessageId: msg.originalMessageId,
				branchId: msg.branchId,
				messageIndex: msg.messageIndex,
				isForked: msg.isForked || false
			};
			console.log('Transformed message:', result.id, 'parentId:', result.parentId, 'versionGroupId:', result.versionGroupId);
			return result;
		});
		console.log('Transformed', transformed.length, 'messages');
		return transformed;
	}

	// Helper: find message by ID
	function findMessageById(messageId: string): ChatMessage | undefined {
		const currentMessages = getValue(messages);
		return currentMessages.find(m => m.id === messageId);
	}

	// Helper: follow active branch (recursive)
	function followBranch(msg: ChatMessage, transcript: ChatMessage[]): void {
		const currentActiveVersions = getValue(activeVersions);
		
		// Get currently active version for this group
		const activeId = currentActiveVersions.get(msg.versionGroupId) || msg.id;
		const activeMsg = findMessageById(activeId);
		
		if (!activeMsg) return;
		
		transcript.push(activeMsg);
		
		// Now get children of this active message
		const currentMessages = getValue(messages);
		const children = currentMessages.filter(m => m.parentId === activeMsg.id);
		
		for (const child of children) {
			followBranch(child, transcript);
		}
	}

	// Build transcript based on active versions
	function buildTranscript(): ChatMessage[] {
		const transcript: ChatMessage[] = [];
		const currentMessages = getValue(messages);
		
		// Start from root messages (no parentId)
		const roots = currentMessages.filter(m => !m.parentId);
		
		for (const root of roots) {
			followBranch(root, transcript);
		}
		
		return transcript;
	}

	// Create a new message
	function addMessage(content: string, parentId?: string): ChatMessage {
		const msg: ChatMessage = {
			id: generateId(),
			parentId: parentId,
			versionGroupId: generateId(), // new group for original message
			versionNumber: 1,
			content,
			role: "user",
			aiResponse: null,
			createdAt: new Date().toISOString(),
			isStreaming: true
		};
		
		messages.update(msgs => [...msgs, msg]);
		
		// Mark new version as active
		activeVersions.update(versions => {
			const newVersions = new Map(versions);
			newVersions.set(msg.versionGroupId, msg.id);
			return newVersions;
		});
		
		return msg;
	}

	// Fork (edit) an existing message
	function forkMessage(messageId: string, newContent: string): ChatMessage | null {
		const oldMsg = findMessageById(messageId);
		if (!oldMsg) return null;
		
		const newMsg: ChatMessage = {
			id: generateId(),
			parentId: oldMsg.parentId,
			versionGroupId: oldMsg.versionGroupId,   // keep group same
			versionNumber: oldMsg.versionNumber + 1, // increment
			content: newContent,
			role: oldMsg.role,
			aiResponse: null,
			createdAt: new Date().toISOString(),
			isStreaming: true
		};
		
		// Keep both old + new versions in messages
		messages.update(msgs => [...msgs, newMsg]);
		
		// Mark new version as active
		activeVersions.update(versions => {
			const newVersions = new Map(versions);
			newVersions.set(newMsg.versionGroupId, newMsg.id);
			return newVersions;
		});
		
		return newMsg;
	}

	// Switch to a specific version manually
	async function setActiveVersion(versionGroupId: string, messageId: string): Promise<void> {
		// Update active versions map
		activeVersions.update(versions => {
			const newVersions = new Map(versions);
			newVersions.set(versionGroupId, messageId);
			return newVersions;
		});

		// Reload only the affected branch to ensure clean state
		const currentConvId = getValue(currentConversationId);
		if (currentConvId) {
			const currentActiveVersions = Object.fromEntries(getValue(activeVersions));
			await selectConversation(currentConvId, undefined, currentActiveVersions);
		}
	}

	async function loadChatHistory() {
		try {
			const response = await fetch('/api/chat');
			if (!response.ok) return;
			const data = await response.json();
			if (!data.conversations || !Array.isArray(data.conversations)) return;

			const dbConversations: Conversation[] = data.conversations.map((conv: any) => ({
				id: conv.id,
				roomName: conv.roomName || conv.title || 'Untitled Room',
				createdAt: conv.createdAt,
				updatedAt: conv.updatedAt,
				messageCount: conv.messageCount || 0,
				messages: []
			}));

			const nonEmptyDbConversations = dbConversations.filter((c) => (c.messageCount || 0) > 0);
			const tempConversations = getValue(conversations).filter((c) => c.id.startsWith('temp-'));
			const preservedTempConversations = tempConversations.map((t) => ({ ...t, messages: t.messages || [] }));
			const finalMergedConversations = [...preservedTempConversations, ...nonEmptyDbConversations];
			conversations.set(finalMergedConversations);

			const currentId = getValue(currentConversationId);
			if (!currentId && finalMergedConversations.length > 0) {
				const first = finalMergedConversations[0];
				currentConversationId.set(first.id);
				await selectConversation(first.id);
			} else if (currentId) {
				const exists = finalMergedConversations.find((c) => c.id === currentId);
				if (!exists || (exists.messageCount || 0) === 0) {
					currentConversationId.set(null);
					messages.set([]);
				} else if (getValue(messages).length === 0) {
					await selectConversation(currentId);
				}
			}

			debouncedSaveToStorage();
		} catch {}
	}

	async function selectConversation(id: string, branchId?: string, activeVersionsMap?: Record<number, string>) {
		currentConversationId.set(id);
		const existing = getValue(conversations).find((c) => c.id === id);
		if (existing?.messages?.length && !branchId) {
			// Apply new transcript building
			const transformed = transformDatabaseMessages(existing.messages);
			messages.set(transformed);
			debouncedSaveToStorage();
			return;
		}
		if (id.startsWith('temp-')) {
			messages.set(existing?.messages || []);
			debouncedSaveToStorage();
			return;
		}
		try {
			let url = `/api/chat?conversationId=${id}`;
			if (branchId) {
				url += `&activeBranchId=${branchId}`;
			}
			
			// Use provided activeVersionsMap or get current activeVersions from store
			const currentActiveVersions = activeVersionsMap || Object.fromEntries(getValue(activeVersions));
			if (currentActiveVersions && Object.keys(currentActiveVersions).length > 0) {
				const activeVersionsParam = JSON.stringify(currentActiveVersions);
				url += `&activeVersions=${encodeURIComponent(activeVersionsParam)}`;
			}
			
			const res = await fetch(url);
			if (!res.ok) {
				messages.set([]);
				return;
			}
			const data = await res.json();
			const transformed = transformDatabaseMessages(data.messages || []);
			
			// Set all messages (including all versions)
			messages.set(transformed);
			
			// Update active branch ID and versions
			if (data.activeBranchId) {
				activeBranchId.set(data.activeBranchId);
			}
			if (data.activeVersions) {
				activeVersions.set(new Map(Object.entries(data.activeVersions)));
			}
			
			conversations.update((convs) => convs.map((c) => (c.id === id ? { ...c, messages: transformed, messageCount: transformed.length } : c)));
		} catch {
			messages.set([]);
		}
		debouncedSaveToStorage();
	}

	function newConversation() {
		const tempId = `temp-${generateId()}`;
		const newConv: Conversation = {
			id: tempId,
			roomName: 'New Chat',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			messageCount: 0,
			messages: []
		};
		conversations.update((convs) => [newConv, ...convs]);
		currentConversationId.set(tempId);
		messages.set([]);
		debouncedSaveToStorage();
	}

	function updateConversationRoomName(roomName: string) {
		const id = getValue(currentConversationId);
		if (!id) return;
		conversations.update((convs) => convs.map((c) => (c.id === id ? { ...c, roomName, updatedAt: new Date().toISOString() } : c)));
		debouncedSaveToStorage();
	}

	let syncTimeout: ReturnType<typeof setTimeout>;
	function debouncedSyncMessages() {
		clearTimeout(syncTimeout);
		syncTimeout = setTimeout(() => {
			const id = getValue(currentConversationId);
			const msgs = getValue(messages);
			if (!id || !msgs) return;
			conversations.update((convs) =>
				convs.map((c) => (c.id === id ? { ...c, messages: [...msgs], updatedAt: new Date().toISOString(), messageCount: msgs.length } : c))
			);
		}, 300);
	}

	messages.subscribe(() => debouncedSyncMessages());

	function startRetryCountdown(seconds: number) {
		retryCountdown = seconds;
		errorRetryCount++;
		if (retryTimer) clearInterval(retryTimer);
		retryTimer = setInterval(() => {
			retryCountdown--;
			if (retryCountdown <= 0 && retryTimer) {
				clearInterval(retryTimer);
				retryTimer = null;
			}
		}, 1000);
	}

	function clearErrorState() {
		error.set('');
		retryCountdown = 0;
		errorRetryCount = 0;
		if (retryTimer) clearInterval(retryTimer);
		retryTimer = null;
	}

	function canRetryNow() {
		return retryCountdown <= 0;
	}

	function getTimeUntilRetry() {
		if (retryCountdown <= 0) return 'Ready to retry';
		const minutes = Math.floor(retryCountdown / 60);
		const seconds = retryCountdown % 60;
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
	}

	async function sendMessage(messageText: string) {
		const messageContent = messageText.trim();
		if (!messageContent || getValue(loading)) return;
		loading.set(true);
		error.set('');
		if (!getValue(currentConversationId)) {
			newConversation();
			await new Promise((r) => setTimeout(r, 0));
		}
		
		// Get the last message to use as parent
		const currentMessages = getValue(messages);
		const lastMessage = currentMessages[currentMessages.length - 1];
		const parentId = lastMessage?.id;
		
		// Create new message using the new system
		const chatMessage = addMessage(messageContent, parentId);

		if (getValue(messages).length === 1) {
			updateConversationRoomName(messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent);
		}

		try {
			// Build transcript for API call (only active versions)
			const transcript = buildTranscript();
			const history = transcript
				.filter((m) => m.aiResponse)
				.slice(0, -1)
				.map((m) => ({ message: m.content, response: m.aiResponse }));
			
			const convId = getValue(currentConversationId);
			const apiConversationId = convId && convId.startsWith('temp-') ? undefined : convId;
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageContent, history, conversationId: apiConversationId })
			});

			if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let streamedResponse = '';
				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunk = decoder.decode(value);
						const lines = chunk.split('\n');
						for (const line of lines) {
							if (!line.startsWith('data: ')) continue;
							try {
								const data = JSON.parse(line.slice(6));
								if (data.error) {
									error.set(data.error);
									if (data.error.includes('rate limit') || data.error.includes('quota') || data.error.includes('high demand')) startRetryCountdown(60);
									messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
									break;
								}
								if (data.chunk) {
									streamedResponse += data.chunk;
									messages.update((msgs) => msgs.map((m) => (m.id === chatMessage.id ? { ...m, aiResponse: streamedResponse } : m)));
								}
								if (data.done) {
									messages.update((msgs) => msgs.map((m) => (m.id === chatMessage.id ? { ...m, isStreaming: false } : m)));
									if (data.conversationId && getValue(currentConversationId) !== data.conversationId) {
										const cid = getValue(currentConversationId);
										if (cid) {
											conversations.update((convs) => convs.map((c) => (c.id === cid ? { ...c, id: data.conversationId, messages: getValue(messages) } : c)));
										}
										currentConversationId.set(data.conversationId);
										setTimeout(() => loadChatHistory(), 100);
									}
								}
							} catch {}
						}
					}
				}
			} else {
				const data = await response.json();
				if (response.ok) {
					messages.update((msgs) => msgs.map((m) => (m.id === chatMessage.id ? { ...m, aiResponse: data.response, isStreaming: false } : m)));
					if (data.conversationId && getValue(currentConversationId) !== data.conversationId) {
						const cid = getValue(currentConversationId);
						if (cid) {
							conversations.update((conversations) =>
								conversations.map((c) => (c.id === cid ? { ...c, id: data.conversationId, messages: getValue(messages) } : c))
							);
						}
						currentConversationId.set(data.conversationId);
						setTimeout(() => loadChatHistory(), 100);
					}
				} else {
					error.set(data.error || 'Failed to get response from AI');
					messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
				}
			}
		} catch {
			error.set('An error occurred while sending message. Please try again.');
			messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
		} finally {
			loading.set(false);
		}
	}

	function openDeleteModal(id: string, title: string) {
		deleteTarget.set({ id, title });
		showDeleteModal.set(true);
	}

	function closeDeleteModal() {
		showDeleteModal.set(false);
		deleteTarget.set(null);
	}

	async function confirmDeleteConversation() {
		const target = getValue(deleteTarget);
		if (!target) return;
		closeDeleteModal();
		const { id } = target;
		const conv = getValue(conversations).find((c) => c.id === id);
		if (!conv) return;
		if (!id.startsWith('temp-') && (conv.messageCount || 0) > 0) {
			try {
				await fetch('/api/chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationIds: [id] }) });
			} catch {}
		}
		conversations.update((convs) => convs.filter((c) => c.id !== id));
		if (getValue(currentConversationId) === id) {
			const remaining = getValue(conversations);
			if (remaining.length > 0) {
				const next = remaining[0];
				currentConversationId.set(next.id);
				messages.set([...next.messages]);
			} else {
				currentConversationId.set(null);
				messages.set([]);
			}
		}
		debouncedSaveToStorage();
	}

	function openDeleteAllModal() {
		deleteAllTarget.set({ title: 'ALL chat history' });
		showDeleteAllModal.set(true);
	}
	function closeDeleteAllModal() {
		showDeleteAllModal.set(false);
		deleteAllTarget.set(null);
	}
	async function confirmDeleteAllConversations() {
		const target = getValue(deleteAllTarget);
		if (!target) return;
		closeDeleteAllModal();
		try {
			await fetch('/api/chat', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
		} catch {}
		conversations.set([]);
		messages.set([]);
		currentConversationId.set(null);
		debouncedSaveToStorage();
	}

	// Legacy fork message function - now uses the new system
	async function forkMessageLegacy(messageId: string, editedContent: string) {
		loading.set(true);
		error.set('');
		
		try {
			const conversationId = getValue(currentConversationId);
			if (!conversationId) {
				error.set('No active conversation');
				return;
			}

			console.log('Forking message:', messageId, 'with content:', editedContent);

			const response = await fetch('/api/chat/fork', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					conversationId,
					messageId, 
					editedContent 
				})
			});

			console.log('Fork response status:', response.status);
			console.log('Fork response headers:', response.headers.get('content-type'));

			if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
				console.log('Processing streaming response...');
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let streamedResponse = '';
				let forkedMessageId: string | null = null;
				
				if (reader) {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						const chunk = decoder.decode(value);
						const lines = chunk.split('\n');
						for (const line of lines) {
							if (!line.startsWith('data: ')) continue;
							try {
								const data = JSON.parse(line.slice(6));
								console.log('Stream data:', data);
								
								if (data.error) {
									console.error('Stream error:', data.error);
									error.set(data.error);
									break;
								}
								
								if (data.forkedMessage && !forkedMessageId) {
									console.log('Received forked message:', data.forkedMessage);
									// Add the forked message to the store
									const forkedMessage = transformDatabaseMessages([data.forkedMessage])[0];
									messages.update(msgs => [...msgs, forkedMessage]);
									forkedMessageId = forkedMessage.id;
									console.log('Added forked message to store:', forkedMessageId);
									
									// Set the forked message as the active version
									activeVersions.update(versions => {
										const newVersions = new Map(versions);
										newVersions.set(forkedMessage.versionGroupId, forkedMessage.id);
										console.log('Set active version for group', forkedMessage.versionGroupId, 'to', forkedMessage.id);
										return newVersions;
									});
								}
								
								if (data.chunk && forkedMessageId) {
									streamedResponse += data.chunk;
									console.log('Updating streamed response, length:', streamedResponse.length);
									messages.update((msgs) => msgs.map((m) => 
										m.id === forkedMessageId ? { ...m, aiResponse: streamedResponse, isStreaming: true } : m
									));
								}
								
								if (data.done && forkedMessageId) {
									console.log('Stream completed for message:', forkedMessageId);
									messages.update((msgs) => msgs.map((m) => 
										m.id === forkedMessageId ? { ...m, isStreaming: false } : m
									));
								}
							} catch (parseError) {
								console.error('Error parsing stream data:', parseError, 'Line:', line);
							}
						}
					}
				}
			} else {
				console.log('Processing non-streaming response...');
				const data = await response.json();
				console.log('Non-streaming response data:', data);
				
				if (response.ok) {
					// Add the forked message to the store
					if (data.forkedMessage) {
						const forkedMessage = transformDatabaseMessages([data.forkedMessage])[0];
						messages.update(msgs => [...msgs, forkedMessage]);
						console.log('Added forked message to store (non-streaming):', forkedMessage.id);
						
						// Set the forked message as the active version
						activeVersions.update(versions => {
							const newVersions = new Map(versions);
							newVersions.set(forkedMessage.versionGroupId, forkedMessage.id);
							console.log('Set active version for group', forkedMessage.versionGroupId, 'to', forkedMessage.id);
							return newVersions;
						});
						
						// Update with AI response if available
						if (data.response) {
							messages.update((msgs) => msgs.map((m) => 
								m.id === forkedMessage.id ? { ...m, aiResponse: data.response, isStreaming: false } : m
							));
							console.log('Updated message with AI response');
						}
					}
				} else {
					console.error('Fork API error:', data.error);
					error.set(data.error || 'Failed to fork message');
				}
			}
		} catch (err) {
			console.error('Fork message error:', err);
			error.set('Failed to fork message');
			// Remove any temporary messages that might have been added
			messages.update(msgs => msgs.filter(m => !m.isStreaming || m.aiResponse));
		} finally {
			loading.set(false);
		}
	}

	// Get branch versions for a message (legacy compatibility)
	async function getBranchVersions(messageId: string) {
		try {
			const response = await fetch(`/api/chat/branches?messageId=${messageId}`);
			if (response.ok) {
				const data = await response.json();
				return data.versions || [];
			}
		} catch (error) {
			console.error('Get branch versions error:', error);
		}
		return [];
	}

	// Set active version for a branch (legacy compatibility)
	async function setActiveVersionLegacy(branchId: string, versionId: string) {
		selectedVersionByBranch.update(versions => ({
			...versions,
			[branchId]: versionId
		}));

		try {
			const response = await fetch(`/api/chat/branches?messageId=${branchId}`);
			if (response.ok) {
				const data = await response.json();
				const versions = data.versions || [];
				const selectedVersion = versions.find((v: any) => v.id === versionId);
				
				if (selectedVersion) {
					// Update active versions map using new system
					setActiveVersion(selectedVersion.versionGroupId, selectedVersion.id);

					// Reload the conversation with the new active versions
					const currentConvId = getValue(currentConversationId);
					if (currentConvId) {
						const currentActiveVersions = Object.fromEntries(getValue(activeVersions));
						await selectConversation(currentConvId, undefined, currentActiveVersions);
					}
				}
			}
		} catch (err) {
			console.error('Failed to update message content for version:', err);
		}
	}

	function getValue<T>(store: Writable<T>): T {
		let v: T;
		store.subscribe((val) => (v = val))();
		// @ts-ignore v is set synchronously by subscribe
		return v;
	}

	return {
		// state
		messages,
		conversations,
		currentConversationId,
		loading,
		error,
		showDeleteModal,
		deleteTarget,
		showDeleteAllModal,
		deleteAllTarget,
		currentConversation,
		activeBranchId,
		activeVersions,
		activeTranscript,
		// actions
		loadConversationsFromStorage,
		loadChatHistory,
		selectConversation,
		newConversation,
		updateConversationRoomName,
		debouncedSaveToStorage,
		startRetryCountdown,
		clearErrorState,
		canRetryNow,
		getTimeUntilRetry,
		sendMessage,
		openDeleteModal,
		closeDeleteModal,
		confirmDeleteConversation,
		openDeleteAllModal,
		closeDeleteAllModal,
		confirmDeleteAllConversations,
		// New versioning system
		addMessage,
		forkMessage: forkMessageLegacy, // Legacy compatibility
		setActiveVersion,
		buildTranscript,
		findMessageById,
		// Legacy compatibility
		getBranchVersions,
		setActiveVersionLegacy,
		selectedVersionByBranch
	};
}


