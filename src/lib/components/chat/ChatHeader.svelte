<script lang="ts">
	import { Bot, Clock, AlertCircle, CheckCircle, FileText } from '@lucide/svelte';
	import { createEventDispatcher } from 'svelte';

	export let error: string = '';
	export let retryCountdown: number = 0;
	export let getTimeUntilRetry: () => string = () => '';

	const dispatch = createEventDispatcher();

	function handleDocumentsClick() {
		dispatch('toggleDocuments');
	}

	function isBusyError(err: string): boolean {
		return (
			err?.includes('rate limit') ||
			err?.includes('quota') ||
			err?.includes('high demand')
		);
	}
</script>

<div class="bg-primary px-4 lg:px-6 py-3 lg:py-4 flex-shrink-0">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<div class="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center mr-2 lg:mr-3">
				<Bot class="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
			</div>
			<div>
				<h2 class="text-base lg:text-lg font-semibold text-primary-foreground">Vanar AI Assistant</h2>
				<p class="text-xs lg:text-sm text-primary-foreground/80">The Chain That Thinks • Powered by Vanar</p>
			</div>
		</div>
		<div class="flex items-center space-x-3">
			<!-- Documents Button -->
			<button
				on:click={handleDocumentsClick}
				class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs lg:text-sm font-medium transition-colors"
				title="Manage Documents"
			>
				<FileText class="w-3 h-3 lg:w-4 lg:h-4" />
				<span class="hidden sm:inline">Documents</span>
			</button>

			<!-- Status Indicator -->
			<div class="flex items-center space-x-2">
				{#if error && isBusyError(error)}
					<Clock class="h-3 w-3 text-primary-foreground/60 animate-pulse" />
					<span class="text-xs lg:text-sm text-primary-foreground/80">
						{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
					</span>
				{:else if error}
					<AlertCircle class="h-3 w-3 text-destructive animate-pulse" />
					<span class="text-xs lg:text-sm text-primary-foreground/80">Service Error</span>
				{:else}
					<CheckCircle class="h-3 w-3 text-primary-foreground" />
					<span class="text-xs lg:text-sm text-primary-foreground">Online</span>
				{/if}
			</div>
		</div>
	</div>
</div>


