import { writable, derived, type Writable } from 'svelte/store';
import { transformDbMessagesToView } from '$lib/db/chatUtils';

export type ChatMessage = {
	id: string;
	content: string;
	aiResponse: string | null;
	createdAt: string;
	isStreaming?: boolean;
};

export type Conversation = {
	id: string;
	roomName: string;
	createdAt: string;
	updatedAt: string;
	messageCount?: number;
	messages: ChatMessage[];
};

export function createChatStore(userId: string | null) {
	const messages = writable<ChatMessage[]>([]);
	const conversations = writable<Conversation[]>([]);
	const currentConversationId = writable<string | null>(null);
	const loading = writable(false);
	const error = writable('');

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

	let saveTimeout: ReturnType<typeof setTimeout>;
	function saveConversationsToStorage() {
		try {
			const currentData = { currentConversationId: getValue(currentConversationId) };
			localStorage.setItem(storageKey(), JSON.stringify(currentData));
		} catch {}
	}

	function debouncedSaveToStorage() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveConversationsToStorage, 500);
	}

	function loadConversationsFromStorage() {
		try {
			const raw = localStorage.getItem(storageKey());
			if (!raw) return;
			const parsed = JSON.parse(raw);
			currentConversationId.set(parsed.currentConversationId || null);
			messages.set([]);
		} catch {}
	}

	function transformDatabaseMessages(dbMessages: any[]): ChatMessage[] {
		return transformDbMessagesToView(dbMessages);
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

	async function selectConversation(id: string) {
		currentConversationId.set(id);
		const existing = getValue(conversations).find((c) => c.id === id);
		if (existing?.messages?.length) {
			messages.set(existing.messages);
			debouncedSaveToStorage();
			return;
		}
		if (id.startsWith('temp-')) {
			messages.set(existing?.messages || []);
			debouncedSaveToStorage();
			return;
		}
		try {
			const res = await fetch(`/api/chat?conversationId=${id}`);
			if (!res.ok) {
				messages.set([]);
				return;
			}
			const data = await res.json();
			const transformed = transformDatabaseMessages(data.messages || []);
			messages.set(transformed);
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
		const chatMessage: ChatMessage = {
			id: generateId(),
			content: messageContent,
			aiResponse: null,
			createdAt: new Date().toISOString(),
			isStreaming: true
		};
		messages.update((msgs) => [...msgs, chatMessage]);

		if (getValue(messages).length === 1) {
			updateConversationRoomName(messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent);
		}

		try {
			const history = getValue(messages)
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
		confirmDeleteAllConversations
	};
}


