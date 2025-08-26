import { writable, derived, type Writable } from 'svelte/store';
import { transformDbMessagesToView } from '$lib/db/chatUtils';

export type ChatMessage = {
	id: string;
	content: string;
	aiResponse: string | null;
	createdAt: string;
	isStreaming?: boolean;
	updatedAt?: string;
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
			}
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
		
		// MESSAGE MODIFICATION: Create contextual instruction based on user message
		let instruction = "";
		
		// Analyze the message content to determine appropriate instruction
		const lowerMessage = messageContent.toLowerCase();
		
		if (lowerMessage.includes('table') || lowerMessage.includes('list') || lowerMessage.includes('data')) {
			instruction = "\n\nPlease provide a well-formatted response with clear structure and organization.";
		} else if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
			instruction = "\n\nPlease provide a detailed and comprehensive explanation.";
		} else if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('vs')) {
			instruction = "\n\nPlease provide a clear comparison with structured points.";
		} else if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('script')) {
			instruction = "\n\nPlease provide clean, well-commented code with explanations.";
		} else if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
			instruction = "\n\nPlease provide helpful and supportive guidance.";
		} else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
			instruction = "\n\nPlease respond warmly and acknowledge the gratitude.";
		} else {
			instruction = "\n\nPlease provide a helpful and informative response.";
		}
		
		const modifiedMessage = messageContent + instruction;
		
		const chatMessage: ChatMessage = {
			id: generateId(),
			content: messageContent, // Keep original message for display
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
				body: JSON.stringify({ message: modifiedMessage, history, conversationId: apiConversationId })
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

	async function editMessage(messageId: string, newContent: string) {
		const currentMessages = getValue(messages);
		const messageIndex = currentMessages.findIndex(m => m.id === messageId);
		
		if (messageIndex === -1) return;
		
		// Find the message to edit
		const messageToEdit = currentMessages[messageIndex];
		
		// Save current state as a version before editing
		const id = getValue(currentConversationId);
		if (id) {
			const currentConv = getValue(conversations).find(c => c.id === id);
			if (currentConv) {
				const versions = currentConv.versions || [];
				const newVersion: ConversationVersion = {
					id: generateId(),
					messages: [...currentMessages],
					createdAt: new Date().toISOString(),
					versionNumber: versions.length + 1
				};
				
				conversations.update((convs) => 
					convs.map((c) => 
						c.id === id ? { 
							...c, 
							versions: [...versions, newVersion],
							currentVersionId: newVersion.id
						} : c
					)
				);
			}
		}
		
		// Truncate messages from the edited message onwards
		const truncatedMessages = currentMessages.slice(0, messageIndex);
		
		// Update the edited message content and clear AI response
		const updatedMessage = {
			...messageToEdit,
			content: newContent,
			aiResponse: null, // Clear the AI response since we're editing
			updatedAt: new Date().toISOString(),
			isStreaming: true // Set streaming to true to show loading state
		};
		
		// Add the updated message to truncated messages
		const newMessages = [...truncatedMessages, updatedMessage];
		
		// Update the messages store
		messages.set(newMessages);
		
		// Update the conversation
		if (id) {
			conversations.update((convs) => 
				convs.map((c) => 
					c.id === id ? { ...c, messages: newMessages, updatedAt: new Date().toISOString() } : c
				)
			);
		}
		
		// Regenerate AI response for the edited message
		loading.set(true);
		error.set('');
		
		try {
			// MESSAGE MODIFICATION: Create contextual instruction based on user message
			let instruction = "";
			const lowerMessage = newContent.toLowerCase();
			
			if (lowerMessage.includes('table') || lowerMessage.includes('list') || lowerMessage.includes('data')) {
				instruction = "\n\nPlease provide a well-formatted response with clear structure and organization.";
			} else if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
				instruction = "\n\nPlease provide a detailed and comprehensive explanation.";
			} else if (lowerMessage.includes('compare') || lowerMessage.includes('difference') || lowerMessage.includes('vs')) {
				instruction = "\n\nPlease provide a clear comparison with structured points.";
			} else if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('script')) {
				instruction = "\n\nPlease provide clean, well-commented code with explanations.";
			} else if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
				instruction = "\n\nPlease provide helpful and supportive guidance.";
			} else if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
				instruction = "\n\nPlease respond warmly and acknowledge the gratitude.";
			} else {
				instruction = "\n\nPlease provide a helpful and informative response.";
			}
			
			const modifiedMessage = newContent + instruction;
			
			// Prepare conversation history for the API
			const history = truncatedMessages
				.filter((m) => m.aiResponse)
				.map((m) => ({ message: m.content, response: m.aiResponse }));
			
			const convId = getValue(currentConversationId);
			const apiConversationId = convId && convId.startsWith('temp-') ? undefined : convId;
			
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: modifiedMessage, history, conversationId: apiConversationId })
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
									break;
								}
								if (data.chunk) {
									streamedResponse += data.chunk;
									messages.update((msgs) => msgs.map((m) => (m.id === updatedMessage.id ? { ...m, aiResponse: streamedResponse } : m)));
								}
								if (data.done) {
									messages.update((msgs) => msgs.map((m) => (m.id === updatedMessage.id ? { ...m, isStreaming: false } : m)));
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
					messages.update((msgs) => msgs.map((m) => (m.id === updatedMessage.id ? { ...m, aiResponse: data.response, isStreaming: false } : m)));
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
				}
			}
		} catch {
			error.set('An error occurred while regenerating response. Please try again.');
		} finally {
			loading.set(false);
		}
		
		debouncedSaveToStorage();
	}

	function continueFromMessage(messageId: string) {
		const currentMessages = getValue(messages);
		const messageIndex = currentMessages.findIndex(m => m.id === messageId);
		
		if (messageIndex === -1) return;
		
		// Save current state as a version before branching
		const id = getValue(currentConversationId);
		if (id) {
			const currentConv = getValue(conversations).find(c => c.id === id);
			if (currentConv) {
				const versions = currentConv.versions || [];
				const newVersion: ConversationVersion = {
					id: generateId(),
					messages: [...currentMessages],
					createdAt: new Date().toISOString(),
					versionNumber: versions.length + 1
				};
				
				conversations.update((convs) => 
					convs.map((c) => 
						c.id === id ? { 
							...c, 
							versions: [...versions, newVersion],
							currentVersionId: newVersion.id
						} : c
					)
				);
			}
		}
		
		// Truncate messages to include only up to the selected message
		const truncatedMessages = currentMessages.slice(0, messageIndex + 1);
		
		// Update the messages store
		messages.set(truncatedMessages);
		
		// Update the conversation
		if (id) {
			conversations.update((convs) => 
				convs.map((c) => 
					c.id === id ? { ...c, messages: truncatedMessages, updatedAt: new Date().toISOString() } : c
				)
			);
		}
		
		debouncedSaveToStorage();
	}

	function navigateToVersion(versionId: string) {
		const id = getValue(currentConversationId);
		if (!id) return;
		
		const currentConv = getValue(conversations).find(c => c.id === id);
		if (!currentConv || !currentConv.versions) return;
		
		const targetVersion = currentConv.versions.find(v => v.id === versionId);
		if (!targetVersion) return;
		
		// Load the version's messages
		messages.set([...targetVersion.messages]);
		
		// Update conversation to point to this version
		conversations.update((convs) => 
			convs.map((c) => 
				c.id === id ? { 
					...c, 
					messages: [...targetVersion.messages],
					currentVersionId: versionId,
					updatedAt: new Date().toISOString()
				} : c
			)
		);
		
		debouncedSaveToStorage();
	}

	function getCurrentVersionInfo() {
		const id = getValue(currentConversationId);
		if (!id) return null;
		
		const currentConv = getValue(conversations).find(c => c.id === id);
		if (!currentConv || !currentConv.versions || currentConv.versions.length === 0) return null;
		
		const currentVersionIndex = currentConv.versions.findIndex(v => v.id === currentConv.currentVersionId);
		const currentVersionNumber = currentVersionIndex >= 0 ? currentVersionIndex + 1 : currentConv.versions.length;
		
		return {
			currentVersion: currentVersionNumber,
			totalVersions: currentConv.versions.length,
			canGoBack: currentVersionNumber > 1,
			canGoForward: currentVersionNumber < currentConv.versions.length,
			versions: currentConv.versions
		};
	}

	function goToPreviousVersion() {
		const versionInfo = getCurrentVersionInfo();
		if (!versionInfo || !versionInfo.canGoBack) return;
		
		const previousVersion = versionInfo.versions[versionInfo.currentVersion - 2];
		if (previousVersion) {
			navigateToVersion(previousVersion.id);
		}
	}

	function goToNextVersion() {
		const versionInfo = getCurrentVersionInfo();
		if (!versionInfo || !versionInfo.canGoForward) return;
		
		const nextVersion = versionInfo.versions[versionInfo.currentVersion];
		if (nextVersion) {
			navigateToVersion(nextVersion.id);
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
			continueFromMessage,
			navigateToVersion,
			getCurrentVersionInfo,
			goToPreviousVersion,
			goToNextVersion
		};
}


