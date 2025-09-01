<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Send, X} from '@lucide/svelte';

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

<div class="border-t border-border bg-card p-4 lg:p-6 flex-shrink-0">
	<div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
		<div class="flex-1">
			<div class="relative">
				<textarea
					value={value}
					oninput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
					onkeydown={handleKeyPress}
					placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line) • Supports Markdown formatting"
					rows="2"
					maxlength="2000"
					class="
						block w-full resize-none rounded-xl border border-border shadow-sm
						focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none
						hover:border-border/80 pr-12 bg-background
						transition-all duration-200 ease-in-out
						disabled:opacity-75 disabled:cursor-not-allowed
						px-3 lg:px-4 py-2 lg:py-3 pt-8
						leading-normal
						text-foreground
						placeholder:text-muted-foreground
						scroll-pb-3 scroll-pt-3
						whitespace-pre-wrap
						text-sm lg:text-base
					"
					aria-label="Type your message to Vanar AI"
					aria-disabled={loading}
					disabled={loading}
				></textarea>
				{#if value.trim()}
					<button
						onclick={handleClear}
						class="absolute top-2 right-2 p-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive hover:text-destructive/80 transition-colors duration-200 z-10"
						aria-label="Clear message input"
						type="button"
					>
						<X class="w-3 h-3" />
					</button>
				{/if}
				<div class="absolute right-3 bottom-3 text-xs text-muted-foreground">
					{value.length}/2000
				</div>
				<div class="absolute left-3 bottom-3 text-xs text-muted-foreground">
					**bold** *italic* `code` [link](url)
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
					<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground mr-2"></div>
					<span class="hidden sm:inline">Processing...</span>
					<span class="sm:hidden">...</span>
				{:else}
					<Send class="w-4 h-4 mr-2" />
					<span class="hidden sm:inline">Send</span>
				{/if}
			</Button>
		</div>
	</div>
</div>


