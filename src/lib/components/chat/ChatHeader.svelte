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
		return err?.includes('rate limit') || err?.includes('quota') || err?.includes('high demand');
	}
</script>

<div class="flex-shrink-0 bg-primary px-4 py-3 lg:px-6 lg:py-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center">
			<div
				class="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 lg:mr-3 lg:h-10 lg:w-10"
			>
				<Bot class="h-4 w-4 text-primary-foreground lg:h-5 lg:w-5" />
			</div>
			<div>
				<h2 class="text-base font-semibold text-primary-foreground lg:text-lg">
					Vanar AI Assistant
				</h2>
				<p class="text-xs text-primary-foreground/80 lg:text-sm">
					The Chain That Thinks • Powered by Vanar
				</p>
			</div>
		</div>
		<div class="flex items-center space-x-3">
			<!-- Documents Button -->
			<button
				on:click={handleDocumentsClick}
				class="flex items-center gap-1.5 rounded-md bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/20 lg:text-sm"
				title="Manage Documents"
			>
				<FileText class="h-3 w-3 lg:h-4 lg:w-4" />
				<span class="hidden sm:inline">Documents</span>
			</button>

			<!-- Status Indicator -->
			<div class="flex items-center space-x-2">
				{#if error && isBusyError(error)}
					<Clock class="h-3 w-3 animate-pulse text-primary-foreground/60" />
					<span class="text-xs text-primary-foreground/80 lg:text-sm">
						{retryCountdown > 0 ? `Busy (${getTimeUntilRetry()})` : 'Service Busy'}
					</span>
				{:else if error}
					<AlertCircle class="h-3 w-3 animate-pulse text-destructive" />
					<span class="text-xs text-primary-foreground/80 lg:text-sm">Service Error</span>
				{:else}
					<CheckCircle class="h-3 w-3 text-primary-foreground" />
					<span class="text-xs text-primary-foreground lg:text-sm">Online</span>
				{/if}
			</div>
		</div>
	</div>
</div>
