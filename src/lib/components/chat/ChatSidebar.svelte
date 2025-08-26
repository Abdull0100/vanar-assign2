<script lang="ts">
	export let memoizedConversations: Array<{ id: string; roomName: string; createdAt: string; updatedAt: string; messageCount?: number }> = [];
	export let currentRoomId: string | null = null;
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
	<div class="rounded-xl bg-white shadow-lg h-full flex flex-col">
		<div class="p-3 lg:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
			<div>
				<h3 class="text-base lg:text-lg font-semibold text-gray-900">Chat Rooms</h3>
			</div>
			<div class="flex space-x-2">
				<button 
					on:click={onNewConversation} 
					class="group relative inline-flex items-center justify-center px-3 lg:px-4 py-2 lg:py-2.5 text-xs lg:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white" 
					aria-label="Start a new conversation room"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					<span class="hidden sm:inline">New Room</span>
					<span class="sm:hidden">+</span>
					<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</button>
			</div>
		</div>
		<div class="p-3 lg:p-4 flex-1 overflow-y-auto" style="contain: layout style paint;">
			{#if error && (error.includes('rate limit') || error.includes('quota') || error.includes('high demand'))}
				<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div class="flex items-start text-yellow-800">
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2 mt-0.5 flex-shrink-0">
							<circle cx="12" cy="12" r="10"/>
							<path d="M12 6v6l4 2"/>
						</svg>
						<div class="text-xs">
							<strong>Service Notice:</strong> AI service is currently experiencing high demand.
							{#if retryCountdown > 0}
								<br><span class="text-yellow-700">Retry available in: {getTimeUntilRetry()}</span>
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
						<div class="h-3 w-24 bg-gray-200 rounded mb-4 animate-pulse"></div>
						<div class="space-y-2">
							<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
							<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
							<div class="h-10 bg-gray-100 rounded animate-pulse"></div>
						</div>
					</div>
				{:else}
				<div class="text-center py-8 lg:py-12">
					<div class="h-12 w-12 lg:h-16 lg:w-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
					</div>
					<h3 class="text-base lg:text-lg font-semibold text-gray-900 mb-2">No chat rooms yet</h3>
					<p class="text-xs lg:text-sm text-gray-500 mb-4">Create your first room to start chatting with Vanar AI</p>
					<button on:click={onNewConversation} class="inline-flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs lg:text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg" aria-label="Create your first chat room">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
						Create Room
					</button>
				</div>
				{/if}
			{:else}
				{#each memoizedConversations as conv (conv.id)}
					{#key conv.id}
					<div 
						class="w-full mb-2 lg:mb-3 p-3 lg:p-4 rounded-lg transition-all duration-200 cursor-pointer border {currentRoomId === conv.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'}" 
						on:click={() => onSelectConversation(conv.id)}
						on:keydown={(e) => e.key === 'Enter' && onSelectConversation(conv.id)}
						role="button"
						tabindex="0"
						aria-label="Select conversation: {conv.roomName}"
						aria-pressed={currentRoomId === conv.id}
					>
						<div class="flex items-center justify-between">
							<p class="text-xs lg:text-sm font-medium text-gray-800 truncate flex-1 mr-2 lg:mr-3">{conv.roomName}</p>
							<button 
								on:click={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
								class="group relative text-red-500 hover:text-red-700 text-xs p-1.5 lg:p-2 rounded-lg hover:bg-red-50 transition-all duration-300 flex-shrink-0 border border-red-200 hover:border-red-300 hover:shadow-md hover:scale-110"
								title="Delete conversation"
								aria-label="Delete conversation: {conv.roomName}"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
									<path d="M3 6h18"/>
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
								</svg>
								<div class="absolute inset-0 rounded-lg bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						</div>
					</div>
					{/key}
				{/each}
			{/if}
		</div>
		
		<!-- Clear All History Button -->
		{#if memoizedConversations.length > 0}
			<div class="p-3 lg:p-4 border-t border-gray-200 flex-shrink-0">
				<button
					on:click={onClearAll}
					class="w-full group relative inline-flex items-center justify-center px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					aria-label="Clear all chat history"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
						<path d="M3 6h18"/>
						<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
						<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
					</svg>
					Clear All History
				</button>
			</div>
		{/if}
	</div>
</div>


