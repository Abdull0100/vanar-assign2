<script lang="ts">
	import { ChevronLeft, ChevronRight, GitBranch } from '@lucide/svelte';

	export let currentIndex: number;
	export let totalSiblings: number;
	export let onNavigate: (direction: 'prev' | 'next') => void;
	export let isVisible: boolean = true;

	$: canGoPrev = currentIndex > 1;
	$: canGoNext = currentIndex < totalSiblings;
</script>

{#if isVisible && totalSiblings > 1}
	<div class="flex items-center justify-center gap-2 py-2 px-3 bg-muted/50 rounded-lg border border-border/50">
		<GitBranch class="w-4 h-4 text-muted-foreground" />
		<span class="text-sm text-muted-foreground">Branch</span>
		
		<div class="flex items-center gap-1">
			<button
				on:click={() => onNavigate('prev')}
				disabled={!canGoPrev}
				class="flex items-center justify-center w-6 h-6 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="Previous branch"
			>
				<ChevronLeft class="w-3 h-3" />
			</button>
			
			<span class="text-sm font-medium min-w-[3rem] text-center">
				{currentIndex}/{totalSiblings}
			</span>
			
			<button
				on:click={() => onNavigate('next')}
				disabled={!canGoNext}
				class="flex items-center justify-center w-6 h-6 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				title="Next branch"
			>
				<ChevronRight class="w-3 h-3" />
			</button>
		</div>
	</div>
{/if}
