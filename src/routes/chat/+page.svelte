<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let message = '';
	let loading = false;
	type ChatItem = { message: string; response: string; createdAt: string; id?: number };
	let messages: Array<ChatItem> = [];
	let error = '';
	let messagesContainer: HTMLElement;
	
	// Note: Frontend messages use temporary IDs (timestamp-based) for UI state management
	// Database messages have persistent IDs (large numbers) for server-side operations
	// The id field can be undefined (no database ID), temporary (frontend), or persistent (database)

	// Error handling state
	let retryCountdown = 0;
	let retryTimer: NodeJS.Timeout | null = null;
	let lastErrorTime = 0;
	let errorRetryCount = 0;

	// Conversations state
	type Conversation = { id: string; title: string; createdAt: string; messages: Array<ChatItem> };
	let conversations: Array<Conversation> = [];
	let currentConversationId: string | null = null;

	$: user = $page.data.session?.user;
	$: currentConversation = conversations.find((c) => c.id === currentConversationId) || null;
	$: messages = currentConversation ? currentConversation.messages : [];

	const storageKey = () => `vanar_conversations_${user?.id || 'anon'}`;
	const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}
		loadConversationsFromStorage();
		loadChatHistory();
	});

	// Cleanup timers on component destruction
	onDestroy(() => {
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
	});

	function saveConversationsToStorage() {
		try {
			localStorage.setItem(storageKey(), JSON.stringify({ conversations, currentConversationId }));
		} catch (e) {
			console.warn('Failed to save conversations:', e);
		}
	}

	function loadConversationsFromStorage() {
		try {
			const raw = localStorage.getItem(storageKey());
			if (raw) {
				const parsed = JSON.parse(raw);
				conversations = parsed.conversations || [];
				currentConversationId = parsed.currentConversationId || (conversations[0]?.id ?? null);
			}
		} catch (e) {
			console.warn('Failed to load conversations:', e);
		}
	}

	async function newConversation() {
		const id = generateId();
		const conv: Conversation = { id, title: 'New Chat', createdAt: new Date().toISOString(), messages: [] };
		conversations = [conv, ...conversations];
		currentConversationId = id;
		saveConversationsToStorage();
	}

	function selectConversation(id: string) {
		currentConversationId = id;
		saveConversationsToStorage();
	}

	function renameConversationTitleIfNeeded(firstUserMessage: string) {
		if (!currentConversation) return;
		if (currentConversation.title === 'New Chat' && firstUserMessage) {
			currentConversation.title = firstUserMessage.length > 40 ? firstUserMessage.slice(0, 40) + '…' : firstUserMessage;
			saveConversationsToStorage();
		}
	}

	async function deleteConversation(id: string) {
		const conv = conversations.find(c => c.id === id);
		if (!conv) return;
		
		const convTitle = conv.title || 'this conversation';
		if (!confirm(`Are you sure you want to delete "${convTitle}"? This action cannot be undone.`)) {
			return;
		}
		
		// Optionally delete from database if there are actual database messages
		// This is secondary to local deletion for better user experience
		try {
			await deleteConversationFromDatabase(id);
		} catch (error) {
			console.error('Failed to delete conversation from database:', error);
			// Continue with local deletion even if database deletion fails
		}
		
		// Remove the conversation from local storage
		conversations = conversations.filter(c => c.id !== id);
		
		// If we deleted the current conversation, select another one or go to welcome state
		if (currentConversationId === id) {
			if (conversations.length > 0) {
				// If there are other conversations, select the first one
				currentConversationId = conversations[0].id;
			} else {
				// If this was the last conversation, go to welcome state
				currentConversationId = null;
			}
		}
		
		saveConversationsToStorage();
	}

	async function clearAllChatHistory() {
		if (!confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
			return;
		}

		try {
			// Clear all messages from database for the current user
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messageIds: [] }) // Empty array means clear all for current user
			});
		} catch (error) {
			console.error('Failed to clear chat history from database:', error);
		}

		// Clear local storage
		conversations = [];
		currentConversationId = null;
		saveConversationsToStorage();
	}

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/';
		} catch (error) {
			console.error('Sign out error:', error);
			// Fallback: force redirect anyway
			window.location.href = '/';
		}
	}

	async function loadChatHistory() {
		try {
			const response = await fetch('/api/chat');
			if (response.ok) {
				const data = await response.json();
				// Only seed a conversation from server history if user explicitly wants to continue
				// For now, let the user start fresh with the welcome state
				// If they want to see history, they can click "New Chat" and it will load from server
			}
		} catch (err) {
			console.error('Error loading chat history:', err);
		}
	}

	async function sendMessage() {
		if (!message.trim() || loading) return;
		
		// Only create a new conversation if there isn't one and user is actually sending a message
		if (!currentConversationId) {
			newConversation();
		}

		const userMessage = message.trim();
		message = '';
		loading = true;
		error = '';

		// Add user message to UI immediately
		const tempId = Date.now();
		const newItem: ChatItem = { message: userMessage, response: '', createdAt: new Date().toISOString(), id: tempId };
		if (currentConversation) {
			currentConversation.messages = [...currentConversation.messages, newItem];
			renameConversationTitleIfNeeded(userMessage);
			saveConversationsToStorage();
		}

		try {
			const history = (currentConversation?.messages || [])
				.filter((m) => m.id !== tempId) // exclude the temp item (just the new user turn)
				.map((m) => ({ message: m.message, response: m.response }));

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMessage, history })
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
										error = data.error;
										// Check if it's a rate limit error and start countdown
										if (data.error.includes('rate limit') || data.error.includes('quota') || data.error.includes('high demand')) {
											startRetryCountdown(60);
										}
										if (currentConversation) {
											currentConversation.messages = currentConversation.messages.filter((msg) => msg.id !== tempId);
											saveConversationsToStorage();
										}
										break;
									}
									
									if (data.chunk) {
										streamedResponse += data.chunk;
										// Update the message with the streaming response
										if (currentConversation) {
											currentConversation.messages = currentConversation.messages.map((msg) =>
												msg.id === tempId ? { ...msg, response: streamedResponse } : msg
											);
											saveConversationsToStorage();
										}
										// Auto-scroll to bottom during streaming
										setTimeout(() => {
											if (messagesContainer) {
												messagesContainer.scrollTop = messagesContainer.scrollHeight;
											}
										}, 10);
									}
									
									if (data.done) {
										// Finalize the message
										if (currentConversation) {
											currentConversation.messages = currentConversation.messages.map((msg) =>
												msg.id === tempId ? { ...msg, id: undefined } : msg
											);
											saveConversationsToStorage();
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
				// Fallback to regular JSON response
				const data = await response.json();
				if (response.ok) {
					if (currentConversation) {
						currentConversation.messages = currentConversation.messages.map((msg) =>
							msg.id === tempId ? { ...msg, response: data.response, id: undefined } : msg
						);
						saveConversationsToStorage();
					}
				} else {
					error = data.error || 'Failed to get response from AI';
					if (currentConversation) {
						currentConversation.messages = currentConversation.messages.filter((msg) => msg.id !== tempId);
						saveConversationsToStorage();
					}
				}
			}
		} catch (err) {
			console.error('Chat error:', err);
			
			// Handle specific error types
			if (err instanceof Error) {
				if (err.message.includes('rate limit') || err.message.includes('quota')) {
					error = 'The AI service is currently experiencing high demand. Please try again in a few minutes.';
					// Start a 60-second retry countdown for rate limit errors
					startRetryCountdown(60);
				} else if (err.message.includes('Failed to fetch')) {
					error = 'Unable to connect to the AI service. Please check your internet connection and try again.';
				} else {
					error = 'An error occurred while sending message. Please try again.';
				}
			} else {
				error = 'An error occurred while sending message. Please try again.';
			}
			
			if (currentConversation) {
				currentConversation.messages = currentConversation.messages.filter((msg) => msg.id !== tempId);
				saveConversationsToStorage();
			}
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function startRetryCountdown(seconds: number) {
		retryCountdown = seconds;
		errorRetryCount++;
		lastErrorTime = Date.now();
		
		if (retryTimer) clearInterval(retryTimer);
		
		retryTimer = setInterval(() => {
			retryCountdown--;
			if (retryCountdown <= 0) {
				if (retryTimer) clearInterval(retryTimer);
				retryTimer = null;
				// Auto-retry when countdown reaches zero
				if (error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))) {
					// Small delay to ensure UI updates
					setTimeout(() => {
						if (retryCountdown <= 0) {
							clearErrorState();
						}
					}, 100);
				}
			}
		}, 1000);
	}

	function clearErrorState() {
		error = '';
		retryCountdown = 0;
		errorRetryCount = 0;
		if (retryTimer) {
			clearInterval(retryTimer);
			retryTimer = null;
		}
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

	// Function to delete individual messages from database (for future use)
	async function deleteMessagesFromDatabase(messageIds: number[]) {
		if (messageIds.length === 0) return;
		
		try {
			await fetch('/api/chat', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ messageIds })
			});
		} catch (error) {
			console.error('Failed to delete messages from database:', error);
		}
	}

	// Function to delete a conversation's messages from database if they have database IDs
	async function deleteConversationFromDatabase(conversationId: string) {
		const conv = conversations.find(c => c.id === conversationId);
		if (!conv) return;
		
		// Find messages that have actual database IDs (not temporary frontend IDs)
		const messageIds = conv.messages
			.filter(msg => msg.id && typeof msg.id === 'number' && msg.id > 1000000) // Database IDs are typically large numbers
			.map(msg => msg.id as number);
		
		if (messageIds.length > 0) {
			await deleteMessagesFromDatabase(messageIds);
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
							<button on:click={newConversation} class="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg" aria-label="Start a new conversation">New Chat</button>
							{#if conversations.length > 0}
								<button on:click={clearAllChatHistory} class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg" aria-label="Clear all chat history">Clear All</button>
							{/if}
						</div>
					</div>
					<div class="p-4 max-h-96 overflow-y-auto">
						{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
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
						{#if conversations.length === 0}
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
							{#each conversations as conv}
								<div 
									class="w-full mb-3 p-4 rounded-lg transition-all duration-200 cursor-pointer border {currentConversationId === conv.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'}" 
									on:click={() => selectConversation(conv.id)}
									on:keydown={(e) => e.key === 'Enter' && selectConversation(conv.id)}
									role="button"
									tabindex="0"
									aria-label="Select conversation: {conv.title}"
									aria-pressed={currentConversationId === conv.id}
								>
									<div class="flex items-center justify-between">
										<p class="text-sm font-medium text-gray-800 truncate flex-1 mr-3">{conv.title}</p>
										<button 
											on:click={(e) => { e.stopPropagation(); deleteConversation(conv.id).catch(console.error); }} 
											class="text-red-500 hover:text-red-700 text-xs p-2 rounded-md hover:bg-red-50 transition-colors flex-shrink-0 border border-red-200 hover:border-red-300"
											title="Delete conversation"
											aria-label="Delete conversation: {conv.title}"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
										</button>
									</div>
									<div class="flex items-center justify-between mt-2">
										<p class="text-xs text-gray-500">{new Date(conv.createdAt).toLocaleDateString()}</p>
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
								{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
									<div class="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
									<span class="text-sm text-yellow-200">
										{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
									</span>
								{:else if error}
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
						{#if messages.length === 0}
							<div class="flex flex-col items-center justify-center h-full text-center">
								<div class="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
									<span class="text-4xl">💬</span>
								</div>
								<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Vanar AI</h3>
								<p class="text-gray-500 max-w-md">
									Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about blockchain, AI-native technology, PayFi, RWAs, or anything else!
								</p>
								{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
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
										on:click={() => { message = "What is Vanar Chain?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 text-sm font-medium border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md"
										aria-label="Ask about Vanar Chain"
									>
										🔗 About Vanar Chain
									</button>
									<button 
										on:click={() => { message = "Explain Neutron and Kayon technology"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-sm font-medium border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md"
										aria-label="Ask about AI technology"
									>
										🧠 AI Technology
									</button>
									<button 
										on:click={() => { message = "How does PayFi work on Vanar?"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-sm font-medium border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
										aria-label="Ask about PayFi solutions"
									>
										💰 PayFi Solutions
									</button>
									<button 
										on:click={() => { message = "Tell me about $VANRY token"; sendMessage(); }}
										class="p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 text-green-700 hover:from-green-100 hover:to-green-200 transition-all duration-200 text-sm font-medium border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md"
										aria-label="Ask about VANRY token"
									>
										🪙 $VANRY Token
									</button>
								</div>
							</div>
						{:else}
							{#each messages as messageItem, idx (messageItem.createdAt)}
								<!-- User Message -->
								<div class="flex justify-end mb-2">
									<div class="flex items-end space-x-2 max-w-xl">
										<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg">
											<p class="text-sm leading-relaxed">{messageItem.message}</p>
										</div>
										<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
											<span class="text-sm">👤</span>
										</div>
									</div>
								</div>

								<!-- AI Response -->
								{#if messageItem.response || messageItem.id}
									<div class="flex justify-start mb-6">
										<div class="flex items-end space-x-2 max-w-xl">
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
										</div>
									</div>
								{/if}
							{/each}
						{/if}
					</div>

					<!-- Error Display -->
					{#if error}
						<div class="px-6 pb-4">
							<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
								<div class="flex items-start justify-between">
									<div class="flex items-start">
										<span class="text-red-600 mr-2 mt-0.5">⚠️</span>
										<div class="flex-1">
											<span class="text-red-700 text-sm font-medium">{error}</span>
											{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
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
								{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
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
						{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
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
										bind:value={message}
										on:keypress={handleKeyPress}
										placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
										rows="2"
										class="block w-full resize-none rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-12 bg-gray-50 focus:bg-white transition-colors"
										aria-label="Type your message to Vanar AI"
									></textarea>
									<div class="absolute right-3 bottom-3 text-xs text-gray-400">
										{message.length}/2000
									</div>
								</div>
							</div>
							<div class="flex flex-col space-y-2">
								<button
									on:click={sendMessage}
									disabled={loading || !message.trim() || message.length > 2000}
									class="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white font-medium hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
									aria-label="Send message to Vanar AI"
								>
									{#if loading}
										<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
										Sending
									{:else}
										<span class="mr-2">💫</span>
										Send
									{/if}
								</button>
								{#if message.trim()}
									<button
										on:click={() => { message = ''; }}
										class="inline-flex items-center justify-center rounded-xl bg-gray-100 px-6 py-2 text-gray-600 hover:bg-gray-200 transition-colors text-sm"
										aria-label="Clear message input"
									>
										Clear
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
