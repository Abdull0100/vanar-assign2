<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navigation from '$lib/components/Navigation.svelte';
	import ProfileHero from '$lib/components/profile/ProfileHero.svelte';
	import ProfileAccountOverview from '$lib/components/profile/ProfileAccountOverview.svelte';
	import ProfileSidebar from '$lib/components/profile/ProfileSidebar.svelte';
	import ProfileChangePasswordModal from '$lib/components/profile/ProfileChangePasswordModal.svelte';
	import ProfileDeleteAccountModal from '$lib/components/profile/ProfileDeleteAccountModal.svelte';
	export let data: any;

	let name = '';
	let email = '';
	let loading = true;
	let saving = false;
	let error = '';
	let success = '';

	// Change password modal state
	let showChangePasswordModal = false;
	let currentPassword = '';
	let newPassword = '';
	let confirmNewPassword = '';
	let changingPassword = false;
	let passwordError = '';
	let passwordSuccess = '';

	// Delete account modal state
	let showDeleteAccountModal = false;
	let deletePassword = '';
	let deleteConfirmation = '';
	let deletingAccount = false;
	let deleteError = '';

	$: user = data.session?.user;

	onMount(() => {
		if (user) {
			name = user.name || '';
			email = user.email || '';
		}
		loading = false;
	});

	async function updateProfile() {
		saving = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name })
			});

			if (response.ok) {
				success = 'Profile updated successfully!';
				// Update local session data
				if (user) {
					user.name = name;
				}
				// Clear success message after 3 seconds
				setTimeout(() => {
					success = '';
				}, 3000);
			} else {
				const data = await response.json();
				error = data.error || 'Failed to update profile';
			}
		} catch (err) {
			error = 'An error occurred while updating profile';
		} finally {
			saving = false;
		}
	}

	function openChangePasswordModal() {
		showChangePasswordModal = true;
		currentPassword = '';
		newPassword = '';
		confirmNewPassword = '';
		passwordError = '';
		passwordSuccess = '';
	}

	function closeChangePasswordModal() {
		showChangePasswordModal = false;
	}

	function handleBackdropClick(event: MouseEvent | KeyboardEvent) {
		if (event.target === event.currentTarget) {
			closeChangePasswordModal();
		}
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			closeChangePasswordModal();
		}
	}

	async function changePassword() {
		if (newPassword !== confirmNewPassword) {
			passwordError = 'New passwords do not match';
			return;
		}

		if (newPassword.length < 8) {
			passwordError = 'New password must be at least 8 characters long';
			return;
		}

		changingPassword = true;
		passwordError = '';
		passwordSuccess = '';

		try {
			const response = await fetch('/api/profile/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});

			if (response.ok) {
				passwordSuccess = 'Password changed successfully!';
				setTimeout(() => closeChangePasswordModal(), 3000);
			} else {
				const data = await response.json();
				passwordError = data.error || 'Failed to change password';
			}
		} catch (err) {
			passwordError = 'An error occurred while changing password';
		} finally {
			changingPassword = false;
		}
	}

	function openDeleteAccountModal() {
		showDeleteAccountModal = true;
		deletePassword = '';
		deleteConfirmation = '';
		deleteError = '';
	}

	function closeDeleteAccountModal() {
		showDeleteAccountModal = false;
	}

	function handleDeleteBackdropClick(event: MouseEvent | KeyboardEvent) {
		if (event.target === event.currentTarget) {
			closeDeleteAccountModal();
		}
	}

	function handleDeleteBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			closeDeleteAccountModal();
		}
	}

	async function deleteAccount() {
		if (deleteConfirmation !== 'DELETE') {
			deleteError = 'Please type "DELETE" to confirm account deletion';
			return;
		}

		deletingAccount = true;
		deleteError = '';

		try {
			const response = await fetch('/api/profile/delete-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					password: deletePassword,
					confirmDeletion: deleteConfirmation
				})
			});

			if (response.ok) {
				// Redirect to home page after successful deletion
				goto('/');
			} else {
				const data = await response.json();
				deleteError = data.error || 'Failed to delete account';
			}
		} catch (err) {
			deleteError = 'An error occurred while deleting account';
		} finally {
			deletingAccount = false;
		}
	}
</script>

<svelte:head>
	<title>Profile - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-indigo-50">
	<!-- Navigation -->
	<Navigation user={user ?? null} currentPage="profile" />

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Hero Section -->
			<ProfileHero {user} />

			<div class="mx-auto max-w-4xl">
				{#if loading}
					<div class="py-8 text-center">
						<div
							class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"
						></div>
						<p class="mt-2 text-gray-600">Loading profile...</p>
					</div>
				{:else}
					<div class="grid gap-6 lg:grid-cols-3">
						<div class="lg:col-span-2">
							<ProfileAccountOverview {user} bind:name bind:email {error} {success} {saving} onSubmit={updateProfile}>
								<svelte:fragment slot="actions">
									<button type="button" on:click={() => { name = user?.name || ''; error = ''; success = ''; }} class="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
										<span class="mr-2">↩️</span>
										Reset
									</button>
								</svelte:fragment>
							</ProfileAccountOverview>
						</div>
						<ProfileSidebar {user}
							openChangePasswordModal={openChangePasswordModal}
							gotoChat={() => goto('/chat')}
							gotoAdmin={() => goto('/admin')}
						>
							<svelte:fragment slot="danger">
								<div class="mb-4">
									<h4 class="text-sm font-medium text-red-900 mb-1">Delete Account</h4>
									<p class="text-sm text-red-600 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
									<button on:click={openDeleteAccountModal} class="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">Delete Account</button>
								</div>
							</svelte:fragment>
						</ProfileSidebar>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>

<ProfileChangePasswordModal
    show={showChangePasswordModal}
    bind:currentPassword
    bind:newPassword
    bind:confirmNewPassword
    {changingPassword}
    {passwordError}
    {passwordSuccess}
    onClose={closeChangePasswordModal}
    onSubmit={changePassword}
/>

<ProfileDeleteAccountModal
    show={showDeleteAccountModal}
    {user}
    bind:deletePassword
    bind:deleteConfirmation
    {deletingAccount}
    {deleteError}
    onClose={closeDeleteAccountModal}
    onSubmit={deleteAccount}
/>
