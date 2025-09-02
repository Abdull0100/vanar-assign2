<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Send, X, Paperclip, FileText } from '@lucide/svelte';

	export let value: string = '';
	export let loading: boolean = false;
	export let onSend: () => void;
	
	// Auto-clear file preview after sending
	function handleSend() {
		onSend();
		// Clear file preview after sending (but keep it in chat history)
		selectedFile = null;
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}
	export let onInput: (v: string) => void;
	export let onFileAttach: ((file: File) => void) | null = null;

	let selectedFile: File | null = null;
	let fileInputRef: HTMLInputElement;

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			// Allow send if there's text OR a file attached
			if (!loading && (value.trim() || selectedFile)) handleSend();
		}
	}

	function handleClear() {
		onInput('');
		removeFile();
	}

	function handleFileSelect() {
		fileInputRef.click();
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			selectedFile = files[0];
			if (onFileAttach) {
				onFileAttach(files[0]);
			}
		}
	}

	function removeFile() {
		selectedFile = null;
		if (fileInputRef) {
			fileInputRef.value = '';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}
</script>

<div class="flex-shrink-0 border-t border-border bg-card p-4 lg:p-6">
	<div class="space-y-3">
		<!-- File attachment preview -->
		{#if selectedFile}
			<div class="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-all duration-200">
				<div class="flex items-center space-x-3">
					<FileText class="h-5 w-5 text-primary" />
					<div>
						<p class="text-sm font-medium text-foreground">{selectedFile.name}</p>
						<p class="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
					</div>
				</div>
				<button
					onclick={removeFile}
					class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
					aria-label="Remove file"
					type="button"
				>
					<X class="h-4 w-4" />
				</button>
			</div>
		{/if}

		<!-- Input area with buttons -->
		<div class="flex items-end space-x-3">
			<div class="flex-1 relative">
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

			<!-- Action buttons -->
			<div class="flex flex-col space-y-2">
				<Button
					onclick={handleSend}
					disabled={loading || (!value.trim() && !selectedFile) || value.length > 2000}
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
				
				<!-- File attachment button -->
				<Button
					onclick={handleFileSelect}
					variant="outline"
					size="sm"
					class="w-full sm:w-auto"
					disabled={loading}
					aria-label="Attach file"
				>
					<Paperclip class="mr-2 h-4 w-4" />
					<span class="hidden sm:inline">Attach File</span>
					<span class="sm:hidden">File</span>
				</Button>
			</div>
		</div>

		<!-- Hidden file input -->
		<input
			bind:this={fileInputRef}
			type="file"
			accept=".pdf,.docx,.txt,.md"
			onchange={handleFileInput}
			class="hidden"
			aria-hidden="true"
		/>
	</div>
</div>
