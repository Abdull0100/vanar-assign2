<script lang="ts">
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
</script>

<div class="border-t border-indigo-200 bg-white p-4 lg:p-6 flex-shrink-0">
	<div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
		<div class="flex-1">
			<div class="relative">
				<textarea
					value={value}
					on:input={(e) => onInput((e.target as HTMLTextAreaElement).value)}
					on:keydown={handleKeyPress}
					placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
					rows="2"
					maxlength="2000"
					class="
						block w-full resize-none rounded-xl border-indigo-200 shadow-sm
						focus:border-indigo-300 focus:ring-indigo-300 pr-12 bg-indigo-50
						focus:bg-white transition-all duration-200 ease-in-out
						disabled:opacity-75 disabled:cursor-not-allowed
						px-3 lg:px-4 py-2 lg:py-3
						leading-normal
						text-neutral-800
						placeholder-neutral-500
						scroll-pb-3 scroll-pt-3
						whitespace-pre-wrap
						text-sm lg:text-base
					"
					aria-label="Type your message to Vanar AI"
					aria-disabled={loading}
					disabled={loading}
				></textarea>
				<div class="absolute right-3 bottom-3 text-xs text-neutral-500">
					{value.length}/2000
				</div>
			</div>
		</div>
		<div class="flex flex-col space-y-2">
			<button
				on:click={() => onSend()}
				disabled={loading || !value.trim() || value.length > 2000}
				class="group relative inline-flex items-center justify-center rounded-xl bg-indigo-300 px-4 lg:px-6 py-2 lg:py-3 text-indigo-900 text-sm lg:text-base font-medium hover:bg-indigo-400 focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg shadow-md"
				aria-label="Send message to Vanar AI"
			>
				<span class="flex items-center">
					{#if loading}
						<svg class="animate-spin -ml-1 mr-2 lg:mr-3 h-4 w-4 lg:h-5 lg:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="hidden sm:inline">Processing...</span>
						<span class="sm:hidden">...</span>
					{:else}
						✨ <span class="hidden sm:inline ml-1">Send</span>
					{/if}
				</span>
				<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</button>
			{#if value.trim()}
				<button
					on:click={() => { onInput(''); }}
					class="group relative inline-flex items-center justify-center rounded-xl bg-violet-100 px-4 lg:px-6 py-2 text-violet-700 hover:bg-violet-200 transition-all duration-300 ease-out hover:scale-105 hover:shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2"
					aria-label="Clear message input"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</button>
			{/if}
		</div>
	</div>
</div>


