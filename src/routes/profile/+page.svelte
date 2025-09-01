<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Navigation from '$lib/components/Navigation.svelte';
	import ProfileHero from '$lib/components/profile/ProfileHero.svelte';
	import ProfileAccountOverview from '$lib/components/profile/ProfileAccountOverview.svelte';
	import ProfileSidebar from '$lib/components/profile/ProfileSidebar.svelte';
	import ProfileChangePasswordModal from '$lib/components/profile/ProfileChangePasswordModal.svelte';
	import ProfileDeleteAccountModal from '$lib/components/profile/ProfileDeleteAccountModal.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
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

<div class="min-h-screen">
	<!-- Navigation -->
	<Navigation user={user ?? null} currentPage="profile" />

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Hero Section -->
			<ProfileHero {user} />

			<div class="mx-auto max-w-4xl">
				{#if loading}
					<div class="py-8">
						<LoadingSpinner label="Loading profile..." />
					</div>
				{:else}
					<div class="grid gap-6 lg:grid-cols-3">
						<div class="lg:col-span-2">
							<ProfileAccountOverview
								{user}
								bind:name
								bind:email
								{error}
								{success}
								{saving}
								onSubmit={updateProfile}
								onReset={() => {
									name = user?.name || '';
									error = '';
									success = '';
								}}
							/>
						</div>
						<ProfileSidebar {user} {openChangePasswordModal} {openDeleteAccountModal} />
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
