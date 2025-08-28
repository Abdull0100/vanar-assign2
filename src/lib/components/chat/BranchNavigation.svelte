<script lang="ts">
	export let currentIndex: number = 1;
	export let totalCount: number = 1;
	export let onPrevious: () => void;
	export let onNext: () => void;
	export let disabled: boolean = false;

	$: canGoPrevious = currentIndex > 1;
	$: canGoNext = currentIndex < totalCount;
	$: showNavigation = totalCount > 1;
</script>

{#if showNavigation}
	<div class="flex items-center justify-center space-x-2 mt-2 mb-1">
		<button
			on:click={onPrevious}
			disabled={!canGoPrevious || disabled}
			class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
			class:bg-gray-100={canGoPrevious && !disabled}
			class:text-gray-700={canGoPrevious && !disabled}
			class:hover:bg-gray-200={canGoPrevious && !disabled}
			class:bg-gray-50={!canGoPrevious || disabled}
			class:text-gray-400={!canGoPrevious || disabled}
			title="Previous version"
			aria-label="Go to previous version"
		>
			<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<span class="text-xs text-gray-500 font-medium min-w-[2rem] text-center">
			{currentIndex}/{totalCount}
		</span>

		<button
			on:click={onNext}
			disabled={!canGoNext || disabled}
			class="flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
			class:bg-gray-100={canGoNext && !disabled}
			class:text-gray-700={canGoNext && !disabled}
			class:hover:bg-gray-200={canGoNext && !disabled}
			class:bg-gray-50={!canGoNext || disabled}
			class:text-gray-400={!canGoNext || disabled}
			title="Next version"
			aria-label="Go to next version"
		>
			<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>
{/if}
