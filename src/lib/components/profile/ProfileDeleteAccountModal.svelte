<script lang="ts">
	export let show = false;
	export let user: any;
	export let deletePassword = '';
	export let deleteConfirmation = '';
	export let deletingAccount = false;
	export let deleteError = '';
	export let onClose: () => void;
	export let onSubmit: () => void;
</script>

{#if show}
	<div class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600" on:click={onClose} role="presentation">
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg" on:click|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<div class="mt-3">
				<h3 class="mb-4 text-lg font-medium text-gray-900">Delete Account</h3>
				<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
					<p class="text-sm font-medium">Warning: This action cannot be undone!</p>
					<p class="text-sm">All your data, including chat history, will be permanently deleted.</p>
				</div>
				{#if deleteError}
					<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{deleteError}</div>
				{/if}
				<form on:submit|preventDefault={onSubmit} class="space-y-4">
					{#if user?.password}
						<div>
							<label for="deletePassword" class="block text-sm font-medium text-gray-700">Confirm your password</label>
							<input type="password" id="deletePassword" bind:value={deletePassword} required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none" />
						</div>
					{/if}
					<div>
						<label for="deleteConfirmation" class="block text-sm font-medium text-gray-700">Type "DELETE" to confirm</label>
						<input type="text" id="deleteConfirmation" bind:value={deleteConfirmation} required placeholder="DELETE" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none" />
					</div>
					<div class="flex justify-end space-x-3 pt-4">
						<button type="button" on:click={onClose} class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
						<button type="submit" disabled={deletingAccount} class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50">{deletingAccount ? 'Deleting...' : 'Delete Account'}</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}


