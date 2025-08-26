<script lang="ts">
	export let messages: Array<{ 
		id: string; 
		role: 'user' | 'assistant' | 'system'; 
		content: string; 
		createdAt: string; 
		previousId?: string | null;
		versionNumber?: number;
		parentId?: string | null;
	}> = [];
	export let activeVersions: Map<string, number> = new Map();
	export let onSetActiveVersion: ((messageId: string, versionNumber: number) => void) | null = null;

	// Function to get active version for a message
	function getActiveVersion(messageId: string): number {
		return activeVersions.get(messageId) || 1;
	}

	// Function to handle version switching
	function switchVersion(messageId: string, versionNumber: number) {
		if (onSetActiveVersion) {
			onSetActiveVersion(messageId, versionNumber);
		}
	}

	// Function to get version info for a message
	function getVersionInfo(message: any) {
		const forks = messages.filter(m => m.previousId === message.id);
		if (forks.length === 0) return null;
		
		const activeVersion = getActiveVersion(message.id);
		return {
			total: forks.length + 1,
			current: activeVersion,
			forks
		};
	}

	// Simple function to build main conversation chain
	function buildMainConversation() {
		if (messages.length === 0) return [];
		
		const conversation: any[] = [];
		
		// Find messages without parentId (root messages)
		const rootMessages = messages.filter(msg => !msg.parentId);
		
		// For each root, build the chain
		rootMessages.forEach(root => {
			const chain = [];
			let current = root;
			
			while (current) {
				chain.push(current);
				// Find the response to this message
				const response = messages.find(msg => msg.parentId === current.id);
				if (response) {
					current = response;
				} else {
					break;
				}
			}
			
			conversation.push(...chain);
		});
		
		return conversation;
	}

	// Get the conversation
	$: conversation = buildMainConversation();
</script>

<div class="conversation-tree bg-white rounded-lg border border-gray-200 p-4">
	<h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
		<svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
		</svg>
		Conversation Flow
	</h3>
	
	{#if conversation.length === 0}
		<div class="text-gray-500 text-center py-8">
			<p>No conversation data available</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each conversation as message, index}
				<div class="conversation-message">
					<!-- Message content -->
					<div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
						<div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
							{message.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}">
							{message.role === 'user' ? '👤' : '🤖'}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-gray-900 mb-1">
								{message.role === 'user' ? 'User' : 'Vanar AI'}
							</div>
							<div class="text-sm text-gray-700">
								{message.content}
							</div>
							
							<!-- Fork navigation if this message has forks -->
							{#if (getVersionInfo(message)?.total || 0) > 1}
								{@const versionInfo = getVersionInfo(message)}
								{#if versionInfo}
									<div class="flex items-center space-x-2 mt-3">
										<div class="flex items-center space-x-1 bg-white rounded-full px-3 py-1 text-xs border shadow-sm">
											<button 
												on:click={() => switchVersion(message.id, Math.max(1, versionInfo.current - 1))}
												class="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={versionInfo.current <= 1}
												title="Previous version"
												aria-label="Previous version"
											>
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												</svg>
											</button>
											<span class="font-medium text-gray-700 px-2">
												{versionInfo.current} / {versionInfo.total}
											</span>
											<button 
												on:click={() => switchVersion(message.id, Math.min(versionInfo.total, versionInfo.current + 1))}
												class="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={versionInfo.current >= versionInfo.total}
												title="Next version"
												aria-label="Next version"
											>
												<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												</svg>
											</button>
										</div>
										<span class="text-xs text-gray-500">branch</span>
									</div>
								{/if}
							{/if}
						</div>
					</div>
					
					<!-- Connection line to next message -->
					{#if index < conversation.length - 1}
						<div class="flex justify-center mt-2">
							<div class="w-px h-4 bg-gray-300"></div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.conversation-tree {
		max-height: 600px;
		overflow-y: auto;
	}
	
	.conversation-message {
		position: relative;
	}
</style>
