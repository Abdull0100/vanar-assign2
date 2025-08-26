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

	export let messages: Array<{ id: string; content: string; aiResponse: string | null; createdAt: string; isStreaming?: boolean }>= [];
	export let initializing: boolean = false;
	export let onEditMessage: ((messageId: string, newContent: string) => void) | null = null;

	let aiResponseContainer: HTMLElement;
	let messagesContainer: HTMLElement;
	let copiedMessageId: string | null = null;
	let editingMessageId: string | null = null;
	let editText: string = '';



	function scrollToBottom() {
		if (messagesContainer) {
			requestAnimationFrame(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			});
		}
	}

	function isAtBottom() {
		if (!messagesContainer) return true;
		const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
		return scrollTop + clientHeight >= scrollHeight - 50; // Increased tolerance
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
			// Check if this is a file upload message
			if (text.startsWith('📎 **') && text.includes('**File Details:**')) {
				// Extract file name from the message
				const fileNameMatch = text.match(/📎 \*\*(.*?)\*\*/);
				const fileName = fileNameMatch ? fileNameMatch[1] : 'Unknown File';
				
				// Create a special file upload display
				const fileDisplay = `
					<div class="file-upload-message bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
						<div class="flex items-center space-x-3">
							<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
								<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
								</svg>
							</div>
							<div class="flex-1">
								<h4 class="font-semibold text-blue-900">${fileName}</h4>
								<p class="text-sm text-blue-700">Document uploaded successfully</p>
							</div>
							<div class="text-xs text-blue-500">
								📎
							</div>
						</div>
					</div>
				`;
				
				// Replace the file message with the styled display
				text = text.replace(/📎 \*\*.*?\*\*[\s\S]*?Please analyze this document and provide insights\./, fileDisplay);
			}
			
			// Tables (basic support) - only apply when there are actual table patterns
			// Look for multiple lines with pipe separators to identify actual tables
			const lines = text.split('\n');
			let inTable = false;
			let tableLines = [];
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				// Check if this line looks like a table row (contains | and has multiple cells)
				if (line.includes('|') && line.split('|').length > 2) {
					if (!inTable) {
						inTable = true;
						tableLines = [];
					}
					tableLines.push(line);
				} else {
					// If we were in a table and now we're not, process the table
					if (inTable && tableLines.length > 0) {
						const tableHtml = tableLines.map(tableLine => {
							const cells = tableLine.split('|').map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('');
							return `<tr>${cells}</tr>`;
						}).join('');
						
						const fullTable = `<table class="border-collapse border border-gray-300 my-4 w-full">${tableHtml}</table>`;
						
						// Replace the table lines in the original text
						const tableText = tableLines.join('\n');
						text = text.replace(tableText, fullTable);
						
						// Reset for next potential table
						inTable = false;
						tableLines = [];
					}
				}
			}
			
			// Handle case where table is at the end of text
			if (inTable && tableLines.length > 0) {
				const tableHtml = tableLines.map(tableLine => {
					const cells = tableLine.split('|').map(cell => `<td class="border border-gray-300 px-3 py-2">${cell.trim()}</td>`).join('');
					return `<tr>${cells}</tr>`;
				}).join('');
				
				const fullTable = `<table class="border-collapse border border-gray-300 my-4 w-full">${tableHtml}</table>`;
				
				// Replace the table lines in the original text
				const tableText = tableLines.join('\n');
				text = text.replace(tableText, fullTable);
			}
			
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

<div class="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white h-full">
	<div bind:this={messagesContainer} class="p-4 lg:p-6 h-full overflow-y-auto">
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
								<div class="rounded-2xl rounded-br-sm bg-gradient-to-r from-indigo-300 to-violet-300 px-4 py-3 text-indigo-900 shadow-lg">
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
											<path d="M21 9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										{:else}
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
										{/if}
									</svg>
								</button>
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
							</div>
						</div>
					{/if}

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
					
					<!-- AI response action button -->
					{#if messageItem.aiResponse && messageItem.aiResponse.length > 0 && !messageItem.isStreaming}
						<div class="flex justify-start ml-10 mt-1">
							<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
								<button 
									on:click={() => copyResponse(messageItem.id, messageItem.aiResponse || '')}
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
			class="absolute bottom-4 right-4 p-2 bg-gradient-to-r from-indigo-300 to-violet-300 hover:from-indigo-400 hover:to-violet-400 text-indigo-900 rounded-full shadow-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-200 animate-bounce"
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
		font-size: 0.85rem;
		color: #f9fafb; /* near-white text */
	}

	:global(.prose pre .copy-button) {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(255, 255, 255, 0.08);
		color: #e5e7eb; /* gray-200 */
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem; /* rounded-md */
		font-size: 0.75rem; /* text-xs */
		cursor: pointer;
	}

	:global(.prose pre .copy-button:hover) {
		background: rgba(255, 255, 255, 0.12);
	}

	:global(.prose pre .copy-button.copied) {
		background: rgba(16, 185, 129, 0.2); /* emerald */
		border-color: #10b981; /* emerald-500 */
		color: #ecfdf5;
	}

	/* File upload message styling */
	:global(.file-upload-message) {
		transition: all 0.3s ease;
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
	}

	:global(.file-upload-message:hover) {
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
		transform: translateY(-1px);
	}

	:global(.file-upload-message h4) {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
	}

	:global(.file-upload-message p) {
		margin: 0;
		font-size: 0.8rem;
	}
</style>


