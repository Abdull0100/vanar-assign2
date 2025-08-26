<script lang="ts">
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

<div class="h-full flex flex-col bg-white overflow-hidden max-h-full">
	<!-- Modern Header with Logo -->
	<div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
		<div class="flex items-center">
			<div class="w-8 h-8 bg-gradient-to-r from-indigo-300 to-violet-300 rounded-lg flex items-center justify-center mr-3 vanar-logo transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-indigo-300/50 group">
				<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar" class="w-5 h-5 object-contain group-hover:rotate-12 transition-transform duration-300" />
			</div>
			<div class="group">
				<h3 class="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">Vanar AI</h3>
			</div>
		</div>
		<button 
			class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
			aria-label="Toggle sidebar"
		>
			<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
	</div>

	<!-- Navigation Links -->
	<div class="p-4 border-b border-gray-200 flex-shrink-0">
		<button 
			on:click={onNewConversation} 
			class="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
		>
			<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New chat
		</button>
		<button class="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
			<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			Search chats
		</button>
		<button class="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group">
			<svg class="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
			</svg>
			Library
		</button>
	</div>
	
	<!-- Scrollable Chats Section -->
	<div class="flex-1 flex flex-col min-h-0 overflow-hidden">
		<div class="p-4 flex-shrink-0">
			<h4 class="text-sm font-semibold text-gray-900 mb-3">Chats</h4>
		</div>
		<div class="flex-1 overflow-y-auto px-4 pb-4" style="contain: layout style paint;">
		{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
			<div class="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl shadow-sm">
				<div class="flex items-start text-yellow-800">
					<div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/>
							<path d="M12 6v6l4 2"/>
						</svg>
					</div>
					<div class="text-sm">
						<strong class="block mb-1">Service Notice</strong>
						<p class="text-yellow-700 mb-2">AI service is currently experiencing high demand.</p>
						{#if retryCountdown > 0}
							<p class="text-yellow-600 font-medium">Retry available in: {getTimeUntilRetry()}</p>
						{:else}
							<p class="text-yellow-600">This usually resolves within a few minutes.</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		
		{#if memoizedConversations.length === 0}
			{#if initializing}
				<div class="space-y-3">
					<div class="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
					<div class="space-y-2">
						<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
						<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
						<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
					</div>
				</div>
			{:else}
			<div class="text-center py-8">
				<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
					</svg>
				</div>
				<p class="text-sm text-gray-500">No conversations yet</p>
			</div>
			{/if}
		{:else}
			<div class="space-y-1">
				{#each memoizedConversations as conv (conv.id)}
					{#key conv.id}
					<div 
						class="group relative w-full px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer {currentConversationId === conv.id ? 'bg-gray-100' : 'hover:bg-gray-50'}" 
						on:click={() => onSelectConversation(conv.id)}
						on:keydown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
						role="button"
						tabindex="0"
						aria-label="Select conversation: {conv.roomName}"
						aria-pressed={currentConversationId === conv.id}
						style="min-height: 44px;"
					>
						<div class="flex items-center justify-between">
							<div class="flex items-center flex-1 min-w-0">
								<div class="w-6 h-6 bg-gradient-to-r from-indigo-300 to-violet-300 rounded flex items-center justify-center mr-3 flex-shrink-0">
									<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
									</svg>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm text-gray-700 truncate leading-tight" title="{conv.roomName}">{conv.roomName}</p>
								</div>
							</div>
							<button 
								on:click={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
								class="group/delete relative text-gray-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200"
								title="Delete conversation"
								aria-label="Delete conversation: {conv.roomName}"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 6h18"/>
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
								</svg>
							</button>
						</div>
					</div>
					{/key}
				{/each}
						</div>
		{/if}
		</div>
	</div>
		
	<!-- Clear All History Button -->
	{#if memoizedConversations.length > 0}
		<div class="p-4 border-t border-gray-200 flex-shrink-0">
			<button
				on:click={onClearAll}
				class="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors group"
				aria-label="Clear all chat history"
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-3 text-gray-500 group-hover:text-gray-700">
					<path d="M3 6h18"/>
					<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
					<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
				</svg>
				Clear all conversations
			</button>
		</div>
	{/if}
</div>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-3px); }
	}
	
	@keyframes glow {
		0%, 100% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.3); }
		50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.6); }
	}
	
	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	.vanar-logo {
		animation: float 3s ease-in-out infinite, glow 2s ease-in-out infinite;
	}
	
	.vanar-logo:hover {
		animation: spin-slow 2s linear infinite, glow 1s ease-in-out infinite;
	}
	
	/* Custom scrollbar styling */
	.overflow-y-auto::-webkit-scrollbar {
		width: 8px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: rgba(243, 244, 246, 0.5);
		border-radius: 4px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: linear-gradient(to bottom, rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.4));
		border-radius: 4px;
		transition: background 0.2s ease;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: linear-gradient(to bottom, rgba(139, 92, 246, 0.6), rgba(99, 102, 241, 0.6));
	}
	
	/* Firefox scrollbar */
	.overflow-y-auto {
		scrollbar-width: thin;
		scrollbar-color: rgba(139, 92, 246, 0.4) rgba(243, 244, 246, 0.5);
	}
	
	/* Ensure proper text truncation */
	.truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	/* Ensure sidebar maintains fixed height */
	:global(.h-full) {
		height: 100% !important;
		max-height: 100% !important;
	}
	
	/* Ensure scrollable area is properly constrained */
	.flex-1 {
		flex: 1 1 0%;
		min-height: 0;
	}
</style>
