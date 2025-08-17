<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

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

	$: user = $page.data.session?.user;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}

		// Load current user data if available
		if (user) {
			name = user.name || '';
			email = user.email || '';
		}
		loading = false;
	});

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/';
		} catch (error) {
			console.error('Sign out error:', error);
			// Fallback: force redirect anyway
			window.location.href = '/';
		}
	}

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

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow" aria-label="Main navigation">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<h1 class="text-xl font-bold text-gray-900">Auth App</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8" role="menubar">
						<button
							on:click={() => goto('/dashboard')}
							on:keydown={(e) => e.key === 'Enter' && goto('/dashboard')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							role="menuitem"
							aria-label="Navigate to Dashboard"
						>
							Dashboard
						</button>
						<button
							on:click={() => goto('/chat')}
							on:keydown={(e) => e.key === 'Enter' && goto('/chat')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							role="menuitem"
							aria-label="Navigate to AI Chat"
						>
							AI Chat
						</button>
						<button
							on:click={() => goto('/profile')}
							on:keydown={(e) => e.key === 'Enter' && goto('/profile')}
							class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
							role="menuitem"
							aria-label="Navigate to Profile (current page)"
							aria-current="page"
						>
							Profile
						</button>
						{#if user?.role === 'admin'}
							<button
								on:click={() => goto('/admin')}
								on:keydown={(e) => e.key === 'Enter' && goto('/admin')}
								class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
								role="menuitem"
								aria-label="Navigate to Admin Panel"
							>
								Admin Panel
							</button>
						{/if}
					</div>
				</div>
				<div class="flex items-center">
					<div class="ml-3">
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-700" role="status" aria-live="polite">Welcome, {user?.name || user?.email}</span>
							<button
								on:click={handleSignOut}
								on:keydown={(e) => e.key === 'Enter' && handleSignOut()}
								class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
								aria-label="Sign out of your account"
							>
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Hero Section -->
			<section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 px-8 py-12 text-white shadow-2xl mb-8" role="banner" aria-labelledby="profile-settings-title">
				<div class="absolute inset-0 bg-black/20"></div>
				<div class="relative z-10">
					<div class="flex items-center justify-between">
						<div>
							<h1 id="profile-settings-title" class="text-4xl font-bold mb-2">Profile Settings</h1>
							<p class="text-xl text-green-100">
								Manage your account and preferences
							</p>
							<div class="mt-4 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2" role="status" aria-live="polite">
								<div class="h-2 w-2 rounded-full bg-green-400 mr-2" aria-hidden="true"></div>
								<span class="text-sm font-medium">
									{user?.role === 'admin' ? '👑 Administrator Account' : '👤 User Account'}
								</span>
							</div>
						</div>
						<div class="hidden md:block">
							<div class="h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
								<span class="text-5xl">⚙️</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div class="mx-auto max-w-4xl">
				{#if loading}
					<div class="py-8 text-center">
						<div
							class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"
						></div>
						<p class="mt-2 text-gray-600">Loading profile...</p>
					</div>
				{:else}
					<!-- Profile Cards Grid -->
					<div class="grid gap-6 lg:grid-cols-3">
						<!-- Main Profile Info -->
						<div class="lg:col-span-2">
							<div class="overflow-hidden bg-white shadow-lg rounded-xl">
								<div class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
									<h3 class="text-lg leading-6 font-semibold text-gray-900 flex items-center">
										<span class="mr-2">👤</span>
										Personal Information
									</h3>
									<p class="mt-1 text-sm text-gray-600">Update your profile details and contact information</p>
								</div>

						{#if error}
							<div class="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center">
								<span class="text-red-600 mr-2">⚠️</span>
								<span class="text-red-700">{error}</span>
							</div>
						{/if}

						{#if success}
							<div class="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center">
								<span class="text-green-600 mr-2">✅</span>
								<span class="text-green-700">{success}</span>
							</div>
						{/if}

						<div class="border-t border-gray-200 px-4 py-5 sm:px-6">
							<form on:submit|preventDefault={updateProfile}>
								<div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
									<div class="sm:col-span-4">
										<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
											<span class="mr-2">👤</span>
											Full Name
										</label>
										<div class="relative">
											<input
												type="text"
												name="name"
												id="name"
												bind:value={name}
												placeholder="Enter your full name"
												class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200 pl-4 pr-4 py-3"
											/>
											{#if name.trim()}
												<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
													<span class="text-green-500">✓</span>
												</div>
											{/if}
										</div>
									</div>

									<div class="sm:col-span-4">
										<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
											<span class="mr-2">📧</span>
											Email Address
										</label>
										<div class="relative">
											<input
												type="email"
												name="email"
												id="email"
												value={email}
												disabled
												class="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm pl-4 pr-10 py-3 cursor-not-allowed"
											/>
											<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
												<span class="text-gray-400">🔒</span>
											</div>
										</div>
										<p class="mt-2 text-sm text-gray-500 flex items-center">
											<span class="mr-1">ℹ️</span>
											Email address cannot be changed for security reasons
										</p>
									</div>

									<div class="sm:col-span-4">
										<div class="block text-sm font-medium text-gray-700 mb-2">
											<span class="mr-2">📊</span>
											Account Status
										</div>
										<div class="mt-1">
											<div class="flex items-center p-3 rounded-lg {user?.emailVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
												<span class="mr-2 text-lg">
													{user?.emailVerified ? '✅' : '⏳'}
												</span>
												<div>
													<span class="text-sm font-medium {user?.emailVerified ? 'text-green-800' : 'text-yellow-800'}">
														{user?.emailVerified ? 'Email Verified' : 'Pending Verification'}
													</span>
													<p class="text-xs {user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}">
														{user?.emailVerified ? 'Your email has been confirmed' : 'Please check your email for verification link'}
													</p>
												</div>
											</div>
										</div>
									</div>

									<div class="sm:col-span-4">
										<div class="block text-sm font-medium text-gray-700 mb-2">
											<span class="mr-2">🎭</span>
											Account Role
										</div>
										<div class="mt-1">
											<div class="flex items-center p-3 rounded-lg {user?.role === 'admin' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}">
												<span class="mr-2 text-lg">
													{user?.role === 'admin' ? '👑' : '👤'}
												</span>
												<div>
													<span class="text-sm font-medium {user?.role === 'admin' ? 'text-purple-800' : 'text-blue-800'}">
														{user?.role === 'admin' ? 'Administrator' : 'Standard User'}
													</span>
													<p class="text-xs {user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}">
														{user?.role === 'admin' ? 'Full system access and user management' : 'Standard user privileges'}
													</p>
												</div>
											</div>
										</div>
									</div>
								</div>

								<div class="pt-6">
									<div class="flex justify-end space-x-3">
										<button
											type="button"
											on:click={() => {
												name = user?.name || '';
												error = '';
												success = '';
											}}
											on:keydown={(e) => e.key === 'Enter' && (name = user?.name || '', error = '', success = '')}
											class="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
										>
											<span class="mr-2">↩️</span>
											Reset
										</button>
										<button
											type="submit"
											disabled={saving || !name.trim()}
											class="inline-flex items-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-lg hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
										>
											{#if saving}
												<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
												Saving...
											{:else}
												<span class="mr-2">💾</span>
												Save Changes
											{/if}
										</button>
									</div>
								</div>
							</form>
						</div>
					</div>

						</div>
					</div>

					<!-- Account Info Sidebar -->
					<div class="lg:col-span-1 space-y-6">
						<!-- Account Overview -->
						<div class="bg-white shadow-lg rounded-xl overflow-hidden">
							<div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
								<h3 class="text-lg font-semibold text-gray-900 flex items-center">
									<span class="mr-2">📊</span>
									Account Overview
								</h3>
							</div>
							<div class="p-6 space-y-4">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Account Type</span>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
										{user?.role === 'admin' ? '👑 Admin' : '👤 User'}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Email Status</span>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
										{user?.emailVerified ? '✅ Verified' : '⏳ Pending'}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">Auth Method</span>
									<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										{user?.password ? '🔑 Password' : '🔗 OAuth'}
									</span>
								</div>
							</div>
						</div>

						<!-- Quick Actions -->
						<div class="bg-white shadow-lg rounded-xl overflow-hidden">
							<div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
								<h3 class="text-lg font-semibold text-gray-900 flex items-center">
									<span class="mr-2">⚡</span>
									Quick Actions
								</h3>
							</div>
							<div class="p-6 space-y-3">
								<button
									on:click={openChangePasswordModal}
									on:keydown={(e) => e.key === 'Enter' && openChangePasswordModal()}
									class="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
								>
									<div class="flex items-center">
										<span class="text-blue-600 mr-3">🔑</span>
										<span class="text-sm font-medium text-blue-900">Change Password</span>
									</div>
									<span class="text-blue-400 group-hover:text-blue-600">→</span>
								</button>
								
								<button
									on:click={() => goto('/chat')}
									on:keydown={(e) => e.key === 'Enter' && goto('/chat')}
									class="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors group"
								>
									<div class="flex items-center">
										<span class="text-indigo-600 mr-3">🤖</span>
										<span class="text-sm font-medium text-indigo-900">AI Chat</span>
									</div>
									<span class="text-indigo-400 group-hover:text-indigo-600">→</span>
								</button>

								{#if user?.role === 'admin'}
									<button
										on:click={() => goto('/admin')}
										on:keydown={(e) => e.key === 'Enter' && goto('/admin')}
										class="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group"
									>
										<div class="flex items-center">
											<span class="text-purple-600 mr-3">👑</span>
											<span class="text-sm font-medium text-purple-900">Admin Panel</span>
										</div>
										<span class="text-purple-400 group-hover:text-purple-600">→</span>
									</button>
								{/if}
							</div>
						</div>

						<!-- Danger Zone -->
						<div class="bg-white shadow-lg rounded-xl overflow-hidden border border-red-200">
							<div class="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
								<h3 class="text-lg font-semibold text-red-900 flex items-center">
									<span class="mr-2">⚠️</span>
									Danger Zone
								</h3>
							</div>
							<div class="p-6">
								<div class="mb-4">
									<h4 class="text-sm font-medium text-red-900 mb-1">Delete Account</h4>
									<p class="text-sm text-red-600 mb-3">
										Permanently delete your account and all associated data. This action cannot be undone.
									</p>
									<button
										on:click={openDeleteAccountModal}
										on:keydown={(e) => e.key === 'Enter' && openDeleteAccountModal()}
										class="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
									>
										Delete Account
									</button>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</main>
</div>

<!-- Change Password Modal -->
{#if showChangePasswordModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600"
		on:click={handleBackdropClick}
		on:keydown={(e) => {
			if (e.key === 'Escape') {
				closeChangePasswordModal();
			} else {
				handleBackdropKeydown(e);
			}
		}}
		role="presentation"
	>
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<div class="mt-3">
				<h3 class="mb-4 text-lg font-medium text-gray-900">Change Password</h3>

				{#if passwordError}
					<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
						{passwordError}
					</div>
				{/if}

				{#if passwordSuccess}
					<div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
						{passwordSuccess}
					</div>
				{/if}

				<form on:submit|preventDefault={changePassword} class="space-y-4">
					<div>
						<label for="currentPassword" class="block text-sm font-medium text-gray-700">
							Current Password
						</label>
						<input
							type="password"
							id="currentPassword"
							bind:value={currentPassword}
							required
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="newPassword" class="block text-sm font-medium text-gray-700">
							New Password
						</label>
						<input
							type="password"
							id="newPassword"
							bind:value={newPassword}
							required
							minlength="8"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>

					<div>
						<label for="confirmNewPassword" class="block text-sm font-medium text-gray-700">
							Confirm New Password
						</label>
						<input
							type="password"
							id="confirmNewPassword"
							bind:value={confirmNewPassword}
							required
							minlength="8"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={closeChangePasswordModal}
							on:keydown={(e) => e.key === 'Enter' && closeChangePasswordModal()}
							class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={changingPassword}
							class="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
						>
							{changingPassword ? 'Changing...' : 'Change Password'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>

{/if}

<!-- Delete Account Modal -->
{#if showDeleteAccountModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600"
		on:click={handleDeleteBackdropClick}
		on:keydown={(e) => {
			if (e.key === 'Escape') {
				closeDeleteAccountModal();
			} else {
				handleDeleteBackdropKeydown(e);
			}
		}}
		role="presentation"
	>
		<div class="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
			<div class="mt-3">
				<h3 class="mb-4 text-lg font-medium text-gray-900">Delete Account</h3>

				<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
					<p class="text-sm font-medium">Warning: This action cannot be undone!</p>
					<p class="text-sm">All your data, including chat history, will be permanently deleted.</p>
				</div>

				{#if deleteError}
					<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
						{deleteError}
					</div>
				{/if}

				<form on:submit|preventDefault={deleteAccount} class="space-y-4">
					{#if user?.password}
						<div>
							<label for="deletePassword" class="block text-sm font-medium text-gray-700">
								Confirm your password
							</label>
							<input
								type="password"
								id="deletePassword"
								bind:value={deletePassword}
								required
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
							/>
						</div>
					{/if}

					<div>
						<label for="deleteConfirmation" class="block text-sm font-medium text-gray-700">
							Type "DELETE" to confirm
						</label>
						<input
							type="text"
							id="deleteConfirmation"
							bind:value={deleteConfirmation}
							required
							placeholder="DELETE"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:ring-red-500 focus:outline-none"
						/>
					</div>

					<div class="flex justify-end space-x-3 pt-4">
						<button
							type="button"
							on:click={closeDeleteAccountModal}
							on:keydown={(e) => e.key === 'Enter' && closeDeleteAccountModal()}
							class="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={deletingAccount}
							class="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
						>
							{deletingAccount ? 'Deleting...' : 'Delete Account'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
