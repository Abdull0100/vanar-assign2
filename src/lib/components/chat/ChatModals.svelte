<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Trash2 } from '@lucide/svelte';

	export let showDeleteModal: boolean = false;
	export let deleteTarget: { id: string; title: string } | null = null;
	export let showDeleteAllModal: boolean = false;
	export let deleteAllTarget: { title: string } | null = null;
	export let onCloseDelete: () => void;
	export let onConfirmDelete: () => void;
	export let onCloseDeleteAll: () => void;
	export let onConfirmDeleteAll: () => void;
</script>

{#if showDeleteModal && deleteTarget}
	<Dialog.Root open={showDeleteModal} onOpenChange={(val) => { if (!val) onCloseDelete(); }}>
		<Dialog.Content class="bg-card text-card-foreground w-[90vw] max-w-md rounded-2xl shadow-xl">
			<div class="px-6 py-4 border-b border-border flex items-center justify-between">
				<Dialog.Title class="text-lg font-medium text-destructive">Delete Conversation</Dialog.Title>
				<Dialog.Close aria-label="Close delete conversation modal" />
			</div>

			<div class="px-6 py-4 space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10">
						<AlertTriangle class="h-5 w-5 text-destructive" />
					</div>
					<div class="flex-1">
						<p class="text-sm">Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?</p>
					</div>
				</div>
				
				<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
					<div class="flex items-start gap-2">
						<AlertTriangle class="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
						<div class="text-sm text-destructive">
							<strong>PERMANENT DELETION:</strong> This entire conversation will be permanently erased from:
							<ul class="mt-1 ml-4 list-disc">
								<li>Your local chat history</li>
								<li>The database</li>
								<li>All backup systems</li>
							</ul>
							<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-border flex justify-end gap-2">
				<Button variant="outline" onclick={onCloseDelete}>Cancel</Button>
				<Button variant="destructive" onclick={onConfirmDelete}>
					<Trash2 class="w-4 h-4 mr-2" />
					Delete Conversation
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}

{#if showDeleteAllModal && deleteAllTarget}
	<Dialog.Root open={showDeleteAllModal} onOpenChange={(val) => { if (!val) onCloseDeleteAll(); }}>
		<Dialog.Content class="bg-card text-card-foreground w-[90vw] max-w-md rounded-2xl shadow-xl">
			<div class="px-6 py-4 border-b border-border flex items-center justify-between">
				<Dialog.Title class="text-lg font-medium text-destructive">Clear All Chat History</Dialog.Title>
				<Dialog.Close aria-label="Close clear all history modal" />
			</div>

			<div class="px-6 py-4 space-y-4">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-destructive/10">
						<AlertTriangle class="h-5 w-5 text-destructive" />
					</div>
					<div class="flex-1">
						<p class="text-sm">Are you sure you want to clear <strong>{deleteAllTarget.title}</strong>?</p>
					</div>
				</div>
				
				<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
					<div class="flex items-start gap-2">
						<AlertTriangle class="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
						<div class="text-sm text-destructive">
							<strong>PERMANENT DELETION:</strong> ALL conversations and messages will be permanently erased from:
							<ul class="mt-1 ml-4 list-disc">
								<li>Your local chat history</li>
								<li>The database</li>
								<li>All backup systems</li>
							</ul>
							<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
							<p class="mt-1 font-medium">This will remove ALL your chat data permanently.</p>
						</div>
					</div>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-border flex justify-end gap-2">
				<Button variant="outline" onclick={onCloseDeleteAll}>Cancel</Button>
				<Button variant="destructive" onclick={onConfirmDeleteAll}>
					<Trash2 class="w-4 h-4 mr-2" />
					Clear All History
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}


