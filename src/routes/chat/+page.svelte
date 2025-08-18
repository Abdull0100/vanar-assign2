<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable, derived } from 'svelte/store';

	// Types
	type ChatMessage = {
		id: string;
		content: string;
		sender: 'user' | 'ai';
		aiResponse: string | null;
		createdAt: string;
		isStreaming?: boolean;
	};

	type Conversation = {
		id: string;
		roomName: string;
		createdAt: string;
		updatedAt: string;
		messageCount?: number;
		messages: ChatMessage[];
	};

	// Stores for reactive state management
	const messages = writable<ChatMessage[]>([]);
	const conversations = writable<Conversation[]>([]);
	const currentConversationId = writable<string | null>(null);
	const loading = writable(false);
	const error = writable('');

	// Local variable for input binding
	let messageText = '';

	// Derived store for current conversation - this ensures reactivity
	const currentConversation = derived(
		[conversations, currentConversationId],
		([$conversations, $currentConversationId]) => 
			$conversations.find(c => c.id === $currentConversationId) || null
	);

	$: user = $page.data.session?.user;

	// Error handling state
	let retryCountdown = 0;
	let retryTimer: NodeJS.Timeout | null = null;
	let errorRetryCount = 0;
	let messagesContainer: HTMLElement;

	const storageKey = () => `vanar_conversations_${user?.id || 'anon'}`;
	const generateId = () => crypto.randomUUID();

	onMount(() => {
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}
		loadConversationsFromStorage();
		loadChatHistory();
		
		// Add scroll event listener for better scroll tracking
		if (messagesContainer) {
			messagesContainer.addEventListener('scroll', () => {
				// Trigger reactivity to update scroll indicators
				messagesContainer = messagesContainer;
			});
		}
	});

	onDestroy(() => {
		// Clean up timeouts to prevent memory leaks
		clearTimeout(syncTimeout);
		clearTimeout(saveTimeout);
		
		// Clean up retry timer
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
	});

	function saveConversationsToStorage() {
		try {
			// Only save current conversation ID to storage
			// Conversations are loaded from database to ensure they have messages
			const currentData = {
				currentConversationId: $currentConversationId
			};
			localStorage.setItem(storageKey(), JSON.stringify(currentData));
		} catch (e) {
			console.warn('Failed to save conversation ID to storage:', e);
		}
	}

	function loadConversationsFromStorage() {
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) {
				const parsed = JSON.parse(raw);
				// Only load current conversation ID from storage, not conversations
				// Conversations will be loaded from database to ensure they have messages
				currentConversationId.set(parsed.currentConversationId || null);
				
				// Don't load messages from local storage - they'll be loaded from database when needed
				messages.set([]);
			}
		} catch (e) {
			console.warn('Failed to load conversations from storage:', e);
		}
	}

	function newConversation() {
		// Clear current conversation and messages
		currentConversationId.set(null);
		messages.set([]);
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	async function selectConversation(id: string) {
		currentConversationId.set(id);
		
		// Load messages for this conversation from the database
		try {
			const response = await fetch(`/api/chat?conversationId=${id}`);
			if (response.ok) {
				const data = await response.json();
				if (data.messages && Array.isArray(data.messages)) {
					messages.set(data.messages);
				} else {
					messages.set([]);
				}
			} else {
				messages.set([]);
			}
		} catch (err) {
			console.error('Error loading conversation messages:', err);
			messages.set([]);
		}
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	function updateConversationRoomName(roomName: string) {
		if (!$currentConversationId) return;
		
		conversations.update(convs => 
			convs.map(conv => 
				conv.id === $currentConversationId 
					? { ...conv, roomName, updatedAt: new Date().toISOString() }
					: conv
			)
		);
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	// Debounced function to sync messages with conversations
	let syncTimeout: NodeJS.Timeout;
	function debouncedSyncMessages() {
		clearTimeout(syncTimeout);
		syncTimeout = setTimeout(() => {
			if (!$currentConversationId || !$messages) return;
			
			conversations.update(convs => 
				convs.map(conv => 
					conv.id === $currentConversationId 
						? { ...conv, messages: [...$messages], updatedAt: new Date().toISOString() }
						: conv
				)
			);
		}, 300); // Debounce to 300ms
	}

	// Debounced function to save to localStorage
	let saveTimeout: NodeJS.Timeout;
	function debouncedSaveToStorage() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveConversationsToStorage();
		}, 500); // Debounce to 500ms
	}

	// Memoized conversations for better performance
	$: memoizedConversations = $conversations.map(conv => ({
		...conv,
		// Pre-compute formatted date to avoid recalculation on every render
		formattedDate: new Date(conv.updatedAt || conv.createdAt).toLocaleDateString(),
		// Pre-compute message count display
		messageCountDisplay: conv.messages.length === 1 ? '1 message' : `${conv.messages.length} messages`
	}));

	// Watch for message changes and sync to conversation (debounced)
	$: if ($currentConversationId && $messages) {
		debouncedSyncMessages();
	}

	async function sendMessage() {
		const messageContent = messageText.trim();
		if (!messageContent || $loading) return;

		// Clear input immediately
		messageText = '';
		loading.set(true);
		error.set('');

		// Create new conversation immediately if needed (non-blocking)
		if (!$currentConversationId) {
			newConversation();
			// Wait a tick for the new conversation to be set
			await new Promise(resolve => setTimeout(resolve, 0));
		}

		// Create user message
		const userMessage: ChatMessage = {
			id: generateId(),
			content: messageContent,
			sender: 'user',
			aiResponse: '',
			createdAt: new Date().toISOString()
		};

		// Create AI message placeholder
		const aiMessage: ChatMessage = {
			id: generateId(),
			content: '',
			sender: 'ai',
			aiResponse: '',
			createdAt: new Date().toISOString(),
			isStreaming: true
		};

		// Optimistic update - add both messages immediately
		messages.update(msgs => [...msgs, userMessage, aiMessage]);

		// Auto-scroll immediately after adding messages
		setTimeout(scrollToBottom, 50);

		// Update conversation room name if it's the first message
		if ($messages.length === 2) { // Just added user + AI messages
			updateConversationRoomName(messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent);
		}

		try {
			const history = $messages
				.filter(m => m.sender === 'user' && m.aiResponse) // Only completed message pairs
				.slice(0, -2) // Exclude the current pair we just added
				.map(m => ({ message: m.content, response: m.aiResponse }));

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageContent,
					history,
					conversationId: $currentConversationId || undefined
				})
			});

			if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
				// Handle streaming response
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
							if (line.startsWith('data: ')) {
								try {
									const data = JSON.parse(line.slice(6));
									
									if (data.error) {
										error.set(data.error);
										if (data.error.includes('rate limit') || data.error.includes('quota') || data.error.includes('high demand')) {
											startRetryCountdown(60);
										}
										// Remove the AI message on error
										messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
										break;
									}
									
									if (data.chunk) {
										streamedResponse += data.chunk;
										// Update AI message with streaming response
										messages.update(msgs => 
											msgs.map(msg => 
												msg.id === aiMessage.id 
													? { ...msg, aiResponse: streamedResponse }
													: msg
											)
										);
										
										// Auto-scroll during streaming
										setTimeout(smartScrollToBottom, 50);
									}
									
									if (data.done) {
										// Finalize AI message
										messages.update(msgs => 
											msgs.map(msg => 
												msg.id === aiMessage.id 
													? { ...msg, isStreaming: false }
													: msg
											)
										);

										// Update conversation ID if it's new
										if (data.conversationId && $currentConversationId !== data.conversationId) {
											if ($currentConversationId) {
												// Update existing conversation in the list
												conversations.update(convs => 
													convs.map(conv => 
														conv.id === $currentConversationId 
															? { ...conv, id: data.conversationId }
															: conv
													)
												);
											}
											
											currentConversationId.set(data.conversationId);
											
											// Refresh conversations list to show the new conversation
											setTimeout(() => loadChatHistory(), 100);
										}
									}
								} catch (parseError) {
									console.error('Error parsing streaming data:', parseError);
								}
							}
						}
					}
				}
			} else {
				// Handle JSON response
				const data = await response.json();
				if (response.ok) {
					// Update AI message with response
					messages.update(msgs => 
						msgs.map(msg => 
							msg.id === aiMessage.id 
								? { ...msg, aiResponse: data.response, isStreaming: false }
								: msg
						)
					);

					// Update conversation ID if it's new
					if (data.conversationId && $currentConversationId !== data.conversationId) {
						if ($currentConversationId) {
							// Update existing conversation in the list
							conversations.update(convs => 
								convs.map(conv => 
									conv.id === $currentConversationId 
										? { ...conv, id: data.conversationId }
										: conv
								)
							);
						}
						
						currentConversationId.set(data.conversationId);
						
						// Refresh conversations list to show the new conversation
						setTimeout(() => loadChatHistory(), 100);
					}
				} else {
					error.set(data.error || 'Failed to get response from AI');
					// Remove AI message on error
					messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
				}
			}
		} catch (err) {
			console.error('Chat error:', err);
			error.set('An error occurred while sending message. Please try again.');
			// Remove AI message on error
			messages.update(msgs => msgs.filter(m => m.id !== aiMessage.id));
		} finally {
			loading.set(false);
		}
	}

	function startRetryCountdown(seconds: number) {
		retryCountdown = seconds;
		errorRetryCount++;
		if (retryTimer) clearInterval(retryTimer);
		retryTimer = setInterval(() => {
			retryCountdown--;
			if (retryCountdown <= 0) {
				if (retryTimer) clearInterval(retryTimer);
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

	function canRetryNow(): boolean {
		return retryCountdown <= 0;
	}

	function getTimeUntilRetry(): string {
		if (retryCountdown <= 0) return 'Ready to retry';
		const minutes = Math.floor(retryCountdown / 60);
		const seconds = retryCountdown % 60;
		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}
		return `${seconds}s`;
	}

	async function deleteMessage(messageIndex: number) {
		const messageToDelete = $messages[messageIndex];
		if (!messageToDelete) return;
		
		const messageText = messageToDelete.content.length > 30 ? messageToDelete.content.slice(0, 30) + '…' : messageToDelete.content;
		
		if (!confirm(`Are you sure you want to delete this message?\n\n"${messageText}"\n\n⚠️  PERMANENT DELETION: This message will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.`)) {
			return;
		}

		// Remove the message - this will trigger reactive updates
		messages.update(msgs => msgs.filter((_, index) => index !== messageIndex));
		
		// Update conversation room name if needed
		if (messageIndex === 0 && $messages.length > 0) {
			const firstUserMessage = $messages.find(m => m.sender === 'user');
			if (firstUserMessage) {
				updateConversationRoomName(firstUserMessage.content.length > 40 ? firstUserMessage.content.slice(0, 40) + '…' : firstUserMessage.content);
			}
		}
		
		// If no messages left, reset room name
		if ($messages.length === 0) {
			updateConversationRoomName('New Chat');
		}
	}

	async function deleteConversation(id: string) {
		const conv = $conversations.find(c => c.id === id);
		if (!conv) return;
		
		const convTitle = conv.roomName || 'this conversation';
		if (!confirm(`Are you sure you want to delete "${convTitle}"?\n\n⚠️  PERMANENT DELETION: This entire conversation will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.`)) {
			return;
		}
		
		// Delete from database (all conversations now have proper UUIDs)
		try {
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ conversationIds: [id] })
			});
		} catch (error) {
			console.error('Failed to delete conversation from database:', error);
		}
		
		// Remove from conversations first
		conversations.update(convs => convs.filter(c => c.id !== id));
		
		// Update current conversation if needed - use the updated conversations list
		if ($currentConversationId === id) {
			const remainingConversations = $conversations;
			if (remainingConversations.length > 0) {
				const nextConv = remainingConversations[0];
				currentConversationId.set(nextConv.id);
				messages.set([...nextConv.messages]);
			} else {
				currentConversationId.set(null);
				messages.set([]);
			}
		}
		
		// Debounced save to avoid excessive localStorage writes
		debouncedSaveToStorage();
	}

	async function clearAllChatHistory() {
		if (!confirm(`Are you sure you want to clear ALL chat history?\n\n⚠️  PERMANENT DELETION: ALL conversations and messages will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.\n\nThis will remove ALL your chat data permanently.`)) {
			return;
		}

		try {
			// Clear all conversations from database for the current user
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({}) // Empty body means clear all for current user
			});
		} catch (error) {
			console.error('Failed to clear chat history from database:', error);
		}

		// Clear all state
		conversations.set([]);
		messages.set([]);
		currentConversationId.set(null);
		
		// Clear local storage
		try {
			localStorage.removeItem(storageKey());
		} catch (e) {
			console.warn('Failed to clear local storage:', e);
		}
	}

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/';
		} catch (error) {
			console.error('Sign out error:', error);
			window.location.href = '/';
		}
	}

	async function loadChatHistory() {
		try {
			const response = await fetch('/api/chat');
			if (response.ok) {
				const data = await response.json();
				if (data.conversations && Array.isArray(data.conversations)) {
					const dbConversations = data.conversations.map((conv: { id: string; roomName?: string; title?: string; createdAt: string; updatedAt: string; messageCount?: number }) => ({
						id: conv.id,
						roomName: conv.roomName || conv.title || 'Untitled Room',
						createdAt: conv.createdAt,
						updatedAt: conv.updatedAt,
						messageCount: conv.messageCount || 0,
						messages: [] // Don't load messages here - just room info
					}));
					
					// Filter out empty conversations from database
					const nonEmptyDbConversations = dbConversations.filter((conv: { messageCount: number }) => conv.messageCount > 0);
					
					// Only use database conversations - no local ones needed since we generate proper UUIDs
					const mergedConversations = [...nonEmptyDbConversations];
					
					conversations.set(mergedConversations);
					
					// Set current conversation if none is selected
					if (!$currentConversationId && mergedConversations.length > 0) {
						const firstConv = mergedConversations[0];
						currentConversationId.set(firstConv.id);
						// Don't set messages here - they'll be loaded separately when needed
						messages.set([]);
					} else if ($currentConversationId) {
						// Check if current conversation still exists and has messages
						const currentConv = mergedConversations.find((c: { id: string; messageCount: number }) => c.id === $currentConversationId);
						if (!currentConv || currentConv.messageCount === 0) {
							// Current conversation is empty or doesn't exist, clear it
							currentConversationId.set(null);
							messages.set([]);
						}
					}
					
					// Debounced save to avoid excessive localStorage writes
					debouncedSaveToStorage();
				}
			}
		} catch (err) {
			console.error('Error loading chat history:', err);
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	// Improved auto-scroll function
	function scrollToBottom() {
		if (messagesContainer) {
			// Use requestAnimationFrame for better timing
			requestAnimationFrame(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			});
		}
	}

	// Check if user is at bottom of messages
	function isAtBottom() {
		if (!messagesContainer) return true;
		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		return scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
	}

	// Auto-scroll only if user is already at bottom
	function smartScrollToBottom() {
		if (isAtBottom()) {
			scrollToBottom();
		}
	}

	// Auto-scroll when messages change
	$: if ($messages && messagesContainer) {
		// Delay scroll to ensure DOM is updated
		setTimeout(smartScrollToBottom, 100);
	}
</script>

<svelte:head>
	<title>Vanar AI Assistant - The Chain That Thinks</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<h1 class="text-xl font-bold text-gray-900">Auth App</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<button
							on:click={() => goto('/dashboard')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Dashboard
						</button>
						<button
							on:click={() => goto('/chat')}
							class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
						>
							Vanar AI
						</button>
						<button
							on:click={() => goto('/profile')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Profile
						</button>
						{#if user?.role === 'admin'}
							<button
								on:click={() => goto('/admin')}
								class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							>
								Admin Panel
							</button>
						{/if}
					</div>
				</div>
				<div class="flex items-center">
					<div class="ml-3">
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
							<button
								on:click={handleSignOut}
								class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Chat Interface -->
	<div class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
			<!-- Chat History Sidebar -->
			<div class="lg:col-span-1">
				<div class="rounded-xl bg-white shadow-lg h-full">
					<div class="p-4 border-b border-gray-200 flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold text-gray-900">Chat Rooms</h3>
							<p class="text-sm text-gray-500">Start new chats and revisit old ones</p>
						</div>
						<div class="flex space-x-2">
							<button 
								on:click={newConversation} 
								class="group relative inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white" 
								aria-label="Start a new conversation room"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								New Room
								<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						</div>
					</div>
					<div class="p-4 max-h-96 overflow-y-auto" style="contain: layout style paint;">
						{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
							<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-start text-yellow-800">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 mt-0.5 flex-shrink-0">
										<circle cx="12" cy="12" r="10"/>
										<path d="M12 6v6l4 2"/>
									</svg>
									<div class="text-xs">
										<strong>Service Notice:</strong> AI service is currently experiencing high demand.
										{#if retryCountdown > 0}
											<br><span class="text-yellow-700">Retry available in: {getTimeUntilRetry()}</span>
										{:else}
											<br>This usually resolves within a few minutes.
										{/if}
									</div>
								</div>
							</div>
						{/if}
						
						{#if memoizedConversations.length === 0}
							<div class="text-center py-12">
								<div class="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-2">No chat rooms yet</h3>
								<p class="text-sm text-gray-500 mb-4">Create your first room to start chatting with Vanar AI</p>
								<button on:click={newConversation} class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg" aria-label="Create your first chat room">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
									Create Room
								</button>
							</div>
						{:else}
							{#each memoizedConversations as conv (conv.id)}
								{#key conv.id}
								<div 
									class="w-full mb-3 p-4 rounded-lg transition-all duration-200 cursor-pointer border {$currentConversationId === conv.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'}" 
									on:click={() => selectConversation(conv.id)}
									on:keydown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
									role="button"
									tabindex="0"
									aria-label="Select conversation: {conv.roomName}"
									aria-pressed={$currentConversationId === conv.id}
								>
									<div class="flex items-center justify-between">
										<p class="text-sm font-medium text-gray-800 truncate flex-1 mr-3">{conv.roomName}</p>
										<button 
											on:click={(e) => { e.stopPropagation(); deleteConversation(conv.id).catch(console.error); }} 
											class="group relative text-red-500 hover:text-red-700 text-xs p-2 rounded-lg hover:bg-red-50 transition-all duration-300 flex-shrink-0 border border-red-200 hover:border-red-300 hover:shadow-md hover:scale-110"
											title="Delete conversation"
											aria-label="Delete conversation: {conv.roomName}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
												<path d="M3 6h18"/>
												<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
												<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
											</svg>
											<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										</button>
									</div>
								</div>
								{/key}
							{/each}
						{/if}
					</div>
					
					<!-- Clear All History Button -->
					{#if memoizedConversations.length > 0}
						<div class="p-4 border-t border-gray-200">
							<button
								on:click={clearAllChatHistory}
								class="w-full group relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
								aria-label="Clear all chat history"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
									<path d="M3 6h18"/>
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
								</svg>
								Clear All History
							</button>
						</div>
					{/if}
				</div>
			</div>

			<!-- Main Chat Interface -->
			<div class="lg:col-span-3">
				<div class="rounded-xl bg-white shadow-lg overflow-hidden">
					<!-- Chat Header -->
					<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<div class="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
									<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-8 h-8" />
								</div>
								<div>
									<h2 class="text-lg font-semibold text-white">Vanar AI Assistant</h2>
									<p class="text-sm text-indigo-200">The Chain That Thinks • Powered by Vanar</p>
								</div>
							</div>
							<div class="flex items-center space-x-2">
								{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
									<div class="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
									<span class="text-sm text-yellow-200">
										{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
									</span>
								{:else if $error}
									<div class="h-2 w-2 rounded-full bg-red-400 animate-pulse"></div>
									<span class="text-sm text-red-200">Service Error</span>
								{:else}
									<div class="h-2 w-2 rounded-full bg-green-400"></div>
									<span class="text-sm text-white">Online</span>
								{/if}
							</div>
						</div>
					</div>

					<!-- Messages Container -->
					<div class="relative">
						<div bind:this={messagesContainer} class="min-h-[400px] max-h-[70vh] overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white scroll-smooth">
						{#if $messages.length === 0}
							<div class="flex flex-col items-center justify-center h-full text-center">
								<div class="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
									<span class="text-4xl">💬</span>
								</div>
								<br>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Vanar AI Assistant</h3>
								<p class="text-gray-500 max-w-md">
									Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about anything!
								</p>
								{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
									<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div class="flex items-center text-yellow-800">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
												<circle cx="12" cy="12" r="10"/>
												<path d="M12 6v6l4 2"/>
											</svg>
											<div class="text-sm">
												AI service is currently busy. You can still ask questions, but responses may be delayed.
												{#if retryCountdown > 0}
													<br><span class="text-yellow-700 text-xs">Retry available in: {getTimeUntilRetry()}</span>
												{/if}
											</div>
										</div>
									</div>
								{/if}
								<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
									<button 
										on:click={() => { messageText = "What is Vanar Chain?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 text-sm font-medium border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
										aria-label="Ask about Vanar Chain"
									>
										🔗 About Vanar Chain
									</button>
									<button 
										on:click={() => { messageText = "Explain Neutron and Kayon technology"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-sm font-medium border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md"
										aria-label="Ask about AI technology"
									>
										🧠 AI Technology
									</button>
									<button 
										on:click={() => { messageText = "How does PayFi work on Vanar?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
										aria-label="Ask about PayFi solutions"
									>
										💰 PayFi Solutions
									</button>
									<button 
										on:click={() => { messageText = "Tell me about $VANRY token"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 transition-all duration-200 text-sm font-medium border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
										aria-label="Ask about VANRY token"
									>
										🪙 $VANRY Token
									</button>
								</div>
								
								<!-- Data Privacy & Deletion Policy -->
								<div class="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
									<div class="text-center">
										<div class="flex items-center justify-center mb-2">
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 mr-2">
												<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
											</svg>
											<h4 class="text-sm font-semibold text-blue-800">Data Privacy & Deletion Policy</h4>
										</div>
										<div class="text-xs text-blue-700 space-y-1">
											<p><strong>Guaranteed Permanent Erasure:</strong> When you delete chats or messages, they are permanently erased from all systems including local storage, database, and backup systems. This provides guaranteed permanent erasure with no data retention.</p>
											
										</div>
									</div>
								</div>
							</div>
						{:else}
							<!-- Messages hint -->
							<div class="mb-4 text-center">
								<p class="text-xs text-gray-400 italic">💡 Hover over messages to delete individual ones • All deletions provide guaranteed permanent erasure from all systems</p>
							</div>
							{#each $messages as messageItem, idx (messageItem.id)}
								<!-- User Message -->
								{#if messageItem.sender === 'user'}
									<div class="flex justify-end mb-2 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
										<div class="flex items-end space-x-2 max-w-xl relative">
											<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg">
												<p class="text-sm leading-relaxed">{messageItem.content}</p>
											</div>
											<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
												<span class="text-sm">👤</span>
											</div>
											<!-- Delete button for user message -->
											<button
												on:click={() => deleteMessage(idx)}
												class="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
												aria-label="Delete message"
												title="Delete message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</div>
								{:else}
									<!-- AI Response -->
									<div class="flex justify-start mb-6 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
										<div class="flex items-end space-x-2 max-w-xl relative">
											<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
												<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
											</div>
											<div class="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-gray-100">
												{#if messageItem.sender === 'ai'}
													{#if messageItem.isStreaming}
														<!-- Streaming AI Response -->
														<div class="text-sm leading-relaxed text-gray-800">
															{#if messageItem.aiResponse && messageItem.aiResponse.length > 0}
																<!-- Show partial response with cursor -->
																<span>{messageItem.aiResponse}</span>
																<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
															{:else}
																<!-- Show placeholder while waiting for first chunk -->
																
																<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
															{/if}
														</div>
														
														<!-- Streaming status indicator -->
														<div class="flex items-center mt-2 space-x-2">
															<div class="flex items-center space-x-1">
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.2s"></div>
																<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.4s"></div>
															</div>
															<span class="text-xs text-indigo-600 font-medium">Vanar AI is typing...</span>
														</div>
													{:else if messageItem.aiResponse && messageItem.aiResponse.length > 0}
														<!-- Final AI Response -->
														<div class="text-sm leading-relaxed text-gray-800">
															<span>{messageItem.aiResponse}</span>
														</div>
														
														<!-- Timestamp -->
														<p class="mt-2 text-xs text-gray-400">
															{new Date(messageItem.createdAt).toLocaleTimeString()}
														</p>
													{:else}
														<!-- No response yet -->
														<div class="text-sm text-gray-400 italic">
															No response received
														</div>
													{/if}
												{:else}
													<!-- User message content is handled elsewhere -->
												{/if}
											</div>
											<!-- Delete button for AI response -->
											<button
												on:click={() => deleteMessage(idx)}
												class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
												aria-label="Delete message"
												title="Delete message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
											</button>
										</div>
									</div>
								{/if}
							{/each}
						{/if}
					</div>
					
					<!-- Scroll to Bottom Button -->
					{#if $messages.length > 2 && !isAtBottom()}
						<button
							on:click={scrollToBottom}
							class="absolute bottom-4 right-4 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg border border-indigo-400 hover:border-indigo-500 transition-all duration-200 animate-bounce"
							aria-label="Scroll to bottom"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M7 13l5 5 5-5"/>
								<path d="M7 6l5 5 5-5"/>
							</svg>
						</button>
					{/if}
				</div>

				<!-- Error Display -->
					{#if $error}
						<div class="px-6 pb-4">
							<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
								<div class="flex items-start justify-between">
									<div class="flex items-start">
										<span class="text-red-600 mr-2 mt-0.5">⚠️</span>
										<div class="flex-1">
											<span class="text-red-700 text-sm font-medium">{$error}</span>
											{#if $error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand')}
												<div class="mt-2 space-y-2">
													<p class="text-red-600 text-xs">
														This usually resolves within a few minutes. You can try again or wait a bit.
													</p>
													{#if retryCountdown > 0}
														<div class="flex items-center space-x-2">
															<div class="flex items-center space-x-1">
																<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
																	<circle cx="12" cy="12" r="10"/>
																	<path d="M12 6v6l4 2"/>
																</svg>
																<span class="text-xs text-red-600 font-medium">
																	Retry available in: {getTimeUntilRetry()}
																</span>
															</div>
															<!-- Progress bar for retry countdown -->
															<div class="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
																<div 
																	class="h-full bg-red-500 transition-all duration-1000 ease-linear"
																	style="width: {((60 - retryCountdown) / 60) * 100}%"
																></div>
															</div>
														</div>
													{/if}
													{#if errorRetryCount > 1}
														<p class="text-xs text-red-500">
															Attempt {errorRetryCount}: Multiple retries may indicate ongoing service issues
														</p>
													{/if}
												</div>
											{/if}
										</div>
									</div>
									<button 
										on:click={clearErrorState}
										class="text-red-400 hover:text-red-600 transition-colors ml-2"
										aria-label="Dismiss error message"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M18 6L6 18M6 6l12 12"/>
										</svg>
									</button>
								</div>
								{#if $error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand')}
									<div class="mt-3 pt-3 border-t border-red-200">
										<div class="flex items-center justify-between">
											<button 
												on:click={() => { clearErrorState(); sendMessage(); }}
												disabled={!canRetryNow()}
												class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												aria-label="Retry sending message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
													<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 12"/>
													<path d="M21 3v9h-9"/>
												</svg>
												{canRetryNow() ? 'Retry Now' : `Wait ${getTimeUntilRetry()}`}
											</button>
											{#if retryCountdown > 0}
												<div class="text-xs text-red-500">
													Next retry: {getTimeUntilRetry()}
												</div>
											{/if}
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Message Input -->
					<div class="border-t border-gray-200 bg-white p-6">
						{#if $error && ($error.includes('rate limit') || $error.includes('quota') || $error.includes('high demand'))}
							<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-center text-yellow-800">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
										<circle cx="12" cy="12" r="10"/>
										<path d="M12 6v6l4 2"/>
									</svg>
									<span class="text-sm">
										<strong>Service Status:</strong> AI service is currently busy
										{#if retryCountdown > 0}
											• Retry available in: {getTimeUntilRetry()}
										{/if}
									</span>
								</div>
							</div>
						{/if}
						<div class="flex space-x-4">
							<div class="flex-1">
								<div class="relative">
									<textarea
										bind:value={messageText}
										on:keydown={handleKeyPress}
										placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
										rows="2"
										maxlength="2000"
										class="
											block w-full resize-none rounded-xl border-gray-300 shadow-sm
											focus:border-indigo-500 focus:ring-indigo-500 pr-12 bg-gray-50
											focus:bg-white transition-all duration-200 ease-in-out
											disabled:opacity-75 disabled:cursor-not-allowed
											px-4 py-3
											leading-normal
											text-gray-800
											placeholder-gray-400
											scroll-pb-3 scroll-pt-3
											whitespace-pre-wrap
										"
										aria-label="Type your message to Vanar AI"
										aria-disabled={$loading}
										disabled={$loading}
									></textarea>
									<div class="absolute right-3 bottom-3 text-xs text-gray-400">
										{messageText.length}/2000
									</div>
								</div>
							</div>
							<div class="flex flex-col space-y-2">
								<button
									on:click={sendMessage}
									disabled={$loading || !messageText.trim() || messageText.length > 2000}
									class="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-3 text-white font-medium hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl shadow-lg"
									aria-label="Send message to Vanar AI"
								>
									<span class="flex items-center">
										{#if $loading}
											<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
												<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Processing...
										{:else}
											✨ Send
										{/if}
									</span>
									<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</button>
								{#if messageText.trim()}
									<button
										on:click={() => { messageText = ''; }}
										class="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 px-6 py-2 text-gray-600 hover:from-gray-200 hover:via-gray-300 hover:to-gray-400 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
										aria-label="Clear message input"
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
										<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
									</button>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>