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

<div class="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-300 px-6 lg:px-8 py-4 lg:py-6 flex-shrink-0 relative overflow-hidden">
	<!-- Animated background pattern -->
	<div class="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-pulse"></div>
	<div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
	<div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
	
	<div class="relative z-10 flex items-center justify-between">
		<div class="flex items-center">
			<div class="h-12 w-12 lg:h-14 lg:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg border border-white/30">
				<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar Chain" class="w-8 h-8 lg:w-10 lg:h-10 object-contain" />
			</div>
			<div>
				<h2 class="text-xl lg:text-2xl font-bold text-white mb-1">Vanar AI Assistant</h2>
				<p class="text-sm lg:text-base text-white/80 font-medium">The Chain That Thinks • Powered by Vanar</p>
			</div>
		</div>
		<div class="flex items-center space-x-3">
			{#if error && isBusyError(error)}
				<div class="flex items-center bg-yellow-100 px-3 py-2 rounded-xl border border-yellow-200 shadow-sm">
					<div class="h-3 w-3 rounded-full bg-yellow-400 animate-pulse mr-2"></div>
					<span class="text-sm font-medium text-yellow-700">
						{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
					</span>
				</div>
			{:else if error}
				<div class="flex items-center bg-red-100 px-3 py-2 rounded-xl border border-red-200 shadow-sm">
					<div class="h-3 w-3 rounded-full bg-red-400 animate-pulse mr-2"></div>
					<span class="text-sm font-medium text-red-700">Service Error</span>
				</div>
			{:else}
				<div class="flex items-center bg-green-100 px-3 py-2 rounded-xl border border-green-200 shadow-sm">
					<div class="h-3 w-3 rounded-full bg-green-400 mr-2"></div>
					<span class="text-sm font-medium text-green-700">Online & Ready</span>
				</div>
			{/if}
		</div>
	</div>
</div>


