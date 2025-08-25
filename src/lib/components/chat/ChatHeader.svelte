<script lang="ts">
	export let error: string = '';
	export let retryCountdown: number = 0;
	export let getTimeUntilRetry: () => string = () => '';

	function isBusyError(err: string): boolean {
		return (
			err?.includes('rate limit') ||
			err?.includes('quota') ||
			err?.includes('high demand')
		);
	}
</script>

<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<div class="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-white/20 flex items-center justify-center mr-2 lg:mr-3">
				<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-6 h-6 lg:w-8 lg:h-8" />
			</div>
			<div>
				<h2 class="text-base lg:text-lg font-semibold text-white">Vanar AI Assistant</h2>
				<p class="text-xs lg:text-sm text-indigo-200">The Chain That Thinks • Powered by Vanar</p>
			</div>
		</div>
		<div class="flex items-center space-x-2">
			{#if error && isBusyError(error)}
				<div class="h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></div>
				<span class="text-xs lg:text-sm text-yellow-200">
					{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
				</span>
			{:else if error}
				<div class="h-2 w-2 rounded-full bg-red-400 animate-pulse"></div>
				<span class="text-xs lg:text-sm text-red-200">Service Error</span>
			{:else}
				<div class="h-2 w-2 rounded-full bg-green-400"></div>
				<span class="text-xs lg:text-sm text-white">Online</span>
			{/if}
		</div>
	</div>
</div>


