<script lang="ts">
	import type { BranchVersion } from '$lib/services/chat/buildBranchAwareTranscript';

	export let versions: BranchVersion[] = [];
	export let activeId: string;
	export let onSelect: (versionId: string) => void;

	// Sort versions by version number (ascending)
	$: sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
</script>

<div class="flex items-center space-x-1 mb-2">
	<span class="text-xs text-gray-500 mr-2">Versions:</span>
	{#each sortedVersions as version}
		<button
			on:click={() => onSelect(version.id)}
			class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
			class:bg-indigo-600={activeId === version.id}
			class:text-white={activeId === version.id}
			class:bg-gray-100={activeId !== version.id}
			class:text-gray-700={activeId !== version.id}
			class:hover:bg-indigo-500={activeId !== version.id}
			class:hover:text-white={activeId !== version.id}
			title="Version {version.versionNumber}"
			aria-label="Switch to version {version.versionNumber}"
		>
			{version.versionNumber}
		</button>
	{/each}
</div>
