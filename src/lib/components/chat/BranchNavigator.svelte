<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { createEventDispatcher } from 'svelte';

	export let branchNav: {
		messageId: string;
		currentIndex: number;
		totalBranches: number;
	};

	const dispatch = createEventDispatcher();

	function handleSwitch(direction: 'prev' | 'next') {
		dispatch('switch', {
			parentMessageId: branchNav.messageId,
			direction: direction
		});
	}
</script>

{#if branchNav && branchNav.totalBranches > 1}
	<div class="flex items-center text-xs text-muted-foreground gap-1">
		<button
			on:click={() => handleSwitch('prev')}
			class="p-1 rounded hover:bg-muted disabled:opacity-50"
			disabled={branchNav.currentIndex === 0}
			aria-label="Previous version"
		>
			<ChevronLeft size={12} />
		</button>
		<span class="px-1">{branchNav.currentIndex + 1} / {branchNav.totalBranches}</span>
		<button
			on:click={() => handleSwitch('next')}
			class="p-1 rounded hover:bg-muted disabled:opacity-50"
			disabled={branchNav.currentIndex === branchNav.totalBranches - 1}
			aria-label="Next version"
		>
			<ChevronRight size={12} />
		</button>
	</div>
{/if}