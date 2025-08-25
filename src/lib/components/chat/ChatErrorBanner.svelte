<script lang="ts">
	export let error: string = '';
	export let retryCountdown: number = 0;
	export let canRetryNow: () => boolean = () => true;
	export let getTimeUntilRetry: () => string = () => '';
	export let clearErrorState: () => void = () => {};
	export let onRetry: () => void = () => {};
</script>

{#if error}
	<div class="px-6 pb-4">
		<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
			<div class="flex items-start justify-between">
				<div class="flex items-start">
					<span class="text-red-600 mr-2 mt-0.5">⚠️</span>
					<div class="flex-1">
						<span class="text-red-700 text-sm font-medium">{error}</span>
						{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
							<div class="mt-2 space-y-2">
								<p class="text-red-600 text-xs">
									This usually resolves within a few minutes. You can try again or wait a bit.
								</p>
								{#if retryCountdown > 0}
									<div class="flex items-center space-x-2">
										<div class="flex items-center space-x-1">
											<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
												<circle cx="12" cy="12" r="10"/>
												<path d="M12 6v6l4 2"/>
											</svg>
											<span class="text-xs text-red-600 font-medium">
												Retry available in: {getTimeUntilRetry()}
											</span>
										</div>
										<div class="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
											<div 
												class="h-full bg-red-500 transition-all duration-1000 ease-linear"
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
					class="text-red-400 hover:text-red-600 transition-colors ml-2"
					aria-label="Dismiss error message"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
			{#if error.includes('rate limit') || error.includes('quota') || error.includes('high demand')}
				<div class="mt-3 pt-3 border-t border-red-200">
					<div class="flex items-center justify-between">
						<button 
							on:click={onRetry}
							disabled={!canRetryNow()}
							class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							aria-label="Retry sending message"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
								<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 12"/>
								<path d="M21 3v9h-9"/>
							</svg>
							{canRetryNow() ? 'Retry Now' : `Wait ${getTimeUntilRetry()}`}
						</button>
						{#if retryCountdown > 0}
							<div class="text-xs text-red-500">
								Next retry: {getTimeUntilRetry()}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}


