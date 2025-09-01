<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Send, X } from '@lucide/svelte';

	export let value: string = '';
	export let loading: boolean = false;
	export let onSend: () => void;
	export let onInput: (v: string) => void;

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (!loading && value.trim()) onSend();
		}
	}

	function handleClear() {
		onInput('');
	}
</script>

<div class="flex-shrink-0 border-t border-border bg-card p-4 lg:p-6">
	<div class="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
		<div class="flex-1">
			<div class="relative">
				<textarea
					{value}
					oninput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
					onkeydown={handleKeyPress}
					placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
					rows="2"
					maxlength="2000"
					class="
						block w-full resize-none scroll-pt-3 scroll-pb-3 rounded-xl border
						border-border bg-background px-3 py-2
						pt-8 pr-12 text-sm
						leading-normal whitespace-pre-wrap text-foreground
						shadow-sm transition-all
						duration-200 ease-in-out placeholder:text-muted-foreground hover:border-border/80 focus:border-primary
						focus:ring-1
						focus:ring-primary/20
						focus:outline-none
						disabled:cursor-not-allowed disabled:opacity-75
						lg:px-4
						lg:py-3 lg:text-base
					"
					aria-label="Type your message to Vanar AI"
					aria-disabled={loading}
					disabled={loading}
				></textarea>
				{#if value.trim()}
					<button
						onclick={handleClear}
						class="absolute top-2 right-2 z-10 rounded-md bg-destructive/10 p-1 text-destructive transition-colors duration-200 hover:bg-destructive/20 hover:text-destructive/80"
						aria-label="Clear message input"
						type="button"
					>
						<X class="h-3 w-3" />
					</button>
				{/if}
				<div class="absolute right-3 bottom-3 text-xs text-muted-foreground">
					{value.length}/2000
				</div>
			</div>
		</div>
		<div class="flex flex-col space-y-2">
			<Button
				onclick={() => onSend()}
				disabled={loading || !value.trim() || value.length > 2000}
				size="lg"
				class="w-full sm:w-auto"
				aria-label="Send message to Vanar AI"
			>
				{#if loading}
					<div
						class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"
					></div>
					<span class="hidden sm:inline">Processing...</span>
					<span class="sm:hidden">...</span>
				{:else}
					<Send class="mr-2 h-4 w-4" />
					<span class="hidden sm:inline">Send</span>
				{/if}
			</Button>
		</div>
	</div>
</div>
