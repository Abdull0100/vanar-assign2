<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Plus, 
		MessageSquare, 
		Clock, 
		Trash2, 
		Search, 
		Library, 
		Play, 
		Grid3X3,
		ChevronDown,
		Cloud,
		Settings
	} from '@lucide/svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';

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
	export let user: any = null;

	let showUserMenu = false;

	function handleSignOut() {
		// Use the same sign out logic as the original navigation
		window.location.href = '/api/auth/signout';
	}
</script>

<div class="h-full">
	<div class="h-full flex flex-col bg-background border-r border-border">
		<!-- Header with Logo and Actions -->
		<div class="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 bg-primary border-b border-primary-foreground/20 w-full">
			<div class="flex items-center min-w-0">
				<!-- Vanar Logo -->
				<div class="w-8 h-8 lg:w-10 lg:h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
					<span class="text-primary-foreground font-bold text-sm lg:text-base">V</span>
				</div>
				<div class="min-w-0">
					<h2 class="text-base lg:text-lg font-semibold text-primary-foreground truncate">Vanar AI</h2>
					<p class="text-xs lg:text-sm text-primary-foreground/80 truncate">Chat Interface</p>
				</div>
			</div>
			<div class="flex items-center space-x-2 flex-shrink-0">
				<div class="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10">
					<DarkModeToggle size="sm" variant="ghost" />
				</div>
				<button 
					onclick={onNewConversation} 
					class="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 hover:bg-primary-foreground/10 text-primary-foreground rounded-lg transition-colors"
					aria-label="Start a new conversation"
				>
					<Plus class="w-4 h-4 lg:w-5 lg:h-5" />
				</button>
			</div>
		</div>

		<!-- Navigation Menu -->
		<div class="p-4 space-y-1">
			<button 
				onclick={onNewConversation}
				class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
			>
				<Plus class="w-4 h-4" />
				<span>New chat</span>
			</button>
			
			<button 
				class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
			>
				<Search class="w-4 h-4" />
				<span>Search chats</span>
			</button>
		</div>

		<!-- Page Navigation -->
		<div class="px-4 pb-4">
			<div class="border-t border-border pt-4 space-y-1">
				<h4 class="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</h4>
				
				<a 
					href="/dashboard"
					class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
				>
					<Grid3X3 class="w-4 h-4" />
					<span>Dashboard</span>
				</a>
				
				<a 
					href="/chat"
					class="w-full flex items-center space-x-3 px-3 py-2 text-sm bg-accent text-accent-foreground rounded-lg"
				>
					<MessageSquare class="w-4 h-4" />
					<span>AI Chat</span>
				</a>
				
				<a 
					href="/profile"
					class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
				>
					<Settings class="w-4 h-4" />
					<span>Profile</span>
				</a>
				
				{#if user?.role === 'admin'}
					<a 
						href="/admin"
						class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
					>
						<Library class="w-4 h-4" />
						<span>Admin Panel</span>
					</a>
				{/if}
			</div>
		</div>

		<!-- Chats Section -->
		<div class="flex-1 overflow-y-auto">
			<div class="px-4 py-2">
				<h3 class="text-sm font-medium text-foreground mb-2">Chats</h3>
				
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
						<div class="space-y-3">
							<div class="h-4 bg-muted rounded animate-pulse"></div>
							<div class="h-4 bg-muted rounded animate-pulse"></div>
							<div class="h-4 bg-muted rounded animate-pulse"></div>
						</div>
					{:else}
						<div class="text-center py-8">
							<div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
								<MessageSquare class="w-6 h-6 text-muted-foreground" />
							</div>
							<h3 class="text-sm font-medium text-foreground mb-2">No chats yet</h3>
							<p class="text-xs text-muted-foreground mb-4">Start a new chat to begin</p>
							<Button onclick={onNewConversation} size="sm" variant="outline">
								<Plus class="w-3 h-3 mr-2" />
								New Chat
							</Button>
						</div>
					{/if}
				{:else}
					<div class="space-y-1">
						{#each memoizedConversations as conv (conv.id)}
							{#key conv.id}
							<div 
								class="group relative flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors {currentConversationId === conv.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}" 
								onclick={() => onSelectConversation(conv.id)}
								onkeydown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
								role="button"
								tabindex="0"
								aria-label="Select conversation: {conv.roomName}"
								aria-pressed={currentConversationId === conv.id}
							>
								<span class="truncate flex-1 mr-2">{conv.roomName}</span>
								<button 
									onclick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
									class="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-all"
									title="Delete conversation"
									aria-label="Delete conversation: {conv.roomName}"
								>
									<Trash2 class="w-3 h-3 text-muted-foreground" />
								</button>
							</div>
							{/key}
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Clear All History Button -->
		{#if memoizedConversations.length > 0}
			<div class="border-t border-border p-4">
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

		<!-- User Profile Section -->
		<div class="border-t border-border p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<!-- User Avatar -->
					<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
						<span class="text-white font-medium text-sm">
							{user?.name?.[0] || user?.email?.[0] || 'U'}
						</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-foreground truncate">
							{user?.name || user?.email || 'User'}
						</p>
						<p class="text-xs text-muted-foreground">Free</p>
					</div>
				</div>
				<button 
					onclick={() => showUserMenu = !showUserMenu}
					class="p-1 hover:bg-muted rounded transition-colors"
				>
					<ChevronDown class="w-4 h-4 text-muted-foreground transform transition-transform {showUserMenu ? 'rotate-180' : ''}" />
				</button>
			</div>
			
			<!-- User Menu Dropdown -->
			{#if showUserMenu}
				<div class="mt-3 pt-3 border-t border-border space-y-1">
					<button 
						onclick={handleSignOut}
						class="w-full flex items-center space-x-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						<span>Sign Out</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Bottom Status Bar -->
		<div class="border-t border-border px-4 py-2 bg-muted/30">
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<div class="flex items-center space-x-2">
					<Cloud class="w-3 h-3" />
					<span>81°F</span>
				</div>
				<div class="flex items-center space-x-1">
					<div class="w-2 h-2 bg-red-500 rounded-full"></div>
					<span>1</span>
				</div>
			</div>
		</div>
	</div>
</div>


