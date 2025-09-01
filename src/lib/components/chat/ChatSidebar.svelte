<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, MessageSquare, Clock, Trash2 } from '@lucide/svelte';

	export let memoizedConversations: Array<any> = [];
	export let currentConversationId: string | null = null;
	export let onSelectConversation: (id: string) => void;
	export let onNewConversation: () => void;
	export let onDeleteConversation: (id: string) => void;
	export let onClearAll: () => void;
	export let error: string = '';
	export let retryCountdown: number = 0;
	export let getTimeUntilRetry: () => string = () => '';
	export let initializing: boolean = false;
</script>

<div class="order-2 lg:order-1 lg:col-span-1">
	<Card.Root class="flex h-full flex-col">
		<Card.Header class="flex-row items-center justify-between space-y-0 pb-2">
			<Card.Title class="text-base lg:text-lg text-card-foreground">Chat Rooms</Card.Title>
			<Button onclick={onNewConversation} size="sm" aria-label="Start a new conversation room">
				<Plus class="mr-1 h-3 w-3 lg:mr-2 lg:h-4 lg:w-4" />
				<span class="hidden sm:inline">New Room</span>
				<span class="sm:hidden">+</span>
			</Button>
		</Card.Header>
		<Card.Content class="flex-1 overflow-y-auto p-3 lg:p-4" style="contain: layout style paint;">
			{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
				<div class="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
					<div class="flex items-start text-destructive">
						<Clock class="mt-0.5 mr-2 h-4 w-4 flex-shrink-0" />
						<div class="text-xs">
							<strong>Service Notice:</strong> AI service is currently experiencing high demand.
							{#if retryCountdown > 0}
								<br /><span class="text-destructive/80"
									>Retry available in: {getTimeUntilRetry()}</span
								>
							{:else}
								<br />This usually resolves within a few minutes.
							{/if}
						</div>
					</div>
				</div>
			{/if}

			{#if memoizedConversations.length === 0}
				{#if initializing}
					<div class="py-8 lg:py-12">
						<div class="mb-4 h-3 w-24 animate-pulse rounded bg-muted"></div>
						<div class="space-y-2">
							<div class="h-10 animate-pulse rounded bg-muted/40"></div>
							<div class="h-10 animate-pulse rounded bg-muted/40"></div>
							<div class="h-10 animate-pulse rounded bg-muted/40"></div>
						</div>
					</div>
				{:else}
					<div class="py-8 text-center lg:py-12">
						<div
							class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted lg:h-16 lg:w-16"
						>
							<MessageSquare class="h-5 w-5 text-muted-foreground lg:h-6 lg:w-6" />
						</div>
						<h3 class="mb-2 text-base font-semibold text-foreground lg:text-lg">No chat rooms yet</h3>
						<p class="mb-4 text-xs text-muted-foreground lg:text-sm">
							Create your first room to start chatting with Vanar AI
						</p>
						<Button onclick={onNewConversation} size="sm" aria-label="Create your first chat room">
							<Plus class="mr-2 h-3 w-3" />
							Create Room
						</Button>
					</div>
				{/if}
			{:else}
				{#each memoizedConversations as conv (conv.id)}
					{#key conv.id}
						<div
							class="mb-2 w-full cursor-pointer rounded-lg border p-3 transition-all duration-200 lg:mb-3 lg:p-4 {currentConversationId ===
							conv.id
								? 'border-accent bg-accent/10 shadow-md'
								: 'border-border bg-background hover:border-muted hover:bg-muted/50 hover:shadow-sm'}"
							on:click={() => onSelectConversation(conv.id)}
							on:keydown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
							role="button"
							tabindex="0"
							aria-label="Select conversation: {conv.roomName}"
							aria-pressed={currentConversationId === conv.id}
						>
							<div class="flex items-center justify-between">
								<p class="mr-2 flex-1 truncate text-xs font-medium text-foreground lg:mr-3 lg:text-sm">
									{conv.roomName}
								</p>
								<Button
									onclick={(e) => {
										e.stopPropagation();
										onDeleteConversation(conv.id);
									}}
									variant="destructive"
									size="sm"
									class="h-6 w-6 p-0"
									title="Delete conversation"
									aria-label="Delete conversation: {conv.roomName}"
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							</div>
						</div>
					{/key}
				{/each}
			{/if}
		</Card.Content>

		<!-- Clear All History Button -->
		{#if memoizedConversations.length > 0}
			<div class="flex-shrink-0 border-t border-border p-3 lg:p-4">
				<Button
					onclick={onClearAll}
					variant="destructive"
					size="sm"
					class="w-full"
					aria-label="Clear all chat history"
				>
					<Trash2 class="mr-2 h-3 w-3" />
					Clear All History
				</Button>
			</div>
		{/if}
	</Card.Root>
</div>
