<script lang="ts">
	import { marked } from 'marked';
	import Prism from 'prismjs';
	import 'prismjs/components/prism-markup';
	import 'prismjs/components/prism-javascript';
	import 'prismjs/components/prism-typescript';
	import 'prismjs/components/prism-json';
	import 'prismjs/components/prism-bash';
	import 'prismjs/components/prism-python';
	import 'prismjs/components/prism-css';
	import 'prismjs/components/prism-markdown';
	import 'prismjs/components/prism-sql';

	export let messages: Array<{ 
		id: string; 
		role: 'user' | 'assistant' | 'system'; 
		content: string; 
		createdAt: string; 
		isStreaming?: boolean;
		previousId?: string | null;
		versionNumber?: number;
		parentId?: string | null;
	}>= [];
	export let initializing: boolean = false;
	export let onEditMessage: ((messageId: string, newContent: string) => void) | null = null;
	export let onForkMessage: ((messageId: string, newContent: string) => Promise<any>) | null = null;
	export let onRegenerateMessage: ((messageId: string) => Promise<any>) | null = null;
	export let onSetActiveVersion: ((messageId: string, versionNumber: number) => void) | null = null;
	export let onGetActiveVersion: ((messageId: string) => number) | null = null;

	let aiResponseContainer: HTMLElement;
	let messagesContainer: HTMLElement;
	let copiedMessageId: string | null = null;
	let editingMessageId: string | null = null;
	let editText: string = '';

	// Debug logging
	$: console.log('ChatMessages received messages:', messages);

	function isAtBottom() {
		if (!messagesContainer) return true;
		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		return scrollTop + clientHeight >= scrollHeight - 10;
	}

	function scrollToBottom() {
		if (messagesContainer) {
			requestAnimationFrame(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			});
		}
	}

	function smartScrollToBottom() {
		if (isAtBottom()) scrollToBottom();
	}

	// Expose methods to parent via component ref
	export function scrollToBottomPublic() { scrollToBottom(); }
	export function smartScrollToBottomPublic() { smartScrollToBottom(); }

	$: if (messages && messagesContainer) {
		setTimeout(smartScrollToBottom, 100);
	}

	$: if (messages && aiResponseContainer) {
		setTimeout(() => {
			if (aiResponseContainer) processCodeBlocks(aiResponseContainer);
		}, 100);
	}

	function renderMarkdown(text: string): string {
		try {
			marked.setOptions({ breaks: true, gfm: true });
			const sanitized = text
				.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
				.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
				.replace(/javascript:/gi, '')
				.replace(/on\w+\s*=/gi, '');
			const result = marked(sanitized);
			if (typeof result === 'string') {
				function decodeEntities(encoded: string): string {
					const el = document.createElement('textarea');
					el.innerHTML = encoded;
					return el.value;
				}
				const highlightedResult = result.replace(
					/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
					(match, lang, code) => {
						if (lang && Prism.languages[lang]) {
							try {
								const decoded = decodeEntities(code);
								const highlighted = Prism.highlight(decoded, Prism.languages[lang], lang);
								return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
							} catch {}
						}
						return match;
					}
				);
				return highlightedResult;
			}
			return sanitized.replace(/\n/g, '<br>');
		} catch {
			return text
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				.replace(/`(.*?)`/g, '<code>$1</code>')
				.replace(/\n/g, '<br>');
		}
	}

	function processCodeBlocks(container: HTMLElement) {
		const codeBlocks = container.querySelectorAll('pre code');
		codeBlocks.forEach((codeBlock) => {
			const pre = codeBlock.parentElement;
			if (!pre || pre.querySelector('.copy-button')) return;

			const copyButton = document.createElement('button');
			copyButton.className = 'copy-button absolute top-2 right-2 p-1 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors duration-150';
			copyButton.innerHTML = `
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
				</svg>
			`;
			copyButton.title = 'Copy code';
			copyButton.onclick = () => {
				navigator.clipboard.writeText(codeBlock.textContent || '');
				copyButton.innerHTML = `
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				`;
				setTimeout(() => {
					copyButton.innerHTML = `
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
							<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
						</svg>
					`;
				}, 1000);
			};
			pre.appendChild(copyButton);
		});
	}

	function copyUserMessage(messageId: string, content: string) {
		navigator.clipboard.writeText(content);
		copiedMessageId = messageId;
		setTimeout(() => {
			copiedMessageId = null;
		}, 1000);
	}

	function copyResponse(messageId: string, content: string) {
		navigator.clipboard.writeText(content);
		copiedMessageId = messageId;
		setTimeout(() => {
			copiedMessageId = null;
		}, 1000);
	}

	function startEditMessage(messageId: string, content: string) {
		editingMessageId = messageId;
		editText = content;
	}

	function cancelEdit() {
		editingMessageId = null;
		editText = '';
	}

	async function saveEdit(messageId: string) {
		if (onForkMessage && editText.trim()) {
			try {
				await onForkMessage(messageId, editText.trim());
			} catch (error) {
				console.error('Failed to fork message:', error);
			}
		} else if (onEditMessage && editText.trim()) {
			onEditMessage(messageId, editText.trim());
		}
		editingMessageId = null;
		editText = '';
	}

	// Helper function to get version navigation info for a message
	function getVersionInfo(message: any) {
		if (message.role !== 'assistant') return null;
		
		// For existing data without forking fields, don't show version navigation
		if (message.previousId === undefined && message.versionNumber === undefined) {
			return null;
		}
		
		// Find all versions of this message (messages with same previousId)
		const previousId = message.previousId;
		
		// If this message has a previousId, it's part of a version group
		if (previousId) {
			// Find all messages that are versions of the same original response
			const versions = messages.filter(m => 
				m.role === 'assistant' && 
				m.previousId === previousId
			).sort((a, b) => (a.versionNumber || 1) - (b.versionNumber || 1));
			
			if (versions.length > 1) {
				// Find the current version index
				const currentIndex = versions.findIndex(v => v.id === message.id);
				const currentVersion = currentIndex + 1;
				
				return {
					total: versions.length,
					current: currentVersion,
					versions,
					previousId // Store this for navigation
				};
			}
		}
		
		return null;
	}

	// Function to get branch information for a user message
	function getUserMessageBranches(message: any) {
		if (message.role !== 'user') return null;
		
		// Find all user messages that are forks from this message
		const forkedUserMessages = messages.filter(m => 
			m.role === 'user' && 
			m.previousId === message.id
		);
		
		// If there are forks, show branch navigation
		if (forkedUserMessages.length > 0) {
			// Get the current active version for this message group
			let currentVersion = 1; // Default to original
			if (onGetActiveVersion) {
				currentVersion = onGetActiveVersion(message.id);
			}
			
			return {
				total: forkedUserMessages.length + 1, // +1 for the original branch
				current: currentVersion,
				branches: [message, ...forkedUserMessages].sort((a, b) => (a.versionNumber || 1) - (b.versionNumber || 1)),
				messageId: message.id
			};
		}
		
		return null;
	}

	// Function to handle branch navigation for user messages
	function navigateUserBranch(messageId: string, direction: 'prev' | 'next') {
		const message = messages.find(m => m.id === messageId);
		if (!message) return;
		
		const branchInfo = getUserMessageBranches(message);
		if (!branchInfo) return;
		
		// Calculate new index
		let newIndex = direction === 'prev' ? (branchInfo.current || 1) - 2 : (branchInfo.current || 1);
		if (newIndex < 0) newIndex = branchInfo.total - 1;
		if (newIndex >= branchInfo.total) newIndex = 0;
		
		const targetBranch = branchInfo.branches[newIndex];
		if (targetBranch && onSetActiveVersion) {
			// Set the active version for this message group
			// Use the original message ID (the one being forked from) as the key
			onSetActiveVersion(messageId, targetBranch.versionNumber || 1);
		}
	}

	// Function to handle version navigation for assistant messages
	function navigateVersion(messageId: string, direction: 'prev' | 'next') {
		const message = messages.find(m => m.id === messageId);
		if (!message) return;
		
		const versionInfo = getVersionInfo(message);
		if (!versionInfo) return;
		
		// Calculate new index
		let newIndex = direction === 'prev' ? versionInfo.current - 2 : versionInfo.current;
		if (newIndex < 0) newIndex = versionInfo.total - 1;
		if (newIndex >= versionInfo.total) newIndex = 0;
		
		const targetVersion = versionInfo.versions[newIndex];
		if (targetVersion && onSetActiveVersion) {
			// Set the active version for this message group using previousId as the key
			onSetActiveVersion(versionInfo.previousId, targetVersion.versionNumber || 1);
		}
	}
</script>

<div class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
	<div bind:this={messagesContainer} class="p-4 lg:p-6">
		{#if messages.length === 0}
			{#if initializing}
				<div class="flex items-center justify-center h-32 text-gray-400 text-sm">Loading chat…</div>
			{:else}
			<div class="flex flex-col items-center justify-center h-full text-center">
				<div class="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
					<span class="text-4xl">💬</span>
				</div>
				<br>
				<h3 class="text-xl font-semibold text-gray-900 mb-2">Welcome to Vanar AI Assistant</h3>
				<p class="text-gray-500 max-w-md">
					Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about anything!
				</p>
			</div>
			{/if}
		{:else}
			<div class="mb-4 text-center">
				<p class="text-xs text-gray-400 italic">💡 Messages are displayed by role • All deletions provide guaranteed permanent erasure from all systems</p>
			</div>
			{#each messages as messageItem, idx (messageItem.id)}
				<div class="mb-6 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
					{#if messageItem.role === 'user'}
						<!-- User Message -->
						<div class="flex justify-end mb-2">
							<div class="flex items-end space-x-2 max-w-xl relative">
								{#if editingMessageId === messageItem.id}
									<div class="rounded-2xl rounded-br-sm bg-white border-2 border-indigo-600 px-4 py-3 shadow-lg flex-1">
										<textarea 
											bind:value={editText}
											class="w-full text-sm leading-relaxed resize-none border-none outline-none bg-transparent"
											rows="3"
											placeholder="Edit your message..."
										></textarea>
										<div class="flex justify-end space-x-2 mt-2">
											<button 
												on:click={cancelEdit}
												class="px-3 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50 text-gray-700"
											>
												Cancel
											</button>
											<button 
												on:click={() => saveEdit(messageItem.id)}
												class="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white"
											>
												Save
											</button>
										</div>
									</div>
								{:else}
									<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg">
										<p class="text-sm leading-relaxed">{messageItem.content}</p>
									</div>
								{/if}
								<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
									<span class="text-sm">👤</span>
								</div>
							</div>
						</div>
						
						<!-- User message action buttons -->
						{#if editingMessageId !== messageItem.id}
							<div class="flex justify-end mr-10 mb-1">
								<div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<button 
										on:click={() => copyUserMessage(messageItem.id + '_user', messageItem.content)}
										class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
										title="Copy"
										aria-label="Copy message"
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											{#if copiedMessageId === messageItem.id + '_user'}
												<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M21 9v10a2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											{:else}
												<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
												<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
											{/if}
										</svg>
									</button>
									{#if onForkMessage}
										<button 
											on:click={() => startEditMessage(messageItem.id, messageItem.content)}
											class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
											title="Edit & Fork"
											aria-label="Edit and fork message"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</button>
									{:else if onEditMessage}
										<button 
											on:click={() => startEditMessage(messageItem.id, messageItem.content)}
											class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
											title="Edit"
											aria-label="Edit message"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Branch Navigation for User Messages -->
						{@const branchInfo = getUserMessageBranches(messageItem)}
						{#if branchInfo && branchInfo.total > 1}
							<div class="flex justify-end mr-10 mb-2">
								<div class="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1 text-xs">
									<button 
										on:click={() => navigateUserBranch(messageItem.id, 'prev')}
										class="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={(branchInfo.current || 1) <= 1}
										title="Previous branch"
										aria-label="Previous branch"
									>
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</button>
									<span class="font-medium text-gray-700">
										{branchInfo.current} / {branchInfo.total}
									</span>
									<button 
										on:click={() => navigateUserBranch(messageItem.id, 'next')}
										class="p-1 rounded hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={(branchInfo.current || 1) >= branchInfo.total}
										title="Next branch"
										aria-label="Next branch"
									>
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									</button>
									<span class="text-gray-500 text-xs">branch</span>
								</div>
							</div>
						{/if}
					{:else if messageItem.role === 'assistant'}
						<!-- Assistant Message -->
						<div class="flex justify-start">
							<div class="flex items-end space-x-2 max-w-xl relative">
								<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
									<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
								</div>
								<div class="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-gray-100">
									{#if messageItem.isStreaming}
										<div class="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
											{#if messageItem.content && messageItem.content.length > 0}
												<span>{@html renderMarkdown(messageItem.content)}</span>
												<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
											{:else}
												<span class="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-1"></span>
											{/if}
										</div>
										<div class="flex items-center mt-2 space-x-2">
											<div class="flex items-center space-x-1">
												<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
												<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.2s"></div>
												<div class="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" style="animation-delay: 0.4s"></div>
											</div>
											<span class="text-xs text-indigo-600 font-medium">Vanar AI is typing...</span>
										</div>
									{:else if messageItem.content && messageItem.content.length > 0}
										<div class="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
											{@html renderMarkdown(messageItem.content)}
										</div>
										
										<!-- Version Navigation -->
										{@const versionInfo = getVersionInfo(messageItem)}
										{#if versionInfo && versionInfo.total > 1}
											<div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
												<div class="flex items-center space-x-2">
													<button 
														on:click={() => navigateVersion(messageItem.id, 'prev')}
														class="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														disabled={versionInfo.current <= 1}
														title="Previous version"
														aria-label="Previous version"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
														</svg>
													</button>
													<span class="text-xs font-medium text-gray-600">
														{versionInfo.current} / {versionInfo.total}
													</span>
													<button 
														on:click={() => navigateVersion(messageItem.id, 'next')}
														class="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
														disabled={versionInfo.current >= versionInfo.total}
														title="Next version"
														aria-label="Next version"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
															<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
														</svg>
													</button>
													<span class="text-gray-500 text-xs">version</span>
												</div>
												<span class="text-xs text-gray-400">{new Date(messageItem.createdAt).toLocaleTimeString()}</span>
											</div>
										{:else}
											<p class="mt-2 text-xs text-gray-400">{new Date(messageItem.createdAt).toLocaleTimeString()}</p>
										{/if}
									{:else}
										<div class="text-sm text-gray-400 italic">
											No response received
										</div>
									{/if}
								</div>
							</div>
						</div>
						
						<!-- AI response action buttons -->
						{#if messageItem.content && messageItem.content.length > 0 && !messageItem.isStreaming}
							<div class="flex justify-start ml-10 mt-1">
								<div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<button 
										on:click={() => copyResponse(messageItem.id, messageItem.content)}
										class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
										title="Copy"
										aria-label="Copy response"
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											{#if copiedMessageId === messageItem.id}
												<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											{:else}
												<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
												<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
											{/if}
										</svg>
									</button>
									{#if onRegenerateMessage}
										<button 
											on:click={() => onRegenerateMessage(messageItem.id)}
											class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
											title="Regenerate"
											aria-label="Regenerate response"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												<path d="M3 21v-5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</button>
									{/if}
								</div>
							</div>
						{/if}
					{:else if messageItem.role === 'system'}
						<!-- System Message -->
						<div class="flex justify-center mb-2">
							<div class="bg-gray-100 text-gray-600 px-3 py-2 rounded-full text-xs">
								{messageItem.content}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	{#if messages.length > 1 && !isAtBottom()}
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

<style>
	:global(.prose pre) {
		position: relative;
		background-color: #1f2937; /* gray-800 */
		border-radius: 0.5rem; /* rounded */
		padding: 1rem 2.5rem 1rem 1rem; /* extra right padding for copy button */
		overflow: auto;
		border: 1px solid #374151; /* gray-700 */
	}

	:global(.prose pre code) {
		background: transparent !important;
		white-space: pre;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		font-size: 0.875rem;
		line-height: 1.25rem;
		color: #f9fafb; /* gray-100 */
	}

	:global(.prose code) {
		background-color: #f3f4f6; /* gray-100 */
		color: #1f2937; /* gray-800 */
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	}

	:global(.prose p) {
		margin: 0.5rem 0;
	}

	:global(.prose ul) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:global(.prose li) {
		margin: 0.25rem 0;
	}

	:global(.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6) {
		margin: 1rem 0 0.5rem 0;
		font-weight: 600;
		line-height: 1.25;
	}

	:global(.prose h1) {
		font-size: 1.5rem;
	}

	:global(.prose h2) {
		font-size: 1.25rem;
	}

	:global(.prose h3) {
		font-size: 1.125rem;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #e5e7eb; /* gray-200 */
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: #6b7280; /* gray-500 */
	}

	:global(.prose table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}

	:global(.prose th, .prose td) {
		border: 1px solid #e5e7eb; /* gray-200 */
		padding: 0.5rem;
		text-align: left;
	}

	:global(.prose th) {
		background-color: #f9fafb; /* gray-50 */
		font-weight: 600;
	}

	:global(.prose a) {
		color: #3b82f6; /* blue-500 */
		text-decoration: underline;
	}

	:global(.prose a:hover) {
		color: #1d4ed8; /* blue-700 */
	}

	:global(.prose strong) {
		font-weight: 600;
	}

	:global(.prose em) {
		font-style: italic;
	}
</style>


