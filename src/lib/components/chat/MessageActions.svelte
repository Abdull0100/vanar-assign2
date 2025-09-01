<script lang="ts">
	import { Edit, RotateCcw, MessageSquare, Copy, Check } from '@lucide/svelte';

	export let messageRole: 'user' | 'assistant' | 'system';
	export let messageId: string;
	export let messageContent: string;
	export let isStreaming: boolean = false;
	export let copiedMessageId: string | null = null;

	export let onEdit: ((messageId: string, newContent: string) => void) | null = null;
	export let onRegenerate: ((messageId: string) => void) | null = null;
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
			// For regeneration, we don't need to pass new content since we're regenerating based on existing context
			onRegenerate(messageId);
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
	<div
		class="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	>
		<!-- Copy button (always available) -->
		<button
			on:click={handleCopy}
			class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
			title="Copy message"
		>
			{#if isCopied}
				<Check class="h-4 w-4" />
			{:else}
				<Copy class="h-4 w-4" />
			{/if}
		</button>

		<!-- User message actions -->
		{#if messageRole === 'user'}
			<button
				on:click={handleEdit}
				class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
				title="Edit & Fork"
			>
				<Edit class="h-4 w-4" />
			</button>
		{/if}

		<!-- Assistant message actions -->
		{#if messageRole === 'assistant'}
			<button
				on:click={handleRegenerate}
				class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
				title="Regenerate & Fork"
			>
				<RotateCcw class="h-4 w-4" />
			</button>
		{/if}

		<!-- Continue action (available for all messages) -->
		<button
			on:click={handleContinue}
			class="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
			title="Continue conversation"
		>
			<MessageSquare class="h-4 w-4" />
		</button>
	</div>
{/if}
