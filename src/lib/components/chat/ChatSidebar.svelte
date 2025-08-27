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

<div class="lg:col-span-1 order-2 lg:order-1">
	<Card.Root class="h-full flex flex-col">
		<Card.Header class="flex-row items-center justify-between space-y-0 pb-2">
			<Card.Title class="text-base lg:text-lg">Chat Rooms</Card.Title>
			<Button 
				onclick={onNewConversation} 
				size="sm"
				aria-label="Start a new conversation room"
			>
				<Plus class="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
				<span class="hidden sm:inline">New Room</span>
				<span class="sm:hidden">+</span>
			</Button>
		</Card.Header>
		<Card.Content class="flex-1 overflow-y-auto p-3 lg:p-4" style="contain: layout style paint;">
			{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
				<div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
					<div class="flex items-start text-destructive">
						<Clock class="mr-2 mt-0.5 flex-shrink-0 w-4 h-4" />
						<div class="text-xs">
							<strong>Service Notice:</strong> AI service is currently experiencing high demand.
							{#if retryCountdown > 0}
								<br><span class="text-destructive/80">Retry available in: {getTimeUntilRetry()}</span>
							{:else}
								<br>This usually resolves within a few minutes.
							{/if}
						</div>
					</div>
				</div>
			{/if}
			
			{#if memoizedConversations.length === 0}
				{#if initializing}
					<div class="py-8 lg:py-12">
						<div class="h-3 w-24 bg-muted rounded mb-4 animate-pulse"></div>
						<div class="space-y-2">
							<div class="h-10 bg-muted/40 rounded animate-pulse"></div>
							<div class="h-10 bg-muted/40 rounded animate-pulse"></div>
							<div class="h-10 bg-muted/40 rounded animate-pulse"></div>
						</div>
					</div>
				{:else}
				<div class="text-center py-8 lg:py-12">
					<div class="h-12 w-12 lg:h-16 lg:w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
						<MessageSquare class="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground" />
					</div>
					<h3 class="text-base lg:text-lg font-semibold mb-2">No chat rooms yet</h3>
					<p class="text-xs lg:text-sm text-muted-foreground mb-4">Create your first room to start chatting with Vanar AI</p>
					<Button onclick={onNewConversation} size="sm" aria-label="Create your first chat room">
						<Plus class="w-3 h-3 mr-2" />
						Create Room
					</Button>
				</div>
				{/if}
			{:else}
				{#each memoizedConversations as conv (conv.id)}
					{#key conv.id}
					<div 
						class="w-full mb-2 lg:mb-3 p-3 lg:p-4 rounded-lg transition-all duration-200 cursor-pointer border {currentConversationId === conv.id ? 'bg-accent/10 border-accent shadow-md' : 'bg-background border-border hover:bg-muted/50 hover:border-muted hover:shadow-sm'}" 
						on:click={() => onSelectConversation(conv.id)}
						on:keydown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
						role="button"
						tabindex="0"
						aria-label="Select conversation: {conv.roomName}"
						aria-pressed={currentConversationId === conv.id}
					>
						<div class="flex items-center justify-between">
							<p class="text-xs lg:text-sm font-medium truncate flex-1 mr-2 lg:mr-3">{conv.roomName}</p>
							<Button 
								onclick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
								variant="destructive"
								size="sm"
								class="h-6 w-6 p-0"
								title="Delete conversation"
								aria-label="Delete conversation: {conv.roomName}"
							>
								<Trash2 class="w-3 h-3" />
							</Button>
						</div>
					</div>
					{/key}
				{/each}
			{/if}
		</Card.Content>
		
		<!-- Clear All History Button -->
		{#if memoizedConversations.length > 0}
			<div class="p-3 lg:p-4 border-t border-border flex-shrink-0">
				<Button
					onclick={onClearAll}
					variant="destructive"
					size="sm"
					class="w-full"
					aria-label="Clear all chat history"
				>
					<Trash2 class="w-3 h-3 mr-2" />
					Clear All History
				</Button>
			</div>
		{/if}
	</Card.Root>
</div>


