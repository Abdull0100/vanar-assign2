<script lang="ts">
	import { AlertTriangle, Clock, RotateCcw, X } from '@lucide/svelte';
	
	export let error: string = '';
	export let retryCountdown: number = 0;
	export let canRetryNow: () => boolean = () => true;
	export let getTimeUntilRetry: () => string = () => '';
	export let clearErrorState: () => void = () => {};
	export let onRetry: () => void = () => {};
</script>

{#if error}
	<div class="px-6 pb-4">
		<div class="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3">
			<div class="flex items-start justify-between">
				<div class="flex items-start">
					<AlertTriangle class="text-destructive mr-2 mt-0.5 w-4 h-4 flex-shrink-0" />
					<div class="flex-1">
						<span class="text-destructive text-sm font-medium">{error}</span>
						{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
							<div class="mt-2 space-y-2">
								<p class="text-destructive/80 text-xs">
									This usually resolves within a few minutes. You can try again or wait a bit.
								</p>
								{#if retryCountdown > 0}
									<div class="flex items-center space-x-2">
										<div class="flex items-center space-x-1">
											<Clock class="w-3 h-3 text-destructive" />
											<span class="text-xs text-destructive font-medium">
												Retry available in: {getTimeUntilRetry()}
											</span>
										</div>
										<div class="w-16 h-1.5 bg-destructive/20 rounded-full overflow-hidden">
											<div 
												class="h-full bg-destructive transition-all duration-1000 ease-linear"
												style="width: {((60 - retryCountdown) / 60) * 100}%"
											></div>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</div>
				<button 
					on:click={clearErrorState}
					class="text-destructive/60 hover:text-destructive transition-colors ml-2"
					aria-label="Dismiss error message"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
			{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
				<div class="mt-3 pt-3 border-t border-destructive/20">
					<div class="flex items-center justify-between">
						<button 
							on:click={onRetry}
							disabled={!canRetryNow()}
							class="inline-flex items-center px-3 py-1.5 bg-destructive/20 text-destructive text-xs font-medium rounded-md hover:bg-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Retry sending message"
						>
							<RotateCcw class="w-3 h-3 mr-1" />
							{canRetryNow() ? 'Retry Now' : `Wait ${getTimeUntilRetry()}`}
						</button>
						{#if retryCountdown > 0}
							<div class="text-xs text-destructive/80">
								Next retry: {getTimeUntilRetry()}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}


