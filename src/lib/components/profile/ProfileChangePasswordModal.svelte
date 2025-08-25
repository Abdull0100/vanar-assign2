<script lang="ts">
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

{#if show}
	<div class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600" on:click={onClose} role="presentation">
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg" on:click|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<div class="mt-3">
				<h3 class="mb-4 text-lg font-medium text-gray-900">Change Password</h3>

				{#if passwordError}
					<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{passwordError}</div>
				{/if}

				{#if passwordSuccess}
					<div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">{passwordSuccess}</div>
				{/if}

				<form on:submit|preventDefault={onSubmit} class="space-y-4">
					<div>
						<label for="currentPassword" class="block text-sm font-medium text-gray-700">Current Password</label>
						<input type="password" id="currentPassword" bind:value={currentPassword} required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
					</div>
					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
						<input type="password" id="newPassword" bind:value={newPassword} required minlength="8" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
					</div>
					<div>
						<label for="confirmNewPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
						<input type="password" id="confirmNewPassword" bind:value={confirmNewPassword} required minlength="8" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
					</div>
					<div class="flex justify-end space-x-3 pt-4">
						<button type="button" on:click={onClose} class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
						<button type="submit" disabled={changingPassword} class="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50">{changingPassword ? 'Changing...' : 'Change Password'}</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}


