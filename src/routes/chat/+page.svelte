<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let message = '';
	let loading = false;
	let messages: Array<{ message: string; response: string; createdAt: string; id?: number }> = [];
	let error = '';
	let messagesContainer: HTMLElement;

	$: user = $page.data.session?.user;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}
		loadChatHistory();
	});

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
				messages = data.messages.reverse(); // Show newest first
			}
		} catch (err) {
			console.error('Error loading chat history:', err);
		}
	}

	async function sendMessage() {
		if (!message.trim() || loading) return;

		const userMessage = message.trim();
		message = '';
		loading = true;
		error = '';

		// Add user message to UI immediately
		const tempId = Date.now();
		messages = [
			...messages,
			{ message: userMessage, response: '', createdAt: new Date().toISOString(), id: tempId }
		];

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMessage })
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
										messages = messages.filter((msg) => msg.id !== tempId);
										break;
									}
									
									if (data.chunk) {
										streamedResponse += data.chunk;
										// Update the message with the streaming response
										messages = messages.map((msg) =>
											msg.id === tempId ? { ...msg, response: streamedResponse } : msg
										);
										// Auto-scroll to bottom during streaming
										setTimeout(() => {
											if (messagesContainer) {
												messagesContainer.scrollTop = messagesContainer.scrollHeight;
											}
										}, 10);
									}
									
									if (data.done) {
										// Finalize the message
										messages = messages.map((msg) =>
											msg.id === tempId ? { ...msg, id: undefined } : msg
										);
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
					messages = messages.map((msg) =>
						msg.id === tempId ? { ...msg, response: data.response, id: undefined } : msg
					);
				} else {
					error = data.error || 'Failed to get response from AI';
					messages = messages.filter((msg) => msg.id !== tempId);
				}
			}
		} catch (err) {
			error = 'An error occurred while sending message';
			messages = messages.filter((msg) => msg.id !== tempId);
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
					<div class="p-4 border-b border-gray-200">
						<h3 class="text-lg font-semibold text-gray-900">Chat History</h3>
						<p class="text-sm text-gray-500">Your recent conversations</p>
					</div>
					<div class="p-4 max-h-96 overflow-y-auto">
						{#if messages.length === 0}
							<p class="text-sm text-gray-500 text-center py-8">No conversations yet</p>
						{:else}
							{#each messages.slice(0, 10) as messageItem, index}
								<div class="mb-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
									<p class="text-sm text-gray-800 truncate">{messageItem.message}</p>
									<p class="text-xs text-gray-500 mt-1">
										{new Date(messageItem.createdAt).toLocaleDateString()}
									</p>
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
							{#each messages as messageItem (messageItem.createdAt)}
								<!-- User Message -->
								<div class="flex justify-end mb-4">
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
