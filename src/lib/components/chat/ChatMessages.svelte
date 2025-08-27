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
	import { Bot, User, Copy, Edit3, Check, MessageSquare } from '@lucide/svelte';

	export let messages: Array<{ id: string; role: 'user' | 'assistant' | 'system'; content: string; createdAt: string; isStreaming?: boolean }>= [];
	export let initializing: boolean = false;
	export let onEditMessage: ((messageId: string, newContent: string) => void) | null = null;

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

	function renderMarkdown(text: string): string {
		if (!text) return '';
		
		// Configure marked options
		marked.setOptions({
			breaks: true,
			gfm: true
		});

		try {
			const result = marked(text);
			return typeof result === 'string' ? result : text;
		} catch (error) {
			console.error('Markdown rendering error:', error);
			return text;
		}
	}

	function copyUserMessage(messageId: string, content: string) {
		navigator.clipboard.writeText(content).then(() => {
			copiedMessageId = messageId;
			setTimeout(() => {
				copiedMessageId = null;
			}, 2000);
		}).catch(err => {
			console.error('Failed to copy text: ', err);
		});
	}

	function copyResponse(messageId: string, content: string) {
		navigator.clipboard.writeText(content).then(() => {
			copiedMessageId = messageId;
			setTimeout(() => {
				copiedMessageId = null;
			}, 2000);
		}).catch(err => {
			console.error('Failed to copy text: ', err);
		});
	}

	function startEditMessage(messageId: string, currentContent: string) {
		editingMessageId = messageId;
		editText = currentContent;
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
				<p class="text-xs text-muted-foreground italic">Each message represents a single message with role-based content • All deletions provide guaranteed permanent erasure from all systems</p>
			</div>
			{#each messages as messageItem, idx (messageItem.id)}
				<div class="mb-6 group hover:bg-muted/30 rounded-lg p-1 -m-1 transition-colors duration-200">
					{#if messageItem.role === 'user'}
						<!-- User Message -->
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
										<Edit3 class="w-4 h-4" />
									</button>
								</div>
							</div>
						{/if}
					{:else if messageItem.role === 'assistant'}
						<!-- Assistant Message -->
						<div class="flex justify-start">
							<div class="flex items-end space-x-2 max-w-xl relative">
								<div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
									<Bot class="w-4 h-4 text-muted-foreground" />
								</div>
								<div class="rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-lg border">
									{#if messageItem.isStreaming}
										<div class="text-sm leading-relaxed text-foreground prose prose-sm max-w-none">
											{#if messageItem.content && messageItem.content.length > 0}
												<span>{@html renderMarkdown(messageItem.content)}</span>
												<span class="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>
											{:else}
												<span class="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>
											{/if}
										</div>
										<div class="flex items-center mt-2 space-x-2">
											<div class="flex items-center space-x-1">
												<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse"></div>
												<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse" style="animation-delay: 0.2s"></div>
												<div class="h-2 w-2 rounded-full bg-primary/60 animate-pulse" style="animation-delay: 0.4s"></div>
											</div>
											<span class="text-xs text-primary font-medium">Vanar AI is typing...</span>
										</div>
									{:else if messageItem.content && messageItem.content.length > 0}
										<div class="text-sm leading-relaxed text-foreground prose prose-sm max-w-none">
											{@html renderMarkdown(messageItem.content)}
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
						{#if messageItem.content && messageItem.content.length > 0 && !messageItem.isStreaming}
							<div class="flex justify-start ml-10 mt-1">
								<div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<button 
										on:click={() => copyResponse(messageItem.id, messageItem.content)}
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
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	:global(.prose) {
		max-width: none;
	}
	
	:global(.prose pre) {
		background-color: hsl(var(--muted));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		padding: 1rem;
		overflow-x: auto;
	}
	
	:global(.prose code) {
		background-color: hsl(var(--muted));
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
	
	:global(.prose pre code) {
		background-color: transparent;
		padding: 0;
	}
	
	:global(.prose blockquote) {
		border-left: 4px solid hsl(var(--border));
		padding-left: 1rem;
		margin: 1rem 0;
		font-style: italic;
		color: hsl(var(--muted-foreground));
	}
	
	:global(.prose table) {
		border-collapse: collapse;
		width: 100%;
		margin: 1rem 0;
	}
	
	:global(.prose th, .prose td) {
		border: 1px solid hsl(var(--border));
		padding: 0.5rem;
		text-align: left;
	}
	
	:global(.prose th) {
		background-color: hsl(var(--muted));
		font-weight: 600;
	}
</style>