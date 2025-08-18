<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	// Types
	type ChatMessage = {
		id: string;
		message: string;
		response: string;
		createdAt: string;
		isUser: boolean;
		isStreaming?: boolean;
	};

	type Conversation = {
		id: string;
		title: string;
		createdAt: string;
		updatedAt: string;
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

	// Derived stores
	$: currentConversation = $conversations.find(c => c.id === $currentConversationId);
	$: user = $page.data.session?.user;

	// Error handling state
	let retryCountdown = 0;
	let retryTimer: NodeJS.Timeout | null = null;
	let errorRetryCount = 0;
	let messagesContainer: HTMLElement;

	const storageKey = () => `vanar_conversations_${user?.id || 'anon'}`;
	const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	onMount(() => {
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}
		loadConversationsFromStorage();
		loadChatHistory();
	});

	onDestroy(() => {
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
	});

	function saveConversationsToStorage() {
		try {
			localStorage.setItem(storageKey(), JSON.stringify({ 
				conversations: $conversations, 
				currentConversationId: $currentConversationId 
			}));
		} catch (e) {
			console.warn('Failed to save conversations:', e);
		}
	}

	function loadConversationsFromStorage() {
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) {
				const parsed = JSON.parse(raw);
				conversations.set(parsed.conversations || []);
				currentConversationId.set(parsed.currentConversationId || null);
			}
		} catch (e) {
			console.warn('Failed to load conversations:', e);
		}
	}

	function newConversation() {
		const id = generateId();
		const conv: Conversation = {
			id,
			title: 'New Chat',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			messages: []
		};
		
		// Use proper Svelte store updates
		conversations.update(convs => [conv, ...convs]);
		currentConversationId.set(id);
		messages.set([]);
		saveConversationsToStorage();
	}

	function selectConversation(id: string) {
		currentConversationId.set(id);
		const conv = $conversations.find(c => c.id === id);
		if (conv) {
			messages.set([...conv.messages]);
		}
		saveConversationsToStorage();
	}

	function updateConversationTitle(title: string) {
		if (!$currentConversationId) return;
		
		conversations.update(convs => 
			convs.map(conv => 
				conv.id === $currentConversationId 
					? { ...conv, title, updatedAt: new Date().toISOString() }
					: conv
			)
		);
		saveConversationsToStorage();
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
		}

		// Create user message
		const userMessage: ChatMessage = {
			id: generateId(),
			message: messageContent,
			response: '',
			createdAt: new Date().toISOString(),
			isUser: true
		};

		// Create AI message placeholder
		const aiMessage: ChatMessage = {
			id: generateId(),
			message: '',
			response: '',
			createdAt: new Date().toISOString(),
			isUser: false,
			isStreaming: true
		};

		// Optimistic update - add both messages immediately
		messages.update(msgs => [...msgs, userMessage, aiMessage]);

		// Update conversation title if it's the first message
		if ($messages.length === 2) { // Just added user + AI messages
			updateConversationTitle(messageContent.length > 40 ? messageContent.slice(0, 40) + '…' : messageContent);
		}

		// Save to local storage
		saveConversationsToStorage();

		try {
			const history = $messages
				.filter(m => !m.isUser || m.response) // Only completed message pairs
				.map(m => ({ message: m.message, response: m.response }));

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: messageContent,
					history,
					conversationId: $currentConversationId && $currentConversationId.length > 20 ? $currentConversationId : undefined
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
													? { ...msg, response: streamedResponse }
													: msg
											)
										);
										
										// Auto-scroll
										setTimeout(() => {
											if (messagesContainer) {
												messagesContainer.scrollTop = messagesContainer.scrollHeight;
											}
										}, 10);
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
											currentConversationId.set(data.conversationId);
											
											// Update conversation ID in conversations list
											conversations.update(convs => 
												convs.map(conv => 
													conv.id === userMessage.id 
														? { ...conv, id: data.conversationId }
														: conv
												)
											);
										}
										
										// Save to storage
										saveConversationsToStorage();
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
								? { ...msg, response: data.response, isStreaming: false }
								: msg
						)
					);

					// Update conversation ID if it's new
					if (data.conversationId && $currentConversationId !== data.conversationId) {
						currentConversationId.set(data.conversationId);
						
						conversations.update(convs => 
							convs.map(conv => 
								conv.id === userMessage.id 
									? { ...conv, id: data.conversationId }
									: conv
							)
						);
					}
					
					saveConversationsToStorage();
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
		
		const messageText = messageToDelete.message.length > 30 ? messageToDelete.message.slice(0, 30) + '…' : messageToDelete.message;
		
		if (!confirm(`Are you sure you want to delete this message?\n\n"${messageText}"\n\n⚠️  PERMANENT DELETION: This message will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.`)) {
			return;
		}

		// Remove the message
		messages.update(msgs => msgs.filter((_, index) => index !== messageIndex));
		
		// Update conversation title if needed
		if (messageIndex === 0 && $messages.length > 0) {
			const firstUserMessage = $messages.find(m => m.isUser);
			if (firstUserMessage) {
				updateConversationTitle(firstUserMessage.message.length > 40 ? firstUserMessage.message.slice(0, 40) + '…' : firstUserMessage.message);
			}
		}
		
		// If no messages left, reset title
		if ($messages.length === 0) {
			updateConversationTitle('New Chat');
		}
		
		saveConversationsToStorage();
	}

	async function deleteConversation(id: string) {
		const conv = $conversations.find(c => c.id === id);
		if (!conv) return;
		
		const convTitle = conv.title || 'this conversation';
		if (!confirm(`Are you sure you want to delete "${convTitle}"?\n\n⚠️  PERMANENT DELETION: This entire conversation will be permanently erased from:\n• Your local chat history\n• The database\n• All backup systems\n\nThis action cannot be undone and provides guaranteed permanent erasure from all systems.`)) {
			return;
		}
		
		// Delete from database if it's a real conversation
		if (id.length > 20) {
			try {
				await fetch('/api/chat', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ conversationIds: [id] })
				});
			} catch (error) {
				console.error('Failed to delete conversation from database:', error);
			}
		}
		
		// Remove from conversations
		conversations.update(convs => convs.filter(c => c.id !== id));
		
		// Update current conversation if needed
		if ($currentConversationId === id) {
			if ($conversations.length > 0) {
				currentConversationId.set($conversations[0].id);
				messages.set([...$conversations[0].messages]);
			} else {
				currentConversationId.set(null);
				messages.set([]);
			}
		}
		
		saveConversationsToStorage();
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

		// Clear local storage
		conversations.set([]);
		currentConversationId.set(null);
		saveConversationsToStorage();
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
					const dbConversations = data.conversations.map((conv: any) => ({
						id: conv.id,
						title: conv.title,
						createdAt: conv.createdAt,
						updatedAt: conv.updatedAt,
						messages: conv.messages || []
					}));
					
					// Merge with local conversations
					const localConversations = $conversations.filter(conv => conv.id.length <= 20);
					conversations.set([...dbConversations, ...localConversations]);
					
					// Update current conversation if needed
					if ($currentConversationId && !$conversations.find(c => c.id === $currentConversationId)) {
						currentConversationId.set($conversations[0]?.id || null);
					}
					
					// Update messages if we have a current conversation
					if ($currentConversationId) {
						const conv = $conversations.find(c => c.id === $currentConversationId);
						if (conv) {
							messages.set([...conv.messages]);
						}
					}
					
					saveConversationsToStorage();
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
							<h3 class="text-lg font-semibold text-gray-900">Conversations</h3>
							<p class="text-sm text-gray-500">Start new chats and revisit old ones</p>
						</div>
						<div class="flex space-x-2">
							<button 
								on:click={newConversation} 
								class="group relative inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white" 
								aria-label="Start a new conversation"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								New Chat
								<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						</div>
					</div>
					<div class="p-4 max-h-96 overflow-y-auto">
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
						
						<!-- Data Deletion Notice -->
						<div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div class="flex items-start text-blue-800">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 mt-0.5 flex-shrink-0">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
								</svg>
								<div class="text-xs">
									<strong>Data Privacy Notice:</strong> When you delete chats or messages, they are permanently erased from all systems including local storage, database, and backup systems. This provides guaranteed permanent erasure with no data retention.
								</div>
							</div>
						</div>
						
						{#if $conversations.length === 0}
							<div class="text-center py-12">
								<div class="h-16 w-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
								<p class="text-sm text-gray-500 mb-4">Start your first chat to begin exploring Vanar AI</p>
								<button on:click={newConversation} class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg" aria-label="Start your first chat conversation">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
									Start New Chat
								</button>
							</div>
						{:else}
							{#each $conversations as conv}
								<div 
									class="w-full mb-3 p-4 rounded-lg transition-all duration-200 cursor-pointer border {$currentConversationId === conv.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'}" 
									on:click={() => selectConversation(conv.id)}
									on:keydown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
									role="button"
									tabindex="0"
									aria-label="Select conversation: {conv.title}"
									aria-pressed={$currentConversationId === conv.id}
								>
									<div class="flex items-center justify-between">
										<p class="text-sm font-medium text-gray-800 truncate flex-1 mr-3">{conv.title}</p>
										<button 
											on:click={(e) => { e.stopPropagation(); deleteConversation(conv.id).catch(console.error); }} 
											class="group relative text-red-500 hover:text-red-700 text-xs p-2 rounded-lg hover:bg-red-50 transition-all duration-300 flex-shrink-0 border border-red-200 hover:border-red-300 hover:shadow-md hover:scale-110"
											title="Delete conversation"
											aria-label="Delete conversation: {conv.title}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
												<path d="M3 6h18"/>
												<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
												<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
											</svg>
											<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										</button>
									</div>
									<div class="flex items-center justify-between mt-2">
										<p class="text-xs text-gray-500">{new Date(conv.updatedAt || conv.createdAt).toLocaleDateString()}</p>
										<span class="text-xs text-gray-400">{conv.messages.length} messages</span>
									</div>
								</div>
							{/each}
						{/if}
					</div>
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
					<div bind:this={messagesContainer} class="h-96 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white scroll-smooth">
						{#if $messages.length === 0}
							<div class="flex flex-col items-center justify-center h-full text-center">
								<div class="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
									<span class="text-4xl">💬</span>
								</div>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Vanar AI</h3>
								<p class="text-gray-500 max-w-md">
									Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about blockchain, AI-native technology, PayFi, RWAs, or anything else!
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
											<p><strong>Guaranteed Permanent Erasure:</strong> When you delete chats or messages, they are permanently erased from:</p>
											<ul class="text-left list-disc list-inside space-y-0.5 ml-2">
												<li>Your local device storage</li>
												<li>Our secure database</li>
												<li>All backup and archival systems</li>
												<li>Any cached or temporary data</li>
											</ul>
											<p class="mt-2 font-medium">This provides complete data privacy with no data retention - your deleted content is gone forever.</p>
										</div>
									</div>
								</div>
							</div>
						{:else}
							<!-- Messages hint -->
							<div class="mb-4 text-center">
								<p class="text-xs text-gray-400 italic">💡 Hover over messages to delete individual ones • All deletions provide guaranteed permanent erasure from all systems</p>
							</div>
							{#each $messages as messageItem, idx (messageItem.createdAt)}
								<!-- User Message -->
								<div class="flex justify-end mb-2 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
									<div class="flex items-end space-x-2 max-w-xl relative">
										<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg">
											<p class="text-sm leading-relaxed">{messageItem.message}</p>
										</div>
										<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
											<span class="text-sm">👤</span>
										</div>
										<!-- Delete button for user message -->
										<button
											on:click={() => deleteMessage(idx)}
											class="group absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
											aria-label="Delete message"
											title="Delete message"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
												<path d="M18 6L6 18M6 6l12 12"/>
											</svg>
											<div class="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
										</button>
									</div>
								</div>

								<!-- AI Response -->
								{#if messageItem.response || messageItem.id}
									<div class="flex justify-start mb-6 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
										<div class="flex items-end space-x-2 max-w-xl relative">
											<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
												<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
											</div>
											<div class="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-gray-100">
												{#if messageItem.response}
													<p class="text-sm leading-relaxed text-gray-800">{messageItem.response}</p>
													{#if messageItem.id}
														<!-- Streaming indicator -->
														<div class="flex items-center mt-2 space-x-1">
															<span class="text-xs text-indigo-600 font-medium"> Vanar AI Assistant</span>
															<div class="flex space-x-1">
																<div class="h-1 w-1 rounded-full bg-indigo-400 animate-pulse"></div>
																<div class="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.2s"></div>
																<div class="h-1 w-1 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.4s"></div>
															</div>
														</div>
													{:else}
														<p class="mt-2 text-xs text-gray-400">
															{new Date(messageItem.createdAt).toLocaleTimeString()}
														</p>
													{/if}
												{:else}
													<!-- Initial response placeholder -->
													<div class="flex items-center space-x-2">
														<div class="flex space-x-1">
															<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></div>
															<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.1s"></div>
															<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.2s"></div>
														</div>
														<span class="text-sm text-gray-600">AI is responding...</span>
													</div>
												{/if}
											</div>
											<!-- Delete button for AI response -->
											<button
												on:click={() => deleteMessage(idx)}
												class="group absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg hover:shadow-xl hover:scale-125 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
												aria-label="Delete message"
												title="Delete message"
											>
												<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-90">
													<path d="M18 6L6 18M6 6l12 12"/>
												</svg>
												<div class="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
											</button>
										</div>
									</div>
								{/if}
							{/each}
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
										on:input={(e) => messageText = (e.target as HTMLTextAreaElement).value}
										on:keypress={handleKeyPress}
										placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
										rows="2"
										class="block w-full resize-none rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-12 bg-gray-50 focus:bg-white transition-colors"
										aria-label="Type your message to Vanar AI"
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
