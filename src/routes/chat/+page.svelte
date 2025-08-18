<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let message = '';
	let loading = false;
	type ChatItem = { message: string; response: string; createdAt: string; id?: number };
	let messages: Array<ChatItem> = [];
	let error = '';
	let messagesContainer: HTMLElement;

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
		
		// Optionally offer to load server history if this is the first conversation
		if (conversations.length === 1) {
			try {
				const response = await fetch('/api/chat');
				if (response.ok) {
					const data = await response.json();
					if (data.messages && data.messages.length > 0) {
						// Ask user if they want to load previous chat history
						if (confirm('Would you like to load your previous chat history from the server?')) {
							conv.messages = (data.messages || []).reverse(); // oldest to newest
							conv.title = data.messages[0]?.message ? 
								(data.messages[0].message.length > 40 ? data.messages[0].message.slice(0, 40) + '…' : data.messages[0].message) : 
								'Previous Chat';
							saveConversationsToStorage();
						}
					}
				}
			} catch (err) {
				console.error('Error loading server history:', err);
			}
		}
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

	function forkFromIndex(index: number) {
		if (!currentConversation) return;
		const id = generateId();
		const baseMessages = currentConversation.messages.slice(0, index + 1);
		const titleSource = baseMessages.find((m) => m.message)?.message || 'Forked Chat';
		const conv: Conversation = {
			id,
			title: (titleSource?.length || 0) > 40 ? titleSource.slice(0, 40) + '…' : (titleSource || 'Forked Chat'),
			createdAt: new Date().toISOString(),
			messages: baseMessages
		};
		conversations = [conv, ...conversations];
		currentConversationId = id;
		saveConversationsToStorage();
	}

	function deleteConversation(id: string) {
		const conv = conversations.find(c => c.id === id);
		if (!conv) return;
		
		const convTitle = conv.title || 'this conversation';
		if (!confirm(`Are you sure you want to delete "${convTitle}"? This action cannot be undone.`)) {
			return;
		}
		
		// Remove the conversation
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
			error = 'An error occurred while sending message';
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
						<button on:click={newConversation} class="rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">New Chat</button>
					</div>
					<div class="p-4 max-h-96 overflow-y-auto">
						{#if conversations.length === 0}
							<div class="text-center py-8">
								<div class="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
								</div>
								<p class="text-sm text-gray-500 mb-2">No conversations yet</p>
								<p class="text-xs text-gray-400">Start a new chat to begin</p>
							</div>
						{:else}
							{#each conversations as conv}
								<div class="mb-3 p-3 rounded-lg transition-colors cursor-pointer {currentConversationId === conv.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'}" on:click={() => selectConversation(conv.id)}>
									<div class="flex items-center justify-between">
										<p class="text-sm text-gray-800 truncate flex-1 mr-2">{conv.title}</p>
										<button 
											on:click={(e) => { e.stopPropagation(); deleteConversation(conv.id); }} 
											class="text-red-500 hover:text-red-700 text-xs p-1.5 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
											title="Delete conversation"
										>
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
										</button>
									</div>
									<p class="text-xs text-gray-500 mt-1">{new Date(conv.createdAt).toLocaleDateString()}</p>
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
								<div class="h-2 w-2 rounded-full bg-green-400"></div>
								<span class="text-sm text-white">Online</span>
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
								<div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
									<button 
										on:click={() => { message = "What is Vanar Chain?"; sendMessage(); }}
										class="p-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors text-sm"
									>
										🔗 About Vanar Chain
									</button>
									<button 
										on:click={() => { message = "Explain Neutron and Kayon technology"; sendMessage(); }}
										class="p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors text-sm"
									>
										🧠 AI Technology
									</button>
									<button 
										on:click={() => { message = "How does PayFi work on Vanar?"; sendMessage(); }}
										class="p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm"
									>
										💰 PayFi Solutions
									</button>
									<button 
										on:click={() => { message = "Tell me about $VANRY token"; sendMessage(); }}
										class="p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm"
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
								<div class="flex justify-end -mt-1 mb-3 pr-12">
									<button class="text-[11px] text-gray-400 hover:text-gray-600" on:click={() => forkFromIndex(idx)}>Fork from here</button>
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
<!-- Isko Delte delete krna hai -->
							{#if loading}
								<div class="flex justify-start mb-4">
									<div class="flex items-end space-x-2">
										<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
											<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
										</div>
										<div class="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-gray-100">
											<div class="flex items-center space-x-2">
												<div class="flex space-x-1">
													<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"></div>
													<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.1s"></div>
													<div class="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style="animation-delay: 0.2s"></div>
												</div>
												<span class="text-sm text-gray-600">AI is thinking...</span>
											</div>
										</div>
									</div>
								</div>
							{/if}
						{/if}
					</div>

					<!-- Error Display -->
					{#if error}
						<div class="px-6 pb-4">
							<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center">
								<span class="text-red-600 mr-2">⚠️</span>
								<span class="text-red-700 text-sm">{error}</span>
							</div>
						</div>
					{/if}

					<!-- Message Input -->
					<div class="border-t border-gray-200 bg-white p-6">
						<div class="flex space-x-4">
							<div class="flex-1">
								<div class="relative">
									<textarea
										bind:value={message}
										on:keypress={handleKeyPress}
										placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
										rows="2"
										class="block w-full resize-none rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-12 bg-gray-50 focus:bg-white transition-colors"
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
