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
	<div class="flex items-center justify-between w-full">
		<div class="flex items-center min-w-0">
			<div class="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center mr-3 flex-shrink-0">
				<Bot class="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
			</div>
			<div class="min-w-0">
				<h2 class="text-base lg:text-lg font-semibold text-primary-foreground truncate">Vanar AI Assistant</h2>
				<p class="text-xs lg:text-sm text-primary-foreground/80 truncate">The Chain That Thinks • Powered by Vanar</p>
			</div>
		</div>
		<div class="flex items-center space-x-2 flex-shrink-0">
			<!-- Documents Button -->
			<button
				on:click={handleDocumentsClick}
				class="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-md bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground transition-colors"
				title="Manage Documents"
			>
				<FileText class="w-4 h-4 lg:w-5 lg:h-5" />
			</button>

			<!-- Status Indicator -->
			<div class="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10">
				{#if error && isBusyError(error)}
					<Clock class="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground/60 animate-pulse" />
				{:else if error}
					<AlertCircle class="w-4 h-4 lg:w-5 lg:h-5 text-destructive animate-pulse" />
				{:else}
					<CheckCircle class="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
				{/if}
			</div>
		</div>
	</div>
</div>


