<script lang="ts">
	import { Edit, RotateCcw, MessageSquare, Copy, Check } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';

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
		<Button
			variant="ghost"
			size="sm"
			onclick={handleCopy}
			class="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
			title="Copy message"
		>
			{#if isCopied}
				<Check class="h-4 w-4" />
			{:else}
				<Copy class="h-4 w-4" />
			{/if}
		</Button>

		<!-- User message actions -->
		{#if messageRole === 'user'}
					<Button
			variant="ghost"
			size="sm"
			onclick={handleEdit}
			class="h-7 w-7 p-0 text-primary hover:bg-primary/20 hover:text-primary-foreground"
			title="Edit & Fork"
		>
				<Edit class="h-4 w-4" />
			</Button>
		{/if}

		<!-- Assistant message actions -->
		{#if messageRole === 'assistant'}
					<Button
			variant="ghost"
			size="sm"
			onclick={handleRegenerate}
			class="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
			title="Regenerate & Fork"
		>
				<RotateCcw class="h-4 w-4" />
			</Button>
		{/if}

		<!-- Continue action (available for all messages) -->
			<Button
		variant="ghost"
		size="sm"
		onclick={handleContinue}
		class="h-7 w-7 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
		title="Continue conversation"
	>
			<MessageSquare class="h-4 w-4" />
		</Button>
	</div>
{/if}
