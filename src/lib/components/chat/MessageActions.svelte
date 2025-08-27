<script lang="ts">
	import { Edit3, RotateCcw, MessageSquare, Copy, Check } from '@lucide/svelte';

	export let messageRole: 'user' | 'assistant' | 'system';
	export let messageId: string;
	export let messageContent: string;
	export let isStreaming: boolean = false;
	export let copiedMessageId: string | null = null;
	
	export let onEdit: ((messageId: string, newContent: string) => void) | null = null;
	export let onRegenerate: ((messageId: string, newContent: string) => void) | null = null;
	export let onContinue: ((messageId: string) => void) | null = null;
	export let onCopy: ((messageId: string, content: string) => void) | null = null;

	function handleEdit() {
		if (onEdit) {
			// For now, we'll use a simple prompt - in a real app, you'd want a proper modal
			const newContent = prompt('Edit message:', messageContent);
			if (newContent && newContent.trim() !== messageContent.trim()) {
				onEdit(messageId, newContent.trim());
			}
		}
	}

	function handleRegenerate() {
		if (onRegenerate) {
			onRegenerate(messageId, messageContent);
		}
	}

	function handleContinue() {
		if (onContinue) {
			onContinue(messageId);
		}
	}

	function handleCopy() {
		if (onCopy) {
			onCopy(messageId, messageContent);
		}
	}

	$: isCopied = copiedMessageId === messageId;
</script>

{#if !isStreaming}
	<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
		<!-- Copy button (always available) -->
		<button
			on:click={handleCopy}
			class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
			title="Copy message"
		>
			{#if isCopied}
				<Check class="w-4 h-4" />
			{:else}
				<Copy class="w-4 h-4" />
			{/if}
		</button>

		<!-- User message actions -->
		{#if messageRole === 'user'}
			<button
				on:click={handleEdit}
				class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
				title="Edit & Fork"
			>
				<Edit3 class="w-4 h-4" />
			</button>
		{/if}

		<!-- Assistant message actions -->
		{#if messageRole === 'assistant'}
			<button
				on:click={handleRegenerate}
				class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
				title="Regenerate & Fork"
			>
				<RotateCcw class="w-4 h-4" />
			</button>
		{/if}

		<!-- Continue action (available for all messages) -->
		<button
			on:click={handleContinue}
			class="flex items-center justify-center w-7 h-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
			title="Continue conversation"
		>
			<MessageSquare class="w-4 h-4" />
		</button>
	</div>
{/if}
