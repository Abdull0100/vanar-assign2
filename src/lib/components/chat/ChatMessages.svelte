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
	import { Bot, User, Copy, Edit, Check, MessageSquare } from '@lucide/svelte';

	export let messages: Array<{ id: string; content: string; aiResponse: string | null; createdAt: string; isStreaming?: boolean }>= [];
	export let initializing: boolean = false;
	export let onEditMessage: ((messageId: string, newContent: string) => void) | null = null;

	let aiResponseContainer: HTMLElement;
	let messagesContainer: HTMLElement;
	let copiedMessageId: string | null = null;
	let editingMessageId: string | null = null;
	let editText: string = '';

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

	$: if (messages && messagesContainer) {
		setTimeout(() => {
			if (messagesContainer) processCodeBlocks(messagesContainer);
		}, 100);
	}

	// Process code blocks on component mount for existing messages
	$: if (messagesContainer && messages.length > 0) {
		requestAnimationFrame(() => {
			if (messagesContainer) processCodeBlocks(messagesContainer);
		});
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
								// Remove unnecessary leading whitespace/indentation
								const trimmedCode = decoded.replace(/^\n+/, '').replace(/\n+$/, '');
								const lines = trimmedCode.split('\n');
								
								// Find minimum indentation (excluding empty lines)
								const nonEmptyLines = lines.filter(line => line.trim().length > 0);
								if (nonEmptyLines.length > 0) {
									const minIndent = Math.min(...nonEmptyLines.map(line => {
										const match = line.match(/^(\s*)/);
										return match ? match[1].length : 0;
									}));
									
									// Remove the common indentation from all lines
									const dedentedLines = lines.map(line => {
										if (line.trim().length === 0) return '';
										return line.substring(minIndent);
									});
									
									const finalCode = dedentedLines.join('\n');
									const highlighted = Prism.highlight(finalCode, Prism.languages[lang], lang);
									return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
								} else {
									const highlighted = Prism.highlight(trimmedCode, Prism.languages[lang], lang);
									return `<pre><code class="language-${lang}">${highlighted}</code></pre>`;
								}
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
		// Find all code blocks in the container (both new and existing)
		const codeBlocks = container.querySelectorAll('pre code');
		codeBlocks.forEach((codeBlock) => {
			const pre = codeBlock.parentElement;
			if (!pre || pre.querySelector('.copy-button')) return; // Skip if button already exists
			
			// Set up language attribute
			const languageClass = Array.from(codeBlock.classList).find(cls => cls.startsWith('language-'));
			const language = languageClass ? languageClass.replace('language-', '') : '';
			pre.setAttribute('data-language', language || 'text');
			
			// Create copy button
			const copyButton = document.createElement('button');
			copyButton.className = 'copy-button';
			copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
			copyButton.title = 'Copy code';
			copyButton.setAttribute('aria-label', `Copy ${language || 'code'} code`);
			
			// Add click handler for copy functionality
			copyButton.addEventListener('click', async (e) => {
				e.preventDefault();
				e.stopPropagation();
				const codeText = codeBlock.textContent || '';
				try {
					await navigator.clipboard.writeText(codeText);
					copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
					copyButton.classList.add('copied');
					copyButton.title = 'Copied!';
					setTimeout(() => {
						copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
						copyButton.classList.remove('copied');
						copyButton.title = 'Copy code';
					}, 2000);
				} catch (err) {
					console.warn('Failed to copy code:', err);
				}
			});
			
			pre.appendChild(copyButton);
		});
	}

	async function copyResponse(messageId: string, text: string) {
		try {
			await navigator.clipboard.writeText(text || '');
			copiedMessageId = messageId;
			setTimeout(() => { copiedMessageId = null; }, 2000);
		} catch {}
	}

	async function copyUserMessage(messageId: string, text: string) {
		try {
			await navigator.clipboard.writeText(text || '');
			copiedMessageId = messageId;
			setTimeout(() => { copiedMessageId = null; }, 2000);
		} catch {}
	}

	function startEditMessage(messageId: string, currentText: string) {
		editingMessageId = messageId;
		editText = currentText;
	}

	function cancelEdit() {
		editingMessageId = null;
		editText = '';
	}

	function saveEdit(messageId: string) {
		if (onEditMessage && editText.trim()) {
			onEditMessage(messageId, editText.trim());
		}
		editingMessageId = null;
		editText = '';
	}
</script>

<div class="flex-1 overflow-y-auto bg-background">
	<div bind:this={messagesContainer} class="p-4 lg:p-6">
		{#if messages.length === 0}
			{#if initializing}
				<div class="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading chat…</div>
			{:else}
			<div class="flex flex-col items-center justify-center h-full text-center">
				<div class="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
					<MessageSquare class="w-10 h-10 text-muted-foreground" />
				</div>
				<br>
				<h3 class="text-xl font-semibold mb-2">Welcome to Vanar AI Assistant</h3>
				<p class="text-muted-foreground max-w-md">
					Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about anything!
				</p>
			</div>
			{/if}
		{:else}
			<div class="mb-4 text-center">
				<p class="text-xs text-muted-foreground italic">Each message represents a complete Q&A pair • All deletions provide guaranteed permanent erasure from all systems</p>
			</div>
			{#each messages as messageItem, idx (messageItem.id)}
				<div class="mb-6 group hover:bg-muted/30 rounded-lg p-1 -m-1 transition-colors duration-200">
					<div class="flex justify-end mb-2">
						<div class="flex items-end space-x-2 max-w-xl relative">
							{#if editingMessageId === messageItem.id}
								<div class="rounded-2xl rounded-br-sm bg-card border-2 border-primary px-4 py-3 shadow-lg flex-1">
									<textarea 
										bind:value={editText}
										class="w-full text-sm leading-relaxed resize-none border-none outline-none bg-transparent text-foreground placeholder:text-muted-foreground"
										rows="3"
										placeholder="Edit your message..."
									></textarea>
									<div class="flex justify-end space-x-2 mt-2">
										<button 
											on:click={cancelEdit}
											class="px-3 py-1 text-xs rounded border border-border hover:bg-muted text-foreground"
										>
											Cancel
										</button>
										<button 
											on:click={() => saveEdit(messageItem.id)}
											class="px-3 py-1 text-xs rounded bg-primary hover:bg-primary/90 text-primary-foreground"
										>
											Save
										</button>
									</div>
								</div>
							{:else}
								<div class="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground shadow-lg">
									<p class="text-sm leading-relaxed">{messageItem.content}</p>
								</div>
							{/if}
							<div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
								<User class="w-4 h-4 text-muted-foreground" />
							</div>
						</div>
					</div>
					
					<!-- User message action buttons -->
					{#if editingMessageId !== messageItem.id}
						<div class="flex justify-end mr-10 mb-1">
							<div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<button 
									on:click={() => copyUserMessage(messageItem.id + '_user', messageItem.content)}
									class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
									title="Copy"
									aria-label="Copy message"
								>
									{#if copiedMessageId === messageItem.id + '_user'}
										<Check class="w-4 h-4" />
									{:else}
										<Copy class="w-4 h-4" />
									{/if}
								</button>
								<button 
									on:click={() => startEditMessage(messageItem.id, messageItem.content)}
									class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
									title="Edit"
									aria-label="Edit message"
								>
									<Edit class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/if}

					<div class="flex justify-start">
						<div class="flex items-end space-x-2 max-w-xl relative">
							<div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
								<Bot class="w-4 h-4 text-muted-foreground" />
							</div>
							<div class="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-lg border">
								{#if messageItem.isStreaming}
									<div class="text-sm leading-relaxed text-foreground prose prose-sm max-w-none" bind:this={aiResponseContainer}>
										{#if messageItem.aiResponse && messageItem.aiResponse.length > 0}
											<span>{@html renderMarkdown(messageItem.aiResponse)}</span>
											<span class="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>
										{:else}
											<span class="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>
										{/if}
									</div>
									<div class="flex items-center mt-2 space-x-2">
										<div class="flex items-center space-x-1">
											<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
											<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]"></div>
											<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]"></div>
										</div>
										<span class="text-xs text-primary font-medium">Vanar AI is typing...</span>
									</div>
								{:else if messageItem.aiResponse && messageItem.aiResponse.length > 0}
									<div class="text-sm leading-relaxed text-foreground prose prose-sm max-w-none" bind:this={aiResponseContainer}>
										{@html renderMarkdown(messageItem.aiResponse)}
									</div>
									<p class="mt-2 text-xs text-muted-foreground">
										{new Date(messageItem.createdAt).toLocaleTimeString()}
									</p>
								{:else}
									<div class="text-sm text-muted-foreground italic">
										No response received
									</div>
								{/if}
							</div>
						</div>
					</div>
					
					<!-- AI response action button -->
					{#if messageItem.aiResponse && messageItem.aiResponse.length > 0 && !messageItem.isStreaming}
						<div class="flex justify-start ml-10 mt-1">
							<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<button 
									on:click={() => copyResponse(messageItem.id, messageItem.aiResponse || '')}
									class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
									title="Copy"
									aria-label="Copy response"
								>
									{#if copiedMessageId === messageItem.id}
										<Check class="w-4 h-4" />
									{:else}
										<Copy class="w-4 h-4" />
									{/if}
								</button>
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
			class="absolute bottom-4 right-4 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg border transition-all duration-200 animate-bounce"
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
	:global(.prose pre),
	:global(pre[class*="language-"]),
	:global(.prose pre[class*="language-"]) {
		position: relative;
		background-color: hsl(var(--secondary)) !important;
		border-radius: 0.5rem;
		padding: 1rem 2.5rem 1rem 1rem;
		overflow: auto;
		border: 1px solid hsl(var(--border));
	}

	:global(.prose pre code) {
		background: transparent !important;
		white-space: pre;
		font-family: var(--font-mono);
		font-size: 0.85rem;
		color: hsl(var(--foreground));
	}

	:global(.prose pre .copy-button) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: hsl(var(--muted-foreground) / 0.1);
		color: hsl(var(--muted-foreground));
		border: 1px solid hsl(var(--border));
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.prose pre .copy-button:hover) {
		background: hsl(var(--muted-foreground) / 0.2);
		color: hsl(var(--foreground));
	}

	:global(.prose pre .copy-button.copied) {
		background: hsl(var(--primary) / 0.2);
		border-color: hsl(var(--primary));
		color: hsl(var(--primary));
	}
</style>


