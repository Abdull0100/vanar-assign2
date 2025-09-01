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
	import { Bot, User, Copy, Edit, Check, MessageSquare, RotateCcw } from '@lucide/svelte';
	import BranchNavigator from './BranchNavigator.svelte'; // Import the new component
	import CitationDisplay from './CitationDisplay.svelte';

	export let messages: Array<{
		id: string;
		role: 'user' | 'assistant' | 'system';
		content: string;
		createdAt: string;
		isStreaming?: boolean;
	}> = [];
	export let initializing: boolean = false;
	export let onForkMessage: ((messageId: string, newContent: string) => void) | null = null;
	export let onRegenerateMessage: ((messageId: string) => void) | null = null;
	export let onSwitchBranch: ((parentMessageId: string, branchIndex: number) => void) | null = null;
	export let branchNavigation: Array<{
		messageId: string;
		currentIndex: number;
		totalBranches: number;
		childrenIds: string[];
	}> = [];

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

	export function scrollToBottomPublic() {
		scrollToBottom();
	}
	export function smartScrollToBottomPublic() {
		smartScrollToBottom();
	}

	$: if (messages && messagesContainer) {
		setTimeout(smartScrollToBottom, 100);
	}

	function renderMarkdown(text: string): string {
		if (!text) return '';
		marked.setOptions({ breaks: true, gfm: true });
		try {
			const result = marked(text);
			return typeof result === 'string' ? result : text;
		} catch (error) {
			console.error('Markdown rendering error:', error);
			return text;
		}
	}

	function copyUserMessage(messageId: string, content: string) {
		navigator.clipboard
			.writeText(content)
			.then(() => {
				copiedMessageId = messageId;
				setTimeout(() => {
					copiedMessageId = null;
				}, 2000);
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
			});
	}

	function copyResponse(messageId: string, content: string) {
		navigator.clipboard
			.writeText(content)
			.then(() => {
				copiedMessageId = messageId;
				setTimeout(() => {
					copiedMessageId = null;
				}, 2000);
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
			});
	}

	function cancelEdit() {
		editingMessageId = null;
		editText = '';
	}

	function saveEdit(messageId: string) {
		if (editText.trim() && onForkMessage) {
			onForkMessage(messageId, editText.trim());
		}
		editingMessageId = null;
		editText = '';
	}

	function startEditOrForkMessage(messageId: string, currentContent: string) {
		editingMessageId = messageId;
		editText = currentContent;
	}

	function handleRegenerate(messageId: string) {
		if (onRegenerateMessage) {
			onRegenerateMessage(messageId);
		}
	}

	function handleSwitchBranch(eventOrParentId: string | CustomEvent, direction?: 'prev' | 'next') {
		if (!onSwitchBranch) return;

		let parentMessageId: string;
		let navDirection: 'prev' | 'next';

		// Handle CustomEvent from BranchNavigator component
		if (eventOrParentId instanceof CustomEvent) {
			const { parentMessageId: msgId, direction: dir } = eventOrParentId.detail;
			parentMessageId = msgId;
			navDirection = dir;
		} else {
			// Handle direct call with parameters
			parentMessageId = eventOrParentId;
			navDirection = direction!;
		}

		const nav = branchNavigation.find((n) => n.messageId === parentMessageId);
		if (!nav) return;

		let newIndex = nav.currentIndex;
		if (navDirection === 'prev') {
			newIndex = Math.max(0, newIndex - 1);
		} else {
			newIndex = Math.min(nav.totalBranches - 1, newIndex + 1);
		}

		if (newIndex !== nav.currentIndex) {
			onSwitchBranch(parentMessageId, newIndex);
		}
	}

	function getBranchNavigationForMessage(messageId: string) {
		return branchNavigation.find((n) => n.messageId === messageId);
	}

	// Check if there's virtual root navigation (for multiple root messages)
	function getVirtualRootNavigation() {
		return branchNavigation.find((n) => n.messageId.startsWith('virtual-root-'));
	}

	// Check if a message is a root message with siblings (for showing branch navigation)
	function isRootMessageWithSiblings(messageId: string): boolean {
		const virtualRootNav = getVirtualRootNavigation();
		if (!virtualRootNav) return false;

		// Check if this message is one of the virtual root's children
		return virtualRootNav.childrenIds.includes(messageId);
	}

	// Get branch navigation data for a root message
	function getRootBranchNavigation(messageId: string) {
		const virtualRootNav = getVirtualRootNavigation();
		if (!virtualRootNav) return null;

		const childIndex = virtualRootNav.childrenIds.indexOf(messageId);
		if (childIndex === -1) return null;

		return {
			messageId: virtualRootNav.messageId,
			currentIndex: childIndex,
			totalBranches: virtualRootNav.totalBranches,
			childrenIds: virtualRootNav.childrenIds
		};
	}

	// Helper function to find the true parent of a forked user message
	function findParentNavData(
		userMessageIndex: number
	): { messageId: string; currentIndex: number; totalBranches: number } | null {
		if (userMessageIndex < 1) return null;
		const currentUserMessage = messages[userMessageIndex];

		// Search through all branch data provided by the parent
		for (const nav of branchNavigation) {
			// If the parent's children include our current user message, we've found the right navigator
			if (nav.childrenIds?.includes(currentUserMessage.id)) {
				return nav;
			}
		}
		return null;
	}
</script>

<div class="flex-1 overflow-y-auto bg-background">
	<div bind:this={messagesContainer} class="p-4 lg:p-6">
		{#if messages.length === 0}
			{#if initializing}
				<div class="flex h-32 items-center justify-center text-sm text-muted-foreground">
					Loading chat…
				</div>
			{:else}
				<!-- Welcome Message -->
				<div class="flex h-full flex-col items-center justify-center text-center">
					<div class="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
						<MessageSquare class="h-10 w-10 text-muted-foreground" />
					</div>
					<br />
					<h3 class="mb-2 text-xl font-semibold">Welcome to Vanar AI Assistant</h3>
					<p class="max-w-md text-muted-foreground">
						Hi! I'm Vanar, your AI assistant from Vanar Chain. Ask me about anything!
					</p>
				</div>
			{/if}
		{:else}
			<div class="mb-4 text-center">
				<p class="text-xs text-muted-foreground italic">
					Tree-structured chat • Edit & Send creates new branches • Use navigation controls to
					switch between branches
				</p>
			</div>
			{#each messages as messageItem, idx (messageItem.id)}
				<div class="mb-6">
					<div
						class="group relative -m-1 rounded-lg p-1 transition-colors duration-200 hover:bg-muted/30"
					>
						{#if messageItem.role === 'user'}
							<!-- User Message -->
							<div class="flex justify-end">
								<div class="relative flex max-w-xl items-end space-x-2">
									{#if editingMessageId === messageItem.id}
										<!-- Edit Mode -->
										<div
											class="flex-1 rounded-2xl rounded-br-sm border-2 border-primary bg-card px-4 py-3 shadow-lg"
										>
											<textarea
												bind:value={editText}
												class="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
												rows="3"
												placeholder="Edit your message..."
											></textarea>
											<div class="mt-2 flex items-center justify-between">
												<div class="text-xs text-muted-foreground">
													This will create a new branch with your changes
												</div>
												<div class="flex space-x-2">
													<button
														on:click={cancelEdit}
														class="rounded border border-border px-3 py-1 text-xs text-foreground hover:bg-muted"
														>Cancel</button
													>
													<button
														on:click={() => saveEdit(messageItem.id)}
														class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
														>Send</button
													>
												</div>
											</div>
										</div>
									{:else}
										<!-- Normal Display -->
										<div
											class="rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground shadow-lg"
										>
											<p class="text-sm leading-relaxed">{messageItem.content}</p>
										</div>
									{/if}
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted"
									>
										<User class="h-4 w-4 text-muted-foreground" />
									</div>
								</div>
							</div>

							<!-- User message action buttons -->
							{#if editingMessageId !== messageItem.id}
								<div class="mr-10 mb-1 flex justify-end">
									<div
										class="flex items-center space-x-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										<!-- Branch Navigation (if available) -->
										{#if messageItem.role === 'user'}
											{@const navForUserAsParent = getBranchNavigationForMessage(messageItem.id)}
											{@const navForUserAsChild = findParentNavData(idx)}
											{@const rootBranchNav = getRootBranchNavigation(messageItem.id)}
											{@const isRootMessage = isRootMessageWithSiblings(messageItem.id)}
											{#if (navForUserAsParent || navForUserAsChild) && !isRootMessage}
												<div class="mr-2 flex items-center gap-1 text-xs text-muted-foreground">
													{#if navForUserAsParent}
														<BranchNavigator
															branchNav={navForUserAsParent}
															on:switch={handleSwitchBranch}
														/>
													{:else if navForUserAsChild}
														<BranchNavigator
															branchNav={navForUserAsChild}
															on:switch={handleSwitchBranch}
														/>
													{/if}
												</div>
											{/if}
										{/if}
										<!-- Action buttons - Always visible for user messages -->
										<button
											on:click={() =>
												copyUserMessage(messageItem.id + '_user', messageItem.content)}
											class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
											title="Copy"
										>
											{#if copiedMessageId === messageItem.id + '_user'}<Check
													class="h-4 w-4"
												/>{:else}<Copy class="h-4 w-4" />{/if}
										</button>
										<button
											on:click={() => startEditOrForkMessage(messageItem.id, messageItem.content)}
											class="flex h-7 w-7 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/20 hover:text-primary-foreground"
											title="Edit & Send (Creates New Branch)"
										>
											<Edit class="h-4 w-4" />
										</button>
									</div>
								</div>
							{/if}

							<!-- Root Message Branch Navigation (below the message) -->
							{#if messageItem.role === 'user' && isRootMessageWithSiblings(messageItem.id)}
								{@const rootNav = getRootBranchNavigation(messageItem.id)}
								{#if rootNav}
									<div class="mt-1 mr-10 flex justify-end">
										<div class="flex items-center space-x-2 rounded-lg bg-muted/50 px-3 py-1">
											<button
												on:click={() => handleSwitchBranch(rootNav.messageId, 'prev')}
												disabled={rootNav.currentIndex === 0}
												class="flex h-6 w-6 items-center justify-center rounded hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
												title="Previous branch"
												aria-label="Previous conversation branch"
											>
												<svg
													class="h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 19l-7-7 7-7"
													></path>
												</svg>
											</button>
											<span class="text-xs font-medium text-muted-foreground">
												{rootNav.currentIndex + 1}/{rootNav.totalBranches}
											</span>
											<button
												on:click={() => handleSwitchBranch(rootNav.messageId, 'next')}
												disabled={rootNav.currentIndex === rootNav.totalBranches - 1}
												class="flex h-6 w-6 items-center justify-center rounded hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
												title="Next branch"
												aria-label="Next conversation branch"
											>
												<svg
													class="h-4 w-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 5l7 7-7 7"
													></path>
												</svg>
											</button>
										</div>
									</div>
								{/if}
							{/if}
						{:else if messageItem.role === 'assistant'}
							<!-- Assistant Message -->
							<div class="flex justify-start">
								<div class="relative flex max-w-xl items-end space-x-2">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted"
									>
										<Bot class="h-4 w-4 text-muted-foreground" />
									</div>
									<div class="rounded-2xl rounded-bl-sm border bg-card px-4 py-3 shadow-lg">
										{#if messageItem.isStreaming}
											<!-- Streaming Display -->
											<div
												class="prose prose-sm max-w-none text-sm leading-relaxed text-foreground"
											>
												{#if messageItem.content && messageItem.content.length > 0}<span
														>{@html renderMarkdown(messageItem.content)}</span
													><span class="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary"
													></span>{:else}<span
														class="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary"
													></span>{/if}
											</div>
											<div class="mt-2 flex items-center space-x-2">
												<div class="flex items-center space-x-1">
													<div class="h-2 w-2 animate-pulse rounded-full bg-primary/60"></div>
													<div
														class="h-2 w-2 animate-pulse rounded-full bg-primary/60"
														style="animation-delay: 0.2s"
													></div>
													<div
														class="h-2 w-2 animate-pulse rounded-full bg-primary/60"
														style="animation-delay: 0.4s"
													></div>
												</div>
												<span class="text-xs font-medium text-primary">Vanar AI is typing...</span>
											</div>
										{:else if messageItem.content && messageItem.content.length > 0}
											<!-- Normal Display -->
											<div
												class="prose prose-sm max-w-none text-sm leading-relaxed text-foreground"
											>
												{@html renderMarkdown(messageItem.content)}
											</div>
											<CitationDisplay messageId={messageItem.id} />
											<p class="mt-2 text-xs text-muted-foreground">
												{new Date(messageItem.createdAt).toLocaleTimeString()}
											</p>
										{:else}
											<div class="text-sm text-muted-foreground italic">No response received</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- AI response action buttons -->
							{#if messageItem.content && messageItem.content.length > 0 && !messageItem.isStreaming}
								<div class="mt-1 ml-10 flex justify-start">
									<div
										class="flex space-x-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
									>
										<button
											on:click={() => copyResponse(messageItem.id, messageItem.content)}
											class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
											title="Copy"
										>
											{#if copiedMessageId === messageItem.id}<Check class="h-4 w-4" />{:else}<Copy
													class="h-4 w-4"
												/>{/if}
										</button>
										<button
											on:click={() => handleRegenerate(messageItem.id)}
											class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
											title="Regenerate & Fork"
										>
											<RotateCcw class="h-4 w-4" />
										</button>
									</div>
								</div>
							{/if}
						{/if}
					</div>
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
