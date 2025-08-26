<script lang="ts">
	export let value: string = '';
	export let loading: boolean = false;
	export let onSend: () => void;
	export let onInput: (v: string) => void;
	export let onFileUpload: ((file: File) => void) | null = null;

	let fileInput: HTMLInputElement;

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			if (!loading && value.trim()) onSend();
		}
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file && onFileUpload) {
			onFileUpload(file);
			// Reset the input
			target.value = '';
		}
	}

	function triggerFileUpload() {
		fileInput?.click();
	}
</script>

<div class="border-t border-indigo-200/50 bg-gradient-to-r from-white/80 to-indigo-50/30 backdrop-blur-sm p-6 lg:p-8 flex-shrink-0 relative">
	<!-- Subtle background pattern -->
	<div class="absolute inset-0 bg-gradient-to-r from-indigo-50/20 via-transparent to-violet-50/20"></div>
	
	<div class="relative z-10 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
		<div class="flex-1">
			<div class="relative group">
				<textarea
					value={value}
					on:input={(e) => onInput((e.target as HTMLTextAreaElement).value)}
					on:keydown={handleKeyPress}
					placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
					rows="3"
					maxlength="2000"
					class="
						block w-full resize-none rounded-2xl border-2 border-indigo-200/50 shadow-lg
						focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 pr-16 bg-white/90 backdrop-blur-sm
						focus:bg-white transition-all duration-300 ease-in-out
						disabled:opacity-75 disabled:cursor-not-allowed
						px-6 py-4
						leading-relaxed
						text-neutral-800
						placeholder-neutral-500
						scroll-pb-4 scroll-pt-4
						whitespace-pre-wrap
						text-base lg:text-lg
						group-hover:border-indigo-300 group-hover:shadow-xl
					"
					aria-label="Type your message to Vanar AI"
					aria-disabled={loading}
					disabled={loading}
				></textarea>
				
				<!-- Character counter -->
				<div class="absolute right-4 bottom-4 text-xs text-neutral-400 font-medium">
					{value.length}/2000
				</div>
				
				<!-- Decorative elements -->
				<div class="absolute top-4 left-4 w-2 h-2 bg-gradient-to-r from-indigo-300 to-violet-300 rounded-full opacity-60"></div>
				<div class="absolute top-4 right-4 w-1 h-1 bg-gradient-to-r from-pink-300 to-indigo-300 rounded-full opacity-40"></div>
			</div>
		</div>
		
		<!-- Hidden file input -->
		<input
			bind:this={fileInput}
			type="file"
			accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.xls"
			on:change={handleFileUpload}
			class="hidden"
			aria-label="Upload document"
		/>

		<div class="flex flex-row lg:flex-col space-x-3 lg:space-x-0 lg:space-y-3">
			<!-- Upload Document Button -->
			<button
				on:click={triggerFileUpload}
				disabled={loading}
				class="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 px-6 py-4 text-white text-base font-semibold hover:from-emerald-500 hover:to-teal-500 focus:ring-4 focus:ring-emerald-400/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl shadow-lg min-w-[120px]"
				aria-label="Upload document to chat"
			>
				<span class="flex items-center">
					<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
					</svg>
					<span class="hidden sm:inline">Upload</span>
					<span class="sm:hidden">📄</span>
				</span>
				<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</button>

			<!-- Send Button -->
			<button
				on:click={() => onSend()}
				disabled={loading || !value.trim() || value.length > 2000}
				class="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-400 to-violet-400 px-6 py-4 text-white text-base font-semibold hover:from-indigo-500 hover:to-violet-500 focus:ring-4 focus:ring-indigo-400/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl shadow-lg min-w-[120px]"
				aria-label="Send message to Vanar AI"
			>
				<span class="flex items-center">
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<span class="hidden sm:inline">Processing...</span>
						<span class="sm:hidden">...</span>
					{:else}
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
						</svg>
						<span class="hidden sm:inline">Send</span>
						<span class="sm:hidden">Send</span>
					{/if}
				</span>
				<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
			</button>
			
			<!-- Clear Button -->
			{#if value.trim()}
				<button
					on:click={() => { onInput(''); }}
					class="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200 px-6 py-4 text-red-600 hover:from-red-200 hover:to-pink-200 hover:border-red-300 transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg text-base font-semibold focus:outline-none focus:ring-4 focus:ring-red-400/30 min-w-[120px]"
					aria-label="Clear message input"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
					<span class="hidden sm:inline">Clear</span>
					<span class="sm:hidden">Clear</span>
					<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</button>
			{/if}
		</div>
	</div>
</div>


