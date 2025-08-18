<script lang="ts">
	import { onMount } from 'svelte';

	interface Message {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	}

	interface Props {
		apiEndpoint?: string;
	}

	let { apiEndpoint = '/api/chat' }: Props = $props();

	let messages = $state<Message[]>([]);
	let userInput = $state('');
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let chatContainer: HTMLElement;

	// Auto-scroll to bottom when new messages are added
	$effect(() => {
		if (chatContainer && messages.length > 0) {
			setTimeout(() => {
				chatContainer.scrollTop = chatContainer.scrollHeight;
			}, 100);
		}
	});

	async function sendMessage() {
		if (!userInput.trim() || isLoading) return;

		const userMessage: Message = {
			id: crypto.randomUUID(),
			role: 'user',
			content: userInput.trim(),
			timestamp: new Date()
		};

		messages = [...messages, userMessage];
		const currentInput = userInput;
		userInput = '';
		isLoading = true;
		error = null;

		try {
			console.log('Sending request to:', apiEndpoint);
			const response = await fetch(apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					messages: messages.map(msg => ({
						role: msg.role,
						content: msg.content
					}))
				})
			});

			console.log('Response status:', response.status);
			console.log('Response headers:', Object.fromEntries(response.headers.entries()));

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Response error:', errorText);
				throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
			}

			// Check if response is JSON (non-streaming) or streaming
			const contentType = response.headers.get('content-type');
			
			if (contentType && contentType.includes('application/json')) {
				// Handle JSON response
				const data = await response.json();
				console.log('Received JSON response:', data);
				
				const assistantMessage: Message = {
					id: crypto.randomUUID(),
					role: 'assistant',
					content: data.reply || 'No response received',
					timestamp: new Date()
				};
				
				messages = [...messages, assistantMessage];
			} else {
				// Handle streaming response
				const reader = response.body?.getReader();
				if (!reader) {
					throw new Error('No response body');
				}

				const assistantMessage: Message = {
					id: crypto.randomUUID(),
					role: 'assistant',
					content: '',
					timestamp: new Date()
				};

				messages = [...messages, assistantMessage];

				const decoder = new TextDecoder();
				let buffer = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const data = line.slice(6);
							if (data === '[DONE]') {
								return;
							}
							try {
								const parsed = JSON.parse(data);
								if (parsed.type === 'text-delta' && parsed.textDelta) {
									assistantMessage.content += parsed.textDelta;
									messages = [...messages];
								}
							} catch (e) {
								// Ignore parsing errors for incomplete JSON
							}
						}
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred while sending the message';
			console.error('Chat error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage();
		}
	}

	function formatTimestamp(date: Date): string {
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex flex-col h-full max-w-5xl mx-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
	<!-- Enhanced Chat Header -->
	<div class="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
		<div class="flex items-center space-x-3">
			<div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
				<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<div>
				<h2 class="text-xl font-bold text-white">AI Assistant</h2>
				<p class="text-blue-100 text-sm">Powered by Google Gemini</p>
			</div>
		</div>
		<div class="flex items-center space-x-3">
			{#if isLoading}
				<div class="flex items-center space-x-2 text-white">
					<div class="w-3 h-3 bg-white rounded-full animate-pulse"></div>
					<div class="w-3 h-3 bg-white rounded-full animate-pulse" style="animation-delay: 0.2s"></div>
					<div class="w-3 h-3 bg-white rounded-full animate-pulse" style="animation-delay: 0.4s"></div>
					<span class="text-sm font-medium">Thinking...</span>
				</div>
			{:else}
				<div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
				<span class="text-green-100 text-sm">Online</span>
			{/if}
		</div>
	</div>

	<!-- Enhanced Messages Container -->
	<div
		bind:this={chatContainer}
		class="flex-1 overflow-y-auto p-6 space-y-6 min-h-96 max-h-96 bg-gradient-to-b from-transparent to-white/10"
	>
		{#if messages.length === 0}
			<div class="flex flex-col items-center justify-center h-full text-gray-600">
				<!-- Animated Robot GIF -->
				<div class="mb-6">
					<img 
						src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif" 
						alt="Robot waving" 
						class="w-32 h-32 rounded-full border-4 border-white/20 shadow-lg"
					/>
				</div>
				<div class="text-center space-y-2">
					<h3 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						Hello! I'm your AI Assistant 🤖
					</h3>
					<p class="text-lg text-gray-600 max-w-md">
						Ask me anything - I can help with coding, writing, analysis, and much more!
					</p>
					<div class="flex flex-wrap justify-center gap-2 mt-4">
						<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">💻 Coding Help</span>
						<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">✍️ Writing</span>
						<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">🔍 Analysis</span>
						<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">🎯 Problem Solving</span>
					</div>
				</div>
			</div>
		{:else}
			{#each messages as message (message.id)}
				<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'} group">
					{#if message.role === 'assistant'}
						<div class="flex items-start space-x-3 max-w-2xl">
							<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
								</svg>
							</div>
							<div class="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
								<div class="whitespace-pre-wrap break-words text-gray-800 leading-relaxed">{message.content}</div>
								<div class="text-xs text-gray-500 mt-2 flex items-center space-x-2">
									<span>{formatTimestamp(message.timestamp)}</span>
									<div class="w-1 h-1 bg-gray-300 rounded-full"></div>
									<span>AI Assistant</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="flex items-start space-x-3 max-w-2xl">
							<div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
								<div class="whitespace-pre-wrap break-words text-white leading-relaxed">{message.content}</div>
								<div class="text-xs text-blue-100 mt-2 flex items-center space-x-2">
									<span>{formatTimestamp(message.timestamp)}</span>
									<div class="w-1 h-1 bg-blue-200 rounded-full"></div>
									<span>You</span>
								</div>
							</div>
							<div class="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}

		{#if isLoading && messages.length > 0}
			<div class="flex justify-start">
				<div class="flex items-start space-x-3 max-w-2xl">
					<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
						<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
					<div class="bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
							<div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
							<div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
							<span class="text-gray-600 text-sm">AI is typing...</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Enhanced Error Display -->
	{#if error}
		<div class="mx-6 mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
			<div class="flex items-center space-x-3">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<p class="text-sm font-medium text-red-800">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Enhanced Input Area -->
	<div class="p-6 border-t border-white/20 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-sm rounded-b-2xl">
		<div class="flex items-end space-x-3">
			<div class="flex-1 relative">
				<textarea
					bind:value={userInput}
					onkeypress={handleKeyPress}
					placeholder="Type your message here... ✨"
					disabled={isLoading}
					class="w-full px-4 py-3 border border-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 placeholder-gray-500"
					rows="2"
				></textarea>
				<div class="absolute bottom-2 right-2 text-xs text-gray-400">
					{userInput.length}/1000
				</div>
			</div>
			<button
				onclick={sendMessage}
				disabled={!userInput.trim() || isLoading}
				aria-label="Send message"
				class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
			>
				<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
				</svg>
				<span class="font-medium">Send</span>
			</button>
		</div>
		<div class="mt-3 flex items-center justify-between text-xs text-gray-500">
			<div class="flex items-center space-x-4">
				<span>💡 Press Enter to send</span>
				<span>⚡ Shift+Enter for new line</span>
			</div>
			<div class="flex items-center space-x-2">
				<span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
				<span>AI Assistant Ready</span>
			</div>
		</div>
	</div>
</div>
