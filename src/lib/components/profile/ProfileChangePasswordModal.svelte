<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	export let show = false;
	export let currentPassword = '';
	export let newPassword = '';
	export let confirmNewPassword = '';
	export let changingPassword = false;
	export let passwordError = '';
	export let passwordSuccess = '';
	export let onClose: () => void;
	export let onSubmit: () => void;
</script>

<Dialog.Root bind:open={show} onOpenChange={(val) => { if (!val) onClose?.(); }}>
	<Dialog.Content class="bg-card text-card-foreground w-[90vw] max-w-md rounded-2xl shadow-xl">
		<div class="px-6 py-4 border-b border-border flex items-center justify-between">
			<Dialog.Title class="text-lg font-medium">Change Password</Dialog.Title>
			<Dialog.Close aria-label="Close" />
		</div>
		<div class="px-6 py-4 space-y-4">
			{#if passwordError}
				<div class="rounded-lg border border-destructive bg-destructive/20 px-4 py-3 text-destructive">{passwordError}</div>
			{/if}
			{#if passwordSuccess}
				<div class="rounded-lg border border-accent bg-accent/20 px-4 py-3 text-accent">{passwordSuccess}</div>
			{/if}
			<form on:submit|preventDefault={onSubmit} class="space-y-4">
				<div class="grid gap-2">
					<label for="currentPassword" class="text-sm font-medium">Current Password</label>
					<Input type="password" id="currentPassword" bind:value={currentPassword} required autocomplete="current-password" />
				</div>
				<div class="grid gap-2">
					<label for="newPassword" class="text-sm font-medium">New Password</label>
					<Input type="password" id="newPassword" bind:value={newPassword} required minlength={8} autocomplete="new-password" />
				</div>
				<div class="grid gap-2">
					<label for="confirmNewPassword" class="text-sm font-medium">Confirm New Password</label>
					<Input type="password" id="confirmNewPassword" bind:value={confirmNewPassword} required minlength={8} autocomplete="new-password" />
				</div>
				<div class="pt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
					<Button type="button" variant="secondary" onclick={onClose} class="w-full sm:w-auto">Cancel</Button>
					<Button type="submit" disabled={changingPassword} class="w-full sm:w-auto">{changingPassword ? 'Changing…' : 'Change Password'}</Button>
				</div>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>


