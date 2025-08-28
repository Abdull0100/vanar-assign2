<script lang="ts">
	// Updated to work with the new ChatGPT-style versioning system
	export let versions: any[] = [];
	export let activeId: string;
	export let onSelect: (versionId: string) => void;
	export let currentMessageId: string = ''; // Add current message ID for filtering
	export let isLoading: boolean = false; // Add loading state

	// Filter versions to only show those belonging to the current message
	// and sort by version number (ascending)
	$: filteredVersions = versions.filter(version => 
		version.messageId === currentMessageId || 
		version.id === currentMessageId ||
		version.versionGroupId === currentMessageId
	);
	$: sortedVersions = [...filteredVersions].sort((a, b) => (a.versionNumber || 1) - (b.versionNumber || 1));

	// Handle version selection with proper re-rendering
	async function handleVersionSelect(versionId: string) {
		if (onSelect) {
			await onSelect(versionId);
		}
	}
</script>

<div class="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
	<span class="text-xs text-gray-600 mr-2 font-medium">Versions:</span>
	{#if isLoading}
		<div class="flex items-center space-x-2">
			<div class="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin"></div>
			<span class="text-xs text-gray-500">Loading versions...</span>
		</div>
	{:else if sortedVersions.length === 0}
		<span class="text-xs text-gray-400 italic">No versions available</span>
	{:else}
		{#each sortedVersions as version, index}
			<button
				on:click={() => handleVersionSelect(version.id)}
				class="flex items-center justify-center min-w-[2rem] h-6 px-2 rounded-md text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 relative"
				class:bg-indigo-600={activeId === version.id}
				class:text-white={activeId === version.id}
				class:shadow-md={activeId === version.id}
				class:bg-gray-100={activeId !== version.id}
				class:text-gray-700={activeId !== version.id}
				class:hover:bg-indigo-500={activeId !== version.id}
				class:hover:text-white={activeId !== version.id}
				class:hover:shadow-sm={activeId !== version.id}
				title="Version {version.messageIndex || '?'},{version.versionNumber || 1}{version.hasChildren ? ` (${version.childrenCount} children)` : ''}"
				aria-label="Switch to version {version.messageIndex || '?'},{version.versionNumber || 1}"
			>
				{version.messageIndex || '?'},{version.versionNumber || 1}
				{#if version.hasChildren}
					<span class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
				{/if}
				{#if activeId === version.id}
					<span class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-indigo-600 rounded-full"></span>
				{/if}
			</button>
			{#if index < sortedVersions.length - 1}
				<span class="text-xs text-gray-400 mx-1">•</span>
			{/if}
		{/each}
	{/if}
</div>
