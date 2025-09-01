<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	export let show = false;
	export let user: any;
	export let deletePassword = '';
	export let deleteConfirmation = '';
	export let deletingAccount = false;
	export let deleteError = '';
	export let onClose: () => void;
	export let onSubmit: () => void;
</script>

<Dialog.Root
	bind:open={show}
	onOpenChange={(val) => {
		if (!val) onClose?.();
	}}
>
	<Dialog.Content class="w-[90vw] max-w-md rounded-2xl bg-card text-card-foreground shadow-xl">
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<Dialog.Title class="text-lg font-medium text-destructive">Delete Account</Dialog.Title>
			<Dialog.Close aria-label="Close" />
		</div>
		<div class="space-y-4 px-6 py-4">
			<div class="rounded-lg border border-destructive bg-destructive/20 px-4 py-3">
				<p class="text-sm font-medium text-destructive">Warning: This action cannot be undone!</p>
				<p class="text-sm text-destructive">
					All your data, including chat history, will be permanently deleted.
				</p>
			</div>
			{#if deleteError}
				<div
					class="rounded-lg border border-destructive bg-destructive/20 px-4 py-3 text-destructive"
				>
					{deleteError}
				</div>
			{/if}
			<form on:submit|preventDefault={onSubmit} class="space-y-4">
				{#if user?.password}
					<div class="grid gap-2">
						<label for="deletePassword" class="text-sm font-medium">Confirm your password</label>
						<Input
							type="password"
							id="deletePassword"
							bind:value={deletePassword}
							required
							autocomplete="current-password"
						/>
					</div>
				{/if}
				<div class="grid gap-2">
					<label for="deleteConfirmation" class="text-sm font-medium"
						>Type "DELETE" to confirm</label
					>
					<Input
						type="text"
						id="deleteConfirmation"
						bind:value={deleteConfirmation}
						required
						placeholder="DELETE"
						autocomplete="off"
					/>
				</div>
				<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
					<Button type="button" variant="secondary" onclick={onClose} class="w-full sm:w-auto"
						>Cancel</Button
					>
					<Button
						type="submit"
						variant="destructive"
						disabled={deletingAccount}
						class="w-full sm:w-auto">{deletingAccount ? 'Deleting…' : 'Delete Account'}</Button
					>
				</div>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
