<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";

	export let open: boolean = false;
	export let target: { id: string; name: string } | null = null;
	export let onConfirm: () => void | Promise<void>;
	export let onClose: () => void;

	let loading = false;

	async function handleConfirm() {
		if (!target || loading) return;
		loading = true;
		try {
			await onConfirm?.();
			onClose();
		} finally {
			loading = false;
		}
	}
</script>

{#if target}
	<Dialog.Root bind:open onOpenChange={(val) => { if (!val) onClose(); }}>
		<Dialog.Content class="bg-card text-card-foreground font-sans w-[90vw] max-w-md rounded-2xl shadow-xl">
			<div class="px-6 py-4 border-b border-border flex items-center justify-between">
				<Dialog.Title class="text-lg font-medium">Delete User Account</Dialog.Title>
				<Dialog.Close aria-label="Close delete user modal" />
			</div>

			<div class="px-6 py-4 space-y-4">
				<p class="text-sm">Are you sure you want to permanently delete <span class="font-semibold">"{target.name}"</span>?</p>
				<Separator />
				<div class="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
					<p class="text-sm">This action cannot be undone. The user's data and sessions will be removed.</p>
				</div>
			</div>

			<div class="px-6 py-4 border-t border-border flex justify-end gap-2">
				<Button variant="outline" onclick={onClose} disabled={loading}>Cancel</Button>
				<Button variant="destructive" onclick={handleConfirm} disabled={loading}>
					{loading ? 'Deleting…' : 'Delete'}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}


