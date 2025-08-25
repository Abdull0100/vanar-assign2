<script lang="ts">
	import { marked } from 'marked';
	import Prism from 'prismjs';

	export let messages: Array<{ id: string; content: string; aiResponse: string | null; createdAt: string; isStreaming?: boolean }>= [];
	export let initializing: boolean = false;

	let aiResponseContainer: HTMLElement;
	let messagesContainer: HTMLElement;

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
				const highlightedResult = result.replace(
					/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
					(match, lang, code) => {
						if (lang && Prism.languages[lang]) {
							try {
								const highlighted = Prism.highlight(code, Prism.languages[lang], lang);
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
			const languageClass = Array.from(codeBlock.classList).find(cls => cls.startsWith('language-'));
			const language = languageClass ? languageClass.replace('language-', '') : '';
			pre.setAttribute('data-language', language || 'text');
			const copyButton = document.createElement('button');
			copyButton.className = 'copy-button';
			copyButton.innerHTML = '📋';
			copyButton.title = 'Copy code';
			copyButton.addEventListener('click', async () => {
				const codeText = codeBlock.textContent || '';
				try {
					await navigator.clipboard.writeText(codeText);
					copyButton.innerHTML = '✅';
					copyButton.classList.add('copied');
					copyButton.title = 'Copied!';
					setTimeout(() => {
						copyButton.innerHTML = '📋';
						copyButton.classList.remove('copied');
						copyButton.title = 'Copy code';
					}, 2000);
				} catch {}
			});
			pre.appendChild(copyButton);
		});
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
				<p class="text-xs text-gray-400 italic">💡 Each message represents a complete Q&A pair • All deletions provide guaranteed permanent erasure from all systems</p>
			</div>
			{#each messages as messageItem, idx (messageItem.id)}
				<div class="mb-6 group hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors duration-200">
					<div class="flex justify-end mb-2">
						<div class="flex items-end space-x-2 max-w-xl relative">
							<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white shadow-lg">
								<p class="text-sm leading-relaxed">{messageItem.content}</p>
							</div>
							<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
								<span class="text-sm">👤</span>
							</div>
						</div>
					</div>

					<div class="flex justify-start">
						<div class="flex items-end space-x-2 max-w-xl relative">
							<div class="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
								<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-5 h-5" />
							</div>
							<div class="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-lg border border-gray-100">
								{#if messageItem.isStreaming}
									<div class="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
										{#if messageItem.aiResponse && messageItem.aiResponse.length > 0}
											<span>{@html renderMarkdown(messageItem.aiResponse)}</span>
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
								{:else if messageItem.aiResponse && messageItem.aiResponse.length > 0}
									<div class="text-sm leading-relaxed text-gray-800 prose prose-sm max-w-none" bind:this={aiResponseContainer}>
										{@html renderMarkdown(messageItem.aiResponse)}
									</div>
									<p class="mt-2 text-xs text-gray-400">
										{new Date(messageItem.createdAt).toLocaleTimeString()}
									</p>
								{:else}
									<div class="text-sm text-gray-400 italic">
										No response received
									</div>
								{/if}
							</div>
						</div>
					</div>
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


