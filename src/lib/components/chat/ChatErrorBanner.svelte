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
					<AlertTriangle class="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-destructive" />
					<div class="flex-1">
						<span class="text-sm font-medium text-destructive">{error}</span>
						{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
							<div class="mt-2 space-y-2">
								<p class="text-xs text-destructive/80">
									This usually resolves within a few minutes. You can try again or wait a bit.
								</p>
								{#if retryCountdown > 0}
									<div class="flex items-center space-x-2">
										<div class="flex items-center space-x-1">
											<Clock class="h-3 w-3 text-destructive" />
											<span class="text-xs font-medium text-destructive">
												Retry available in: {getTimeUntilRetry()}
											</span>
										</div>
										<div class="h-1.5 w-16 overflow-hidden rounded-full bg-destructive/20">
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
					class="ml-2 text-destructive/60 transition-colors hover:text-destructive"
					aria-label="Dismiss error message"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
				<div class="mt-3 border-t border-destructive/20 pt-3">
					<div class="flex items-center justify-between">
						<button
							on:click={onRetry}
							disabled={!canRetryNow()}
							class="inline-flex items-center rounded-md bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/30 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Retry sending message"
						>
							<RotateCcw class="mr-1 h-3 w-3" />
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
