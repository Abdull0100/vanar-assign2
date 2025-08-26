import { writable, derived, get, type Writable } from 'svelte/store';
import { transformDbMessagesToView } from '$lib/db/chatUtils';

export type ChatMessage = {
	id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	createdAt: string;
	isStreaming?: boolean;
	previousId?: string | null; // For forking: original message you edited/regenerated from
	versionNumber?: number; // Version number for multiple forks
	parentId?: string | null; // Direct previous message (conversation flow)
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
	// Core state
	const messages = writable<ChatMessage[]>([]);
	const conversations = writable<Conversation[]>([]);
	const currentRoomId = writable<string | null>(null);
	const loading = writable(false);
	const errorStore = writable(''); // primary store for errors

	// Also expose `error` for backward compatibility (so existing code that expects `error` still works)
	const error = {
		subscribe: errorStore.subscribe,
		set: (v: string) => errorStore.set(v)
	};

	// Forking state
	const activeVersions = writable<Map<string, number>>(new Map()); // messageId -> active version number
	const forkingLoading = writable(false);

	// Delete modals
	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; title: string } | null>(null);
	const showDeleteAllModal = writable(false);
	const deleteAllTarget = writable<{ title: string } | null>(null);

	// Retry state
	let retryCountdown = 0;
	let retryTimer: ReturnType<typeof setInterval> | null = null;
	let errorRetryCount = 0;

	// Utils
	const storageKey = () => `vanar_conversations_${userId || 'anon'}`;
	const generateId = () => crypto.randomUUID();

	const currentConversation = derived(
		[conversations, currentRoomId],
		([$conversations, $currentRoomId]) =>
			$conversations.find((c) => c.id === $currentRoomId) || null
	);

	// --- Local storage -------------------------------------------------------
	let saveTimeout: ReturnType<typeof setTimeout>;
	function saveConversationsToStorage() {
		try {
			const currentData = {
				currentRoomId: get(currentRoomId),
				activeVersions: Object.fromEntries(get(activeVersions))
			};
			localStorage.setItem(storageKey(), JSON.stringify(currentData));
		} catch {
			// ignore
		}
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
			currentRoomId.set(parsed.currentRoomId || null);
			if (parsed.activeVersions) {
				activeVersions.set(
					new Map(
						Object.entries(parsed.activeVersions).map(([k, v]) => [k, Number(v)])
					)
				);
			}
			// We intentionally reset `messages` so `selectConversation` can hydrate fresh
			messages.set([]);
		} catch {
			// ignore
		}
	}

	// --- Loading / selection -------------------------------------------------
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
			const tempConversationsOnly = get(conversations).filter((c) => c.id.startsWith('temp-'));
			const preservedTempConversations = tempConversationsOnly.map((t) => ({
				...t,
				messages: t.messages || []
			}));
			const finalMergedConversations = [...preservedTempConversations, ...nonEmptyDbConversations];
			conversations.set(finalMergedConversations);

			const currentId = get(currentRoomId);
			if (!currentId && finalMergedConversations.length > 0) {
				const first = finalMergedConversations[0];
				currentRoomId.set(first.id);
				await selectConversation(first.id);
			} else if (currentId) {
				const exists = finalMergedConversations.find((c) => c.id === currentId);
				if (!exists || (exists.messageCount || 0) === 0) {
					currentRoomId.set(null);
					messages.set([]);
				} else if (get(messages).length === 0) {
					await selectConversation(currentId);
				}
			}

			debouncedSaveToStorage();
		} catch {
			// ignore network errors here
		}
	}

	async function selectConversation(id: string) {
		currentRoomId.set(id);
		const existing = get(conversations).find((c) => c.id === id);
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
			const res = await fetch(`/api/chat?roomId=${id}`);
			if (!res.ok) {
				messages.set([]);
				return;
			}
			const data = await res.json();
			const transformed = transformDatabaseMessages(data.messages || []);
			messages.set(transformed);
			conversations.update((convs) =>
				convs.map((c) =>
					c.id === id ? { ...c, messages: transformed, messageCount: transformed.length } : c
				)
			);
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
		currentRoomId.set(tempId);
		messages.set([]);
		debouncedSaveToStorage();
	}

	function updateConversationRoomName(roomName: string) {
		const id = get(currentRoomId);
		if (!id) return;
		conversations.update((convs) =>
			convs.map((c) =>
				c.id === id ? { ...c, roomName, updatedAt: new Date().toISOString() } : c
			)
		);
		debouncedSaveToStorage();
	}

	// Keep conversation.messages in sync
	let syncTimeout: ReturnType<typeof setTimeout>;
	function debouncedSyncMessages() {
		clearTimeout(syncTimeout);
		syncTimeout = setTimeout(() => {
			const id = get(currentRoomId);
			const msgs = get(messages);
			if (!id || !msgs) return;
			conversations.update((convs) =>
				convs.map((c) =>
					c.id === id
						? {
								...c,
								messages: [...msgs],
								updatedAt: new Date().toISOString(),
								messageCount: msgs.length
						  }
						: c
				)
			);
		}, 300);
	}
	messages.subscribe(() => debouncedSyncMessages());

	// --- Retry helpers -------------------------------------------------------
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
		errorStore.set('');
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

	// --- Send message (SSE) --------------------------------------------------
	async function sendMessage(messageText: string) {
		const messageContent = messageText.trim();
		if (!messageContent || get(loading)) return;
		loading.set(true);
		errorStore.set('');
		if (!get(currentRoomId)) {
			newConversation();
			// allow state to propagate
			await new Promise((r) => setTimeout(r, 0));
		}
		const chatMessage: ChatMessage = {
			id: generateId(),
			role: 'user',
			content: messageContent,
			createdAt: new Date().toISOString(),
			isStreaming: false
		};

		// Avoid race by computing updated length inside the updater
		messages.update((msgs) => {
			const updated = [...msgs, chatMessage];
			if (updated.length === 1) {
				updateConversationRoomName(
					messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent
				);
			}
			return updated;
		});

		try {
			const history = get(messages)
				.filter((m) => m.role === 'assistant')
				.slice(0, -1)
				.map((m) => ({ message: m.content, response: m.content }));

			const convId = get(currentRoomId);
			const apiRoomId = convId && convId.startsWith('temp-') ? undefined : convId;

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: messageContent, history, roomId: apiRoomId })
			});

			if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
				const reader = response.body?.getReader();
				const decoder = new TextDecoder();
				let streamedResponse = '';
				let assistantMessageId: string | null = null;

				if (reader) {
					let buffer = '';
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						buffer += decoder.decode(value, { stream: true });

						const lines = buffer.split('\n');
						buffer = lines.pop() || ''; // keep last incomplete line

						for (const line of lines) {
							// tolerate keep-alives or comments
							if (!line.startsWith('data: ')) continue;
							const payload = line.slice(6).trim();
							if (!payload) continue;

							try {
								const data = JSON.parse(payload);

								if (data.error) {
									errorStore.set(data.error);
									if (
										data.error.includes('rate limit') ||
										data.error.includes('quota') ||
										data.error.includes('high demand')
									)
										startRetryCountdown(60);

									// remove the just-added user message to keep UI consistent
									messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
									break;
								}

								if (data.chunk) {
									streamedResponse += data.chunk;

									if (!assistantMessageId) {
										const assistantMessage: ChatMessage = {
											id: generateId(),
											role: 'assistant',
											content: streamedResponse,
											createdAt: new Date().toISOString(),
											isStreaming: true
										};
										assistantMessageId = assistantMessage.id;
										messages.update((msgs) => [...msgs, assistantMessage]);
									} else {
										messages.update((msgs) =>
											msgs.map((m) =>
												m.id === assistantMessageId ? { ...m, content: streamedResponse } : m
											)
										);
									}
								}

								if (data.done) {
									// mark complete
									messages.update((msgs) =>
										msgs.map((m) =>
											m.id === assistantMessageId ? { ...m, isStreaming: false } : m
										)
									);

									// room id may be created server-side for temp rooms
									if (data.roomId && get(currentRoomId) !== data.roomId) {
										const cid = get(currentRoomId);
										if (cid) {
											conversations.update((convs) =>
												convs.map((c) =>
													c.id === cid
														? { ...c, id: data.roomId, messages: get(messages) }
														: c
												)
											);
										}
										currentRoomId.set(data.roomId);
										setTimeout(() => loadChatHistory(), 100);
									} else {
										setTimeout(async () => {
											const currentId = get(currentRoomId);
											if (currentId && !currentId.startsWith('temp-')) {
												await selectConversation(currentId);
											}
										}, 500);
									}
								}
							} catch {
								// ignore malformed JSON lines
							}
						}
					}
				}
			} else {
				// Non-streaming path
				const data = await response.json();
				if (response.ok) {
					const assistantMessage: ChatMessage = {
						id: generateId(),
						role: 'assistant',
						content: data.response,
						createdAt: new Date().toISOString(),
						isStreaming: false
					};
					messages.update((msgs) => [...msgs, assistantMessage]);

					if (data.roomId && get(currentRoomId) !== data.roomId) {
						const cid = get(currentRoomId);
						if (cid) {
							conversations.update((conversations) =>
								conversations.map((c) =>
									c.id === cid ? { ...c, id: data.roomId, messages: get(messages) } : c
								)
							);
						}
						currentRoomId.set(data.roomId);
						setTimeout(() => loadChatHistory(), 100);
					} else {
						setTimeout(async () => {
							const currentId = get(currentRoomId);
							if (currentId && !currentId.startsWith('temp-')) {
								await selectConversation(currentId);
							}
						}, 500);
					}
				} else {
					errorStore.set(data.error || 'Failed to get response from AI');
					messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
				}
			}
		} catch {
			errorStore.set('An error occurred while sending message. Please try again.');
			messages.update((msgs) => msgs.filter((m) => m.id !== chatMessage.id));
		} finally {
			loading.set(false);
		}
	}

	// --- Forking -------------------------------------------------------------
	async function forkUserMessage(messageId: string, newContent: string) {
		if (get(forkingLoading)) return;

		forkingLoading.set(true);
		errorStore.set('');

		try {
			const res = await fetch(`/api/messages/${messageId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ newContent })
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to fork message');
			}

			// Expecting API to return both messages + version numbers
			const currentMessages = get(messages);
			const originalMessageIndex = currentMessages.findIndex((m) => m.id === messageId);

			if (originalMessageIndex !== -1) {
				const forkedUserMessage: ChatMessage = {
					id: data.forkedUserMessage.id,
					role: 'user',
					content: data.forkedUserMessage.content,
					createdAt: new Date().toISOString(),
					previousId: data.forkedUserMessage.previousId ?? messageId,
					versionNumber: data.forkedUserMessage.versionNumber ?? calcNextVersion(currentMessages, messageId),
					parentId: currentMessages[originalMessageIndex].parentId // maintain same flow
				};

				const newAssistantMessage: ChatMessage = {
					id: data.newAssistantMessage.id,
					role: 'assistant',
					content: data.newAssistantMessage.content,
					createdAt: new Date().toISOString(),
					previousId: data.newAssistantMessage.previousId ?? null,
					versionNumber: data.newAssistantMessage.versionNumber ?? 1,
					parentId: forkedUserMessage.id
				};

				const newMessages = [...currentMessages];
				newMessages.splice(originalMessageIndex + 1, 0, forkedUserMessage, newAssistantMessage);
				messages.set(newMessages);

				// Update conversations
				const currentId = get(currentRoomId);
				if (currentId) {
					conversations.update((convs) =>
						convs.map((c) =>
							c.id === currentId ? { ...c, messages: newMessages, updatedAt: new Date().toISOString() } : c
						)
					);
				}

				// Track active version for the edited original (group by previousId/original id)
				const prevKey = forkedUserMessage.previousId || messageId;
				activeVersions.update((versions) => {
					const next = new Map(versions);
					next.set(prevKey, forkedUserMessage.versionNumber || 1);
					return next;
				});

				debouncedSaveToStorage();
			}
			return data;
		} catch (err: any) {
			errorStore.set(err?.message || 'Failed to fork message');
			throw err;
		} finally {
			forkingLoading.set(false);
		}
	}

	async function regenerateAssistantMessage(messageId: string) {
		if (get(forkingLoading)) return;

		forkingLoading.set(true);
		errorStore.set('');

		try {
			const res = await fetch(`/api/messages/${messageId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || 'Failed to regenerate message');
			}

			const currentMessages = get(messages);
			const originalMessageIndex = currentMessages.findIndex((m) => m.id === messageId);

			if (originalMessageIndex !== -1) {
				const originalMessage = currentMessages[originalMessageIndex];

				const newAssistantMessage: ChatMessage = {
					id: data.newAssistantMessage.id,
					role: 'assistant',
					content: data.newAssistantMessage.content,
					createdAt: new Date().toISOString(),
					previousId: data.newAssistantMessage.previousId ?? messageId,
					versionNumber:
						data.newAssistantMessage.versionNumber ??
						calcNextVersion(currentMessages, originalMessage.parentId || messageId),
					parentId: originalMessage.parentId // same triggering user message
				};

				// Find the user message that triggered this assistant response
				const userMessageIndex = currentMessages.findIndex(
					(m) => m.id === originalMessage.parentId
				);

				if (userMessageIndex !== -1) {
					// Trim the branch after the user message, then add the new response
					const newMessages = currentMessages.slice(0, userMessageIndex + 1);
					newMessages.push(newAssistantMessage);
					messages.set(newMessages);

					const currentId = get(currentRoomId);
					if (currentId) {
						conversations.update((convs) =>
							convs.map((c) =>
								c.id === currentId
									? { ...c, messages: newMessages, updatedAt: new Date().toISOString() }
									: c
							)
						);
					}

					// Track active version keyed by the user message id (the group)
					if (newAssistantMessage.previousId) {
						activeVersions.update((versions) => {
							const next = new Map(versions);
							const groupKey = originalMessage.parentId || newAssistantMessage.previousId;
							next.set(groupKey, newAssistantMessage.versionNumber || 1);
							return next;
						});
					}

					debouncedSaveToStorage();
				}
			}

			return data;
		} catch (err: any) {
			errorStore.set(err?.message || 'Failed to regenerate message');
			throw err;
		} finally {
			forkingLoading.set(false);
		}
	}

	function calcNextVersion(all: ChatMessage[], previousId: string | null): number {
		if (!previousId) return 1;
		const versions = all
			.filter((m) => m.previousId === previousId)
			.map((m) => m.versionNumber || 1);
		if (versions.length === 0) return 2; // first fork after original
		return Math.max(...versions) + 1;
	}

	function setActiveVersion(messageId: string | null, versionNumber?: number) {
		// messageId can be null (reset) — treat as clear
		if (!messageId) {
			activeVersions.set(new Map());
			debouncedSaveToStorage();
			return;
		}
		if (typeof versionNumber !== 'number') return;
		activeVersions.update((versions) => {
			const next = new Map(versions);
			next.set(messageId, versionNumber);
			return next;
		});
		debouncedSaveToStorage();
	}

	function getActiveVersion(messageId: string): number {
		const activeVersionsMap = get(activeVersions);
		const currentMessages = get(messages);
		const message = currentMessages.find((m) => m.id === messageId);

		// If this message is a version (has previousId), use that as the group key
		if (message?.previousId) {
			return activeVersionsMap.get(message.previousId) || 1;
		}

		// If assistant with same parent has multiple versions, group by parentId
		if (message?.role === 'assistant' && message.parentId) {
			const forkVersions = currentMessages.filter(
				(m) => m.role === 'assistant' && m.parentId === message.parentId
			);
			if (forkVersions.length > 1) {
				return activeVersionsMap.get(message.parentId) || 1;
			}
		}

		// Default
		return activeVersionsMap.get(messageId) || 1;
	}

	function getMessagesWithActiveVersions(): ChatMessage[] {
		const currentMessages = get(messages);
		const activeVersionsMap = get(activeVersions);

		if (currentMessages.length === 0) return [];

		// Backward compatibility: no forking fields found
		const hasForkingData = currentMessages.some(
			(m) => m.previousId !== undefined || m.versionNumber !== undefined
		);
		if (!hasForkingData) return currentMessages;

		const filteredMessages: ChatMessage[] = [];

		// Build conversation showing only active branches
		// Start with messages that have no previousId (original messages)
		const originalMessages = currentMessages.filter((msg) => !msg.previousId);
		
		// For each original message, build its conversation chain
		originalMessages.forEach((original) => {
			let current: ChatMessage | undefined = original;
			
			while (current) {
				// Check if this message has forks
				const forks = currentMessages.filter((m) => m.previousId === current.id);
				
				if (forks.length > 0) {
					// This message has forks - check which version to show
					const activeVersion = activeVersionsMap.get(current.id) || 1;
					
					if (activeVersion === 1) {
						// Show original message
						filteredMessages.push(current);
					} else {
						// Show the active fork
						const activeFork = forks.find((m) => (m.versionNumber || 1) === activeVersion);
						if (activeFork) {
							filteredMessages.push(activeFork);
						} else {
							filteredMessages.push(current); // Fallback to original
						}
					}
				} else {
					// No forks, show the message
					filteredMessages.push(current);
				}
				
				// Find the response to this message
				const response = currentMessages.find((msg) => msg.parentId === current.id);
				if (response) {
					current = response;
				} else {
					break;
				}
			}
		});

		return filteredMessages;
	}

	// --- Delete flows --------------------------------------------------------
	function openDeleteModal(id: string, title: string) {
		deleteTarget.set({ id, title });
		showDeleteModal.set(true);
	}

	function closeDeleteModal() {
		showDeleteModal.set(false);
		deleteTarget.set(null);
	}

	async function confirmDeleteConversation() {
		const target = get(deleteTarget);
		if (!target) return;
		closeDeleteModal();
		const { id } = target;
		const conv = get(conversations).find((c) => c.id === id);
		if (!conv) return;

		if (!id.startsWith('temp-') && (conv.messageCount || 0) > 0) {
			try {
				await fetch('/api/chat', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ roomIds: [id] })
				});
			} catch {
				// ignore
			}
		}

		conversations.update((convs) => convs.filter((c) => c.id !== id));

		if (get(currentRoomId) === id) {
			const remaining = get(conversations);
			if (remaining.length > 0) {
				const next = remaining[0];
				currentRoomId.set(next.id);
				messages.set([...next.messages]);
			} else {
				currentRoomId.set(null);
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
		const target = get(deleteAllTarget);
		if (!target) return;
		closeDeleteAllModal();
		try {
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({})
			});
		} catch {
			// ignore
		}
		conversations.set([]);
		messages.set([]);
		currentRoomId.set(null);
		debouncedSaveToStorage();
	}

	// --- Edit ---------------------------------------------------------------
	function editMessage(messageId: string, newContent: string) {
		messages.update((msgs) => msgs.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)));

		const id = get(currentRoomId);
		if (id) {
			conversations.update((convs) =>
				convs.map((c) =>
					c.id === id
						? { ...c, messages: get(messages), updatedAt: new Date().toISOString() }
						: c
				)
			);
		}
		debouncedSaveToStorage();
	}

	// --- Migration for legacy threads ---------------------------------------
	async function migrateExistingMessages() {
		const currentMessages = get(messages);
		if (currentMessages.length === 0) return;

		// If already migrated (parentId exists on any), skip
		const hasForkingSupport = currentMessages.some((m) => m.parentId !== undefined);
		if (hasForkingSupport) return;

		// Create parent links along linear history; keep version defaults
		const migrated: ChatMessage[] = [];
		let lastMessageId: string | null = null;

		for (const message of currentMessages) {
			const migratedMessage: ChatMessage = {
				...message,
				parentId: lastMessageId,
				previousId: null,
				versionNumber: 1
			};
			migrated.push(migratedMessage);
			lastMessageId = message.id;
		}

		messages.set(migrated);

		const currentId = get(currentRoomId);
		if (currentId) {
			conversations.update((convs) =>
				convs.map((c) =>
					c.id === currentId
						? { ...c, messages: migrated, updatedAt: new Date().toISOString() }
						: c
				)
			);
		}

		debouncedSaveToStorage();
	}

	// --- Cleanup -------------------------------------------------------------
	function destroy() {
		clearTimeout(saveTimeout);
		clearTimeout(syncTimeout);
		if (retryTimer) clearInterval(retryTimer);
	}

	// Public API
	return {
		// state
		messages,
		conversations,
		currentRoomId,
		loading,
		errorStore, // explicit store if consumer wants to access directly
		error, // alias for backwards compatibility
		showDeleteModal,
		deleteTarget,
		showDeleteAllModal,
		deleteAllTarget,
		currentConversation,

		// forking state
		activeVersions,
		forkingLoading,

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
		editMessage,

		// forking actions
		forkUserMessage,
		regenerateAssistantMessage,
		setActiveVersion,
		getActiveVersion,
		getMessagesWithActiveVersions,
		migrateExistingMessages,

		// lifecycle
		destroy
	};
}
