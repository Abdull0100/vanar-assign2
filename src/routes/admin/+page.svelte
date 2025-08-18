<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let users: Array<{
		id: string;
		name: string;
		email: string;
		role: string;
		createdAt: string;
		emailVerified: string | null;
	}> = [];
	let loading = true;
	let error = '';
	let success = '';
	let stats = {
		totalUsers: 0,
		verifiedUsers: 0,
		adminUsers: 0,
		regularUsers: 0
	};

	$: user = $page.data.session?.user;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}

		if (user && user.role !== 'admin') {
			goto('/dashboard');
			return;
		}

		if (user) {
			loadUsers();
		}
	});

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				const data = await response.json();
				users = data.users;
				calculateStats();
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'An error occurred while loading users';
		} finally {
			loading = false;
		}
	}

	function calculateStats() {
		stats = {
			totalUsers: users.length,
			verifiedUsers: users.filter((u) => u.emailVerified).length,
			adminUsers: users.filter((u) => u.role === 'admin').length,
			regularUsers: users.filter((u) => u.role === 'user').length
		};
	}

	function clearSuccessMessage() {
		setTimeout(() => {
			success = '';
		}, 3000);
	}

	async function updateUserRole(userId: string, newRole: string) {
		try {
			error = ''; // Clear previous errors
			success = ''; // Clear previous success messages
			
			const response = await fetch(`/api/admin/users/${userId}/role`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: newRole })
			});

			if (response.ok) {
				// Update local state
				users = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
				calculateStats();
				error = ''; // Clear any previous errors
				success = 'User role updated successfully!';
				clearSuccessMessage();
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to update user role';
			}
		} catch (err) {
			error = 'An error occurred while updating user role';
		}
	}

	async function toggleUserStatus(userId: string, currentStatus: boolean) {
		try {
			error = ''; // Clear previous errors
			success = ''; // Clear previous success messages
			
			const response = await fetch(`/api/admin/users/${userId}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ active: !currentStatus })
			});

			if (response.ok) {
				// Reload users to get updated data
				await loadUsers();
				success = 'User status updated successfully!';
				clearSuccessMessage();
			} else {
				error = 'Failed to update user status';
			}
		} catch (err) {
			error = 'An error occurred while updating user status';
		}
	}

	async function deleteUser(userId: string, userName: string) {
		if (!confirm(`Are you sure you want to permanently delete ${userName || 'this user'}? This action cannot be undone.`)) {
			return;
		}

		try {
			error = ''; // Clear previous errors
			success = ''; // Clear previous success messages
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				// Remove user from local state
				users = users.filter(u => u.id !== userId);
				calculateStats();
				success = 'User deleted successfully!';
				clearSuccessMessage();
			} else {
				const errorData = await response.json();
				// Show more specific error messages
				if (errorData.error === 'You cannot delete your own account') {
					error = 'You cannot delete your own account. Please ask another admin to do this.';
				} else if (errorData.error === 'User not found') {
					error = 'User not found. They may have already been deleted.';
				} else if (errorData.error === 'Forbidden') {
					error = 'You do not have permission to delete users.';
				} else if (errorData.error === 'Unauthorized') {
					error = 'You are not authorized to perform this action. Please log in again.';
				} else {
					error = errorData.error || 'Failed to delete user. Please try again.';
				}
			}
		} catch (err) {
			console.error('Delete user error:', err);
			error = 'An error occurred while deleting user. Please check your connection and try again.';
		}
	}

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
</script>

<svelte:head>
	<title>Admin Dashboard - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<nav class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex">
					<div class="flex flex-shrink-0 items-center">
						<h1 class="text-xl font-bold text-gray-900">Auth App</h1>
					</div>
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<button
							on:click={() => goto('/dashboard')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Dashboard
						</button>
						<button
							on:click={() => goto('/chat')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							AI Chat
						</button>
						<button
							on:click={() => goto('/profile')}
							class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
						>
							Profile
						</button>
						<button
							on:click={() => goto('/admin')}
							class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
						>
							Admin Panel
						</button>
					</div>
				</div>
				<div class="flex items-center">
					<div class="ml-3">
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-700">Admin: {user?.name || user?.email}</span>
							<button
								on:click={handleSignOut}
								class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
	<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
				<p class="mt-2 text-gray-600">Manage users and view system analytics</p>
			</div>

			<!-- Stats Cards -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
										></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="truncate text-sm font-medium text-gray-500">Total Users</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="truncate text-sm font-medium text-gray-500">Verified Users</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.verifiedUsers}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="truncate text-sm font-medium text-gray-500">Admin Users</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.adminUsers}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="p-5">
						<div class="flex items-center">
							<div class="flex-shrink-0">
								<div class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-500">
									<svg
										class="h-5 w-5 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										></path>
									</svg>
								</div>
							</div>
							<div class="ml-5 w-0 flex-1">
								<dl>
									<dt class="truncate text-sm font-medium text-gray-500">Regular Users</dt>
									<dd class="text-lg font-medium text-gray-900">{stats.regularUsers}</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Users Table -->
			<div class="overflow-hidden bg-white shadow sm:rounded-md">
				<div class="px-4 py-5 sm:px-6">
					<h3 class="text-lg leading-6 font-medium text-gray-900">User Management</h3>
					<p class="mt-1 max-w-2xl text-sm text-gray-500">Manage user roles and account status</p>
					
					<!-- Info about user deletion -->
					<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
								</svg>
							</div>
							<div class="ml-3">
								<h4 class="text-sm font-medium text-blue-800">User Deletion Information</h4>
								<div class="mt-2 text-sm text-blue-700">
									<p>When you delete a user, the following will happen:</p>
									<ul class="mt-1 list-disc list-inside space-y-1">
										<li>All user sessions will be terminated</li>
										<li>User account and profile data will be permanently removed</li>
										<li>Chat history and messages will be deleted</li>
										<li>An email notification will be sent to the deleted user</li>
									</ul>
									<p class="mt-2 font-medium">⚠️ This action cannot be undone!</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{#if error}
					<div class="border border-red-200 bg-red-50 px-4 py-3 text-red-700">
						{error}
					</div>
				{/if}

				{#if success}
					<div class="border border-green-200 bg-green-50 px-4 py-3 text-green-700">
						{success}
					</div>
				{/if}

				{#if loading}
					<div class="px-4 py-8 text-center">
						<div
							class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"
						></div>
						<p class="mt-2 text-gray-600">Loading users...</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>User</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Role</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Verification Status</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Joined</th
									>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
										>Actions <span class="text-xs font-normal text-gray-400">(Current user: N/A)</span></th
									>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
												{#each users as userItem (userItem.id)}
					<tr>
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="flex items-center">
												<div class="h-10 w-10 flex-shrink-0">
													<div
														class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300"
													>
														<span class="text-sm font-medium text-gray-700">
															{userItem.name
																? userItem.name.charAt(0).toUpperCase()
																: userItem.email.charAt(0).toUpperCase()}
														</span>
													</div>
												</div>
												<div class="ml-4">
													<div class="text-sm font-medium text-gray-900">
														{userItem.name || 'No name'}
													</div>
													<div class="text-sm text-gray-500">{userItem.email}</div>
												</div>
											</div>
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{#if userItem.id === user?.id}
												<div class="flex items-center space-x-2">
													<span class="text-sm font-medium text-gray-900">{userItem.role}</span>
													<span class="text-xs text-gray-500">(Current user)</span>
												</div>
											{:else}
												<select
													value={userItem.role}
													on:change={(e) =>
														updateUserRole(userItem.id, (e.target as HTMLSelectElement).value)}
													class="rounded-md border-gray-300 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
												>
													<option value="user">User</option>
													<option value="admin">Admin</option>
												</select>
											{/if}
										</td>
										<td class="px-6 py-4 whitespace-nowrap">
											<span
												class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {userItem.emailVerified
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'}"
											>
												{userItem.emailVerified ? 'Verified' : 'Pending'}
											</span>
										</td>
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
											{new Date(userItem.createdAt).toLocaleDateString()}
										</td>
										<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
											{#if userItem.id === user?.id}
												<span class="text-gray-400">N/A</span>
											{:else}
												<div class="flex space-x-2">
													<button
														on:click={() => toggleUserStatus(userItem.id, !!userItem.emailVerified)}
														class="text-indigo-600 hover:text-indigo-900"
													>
														{userItem.emailVerified ? 'Disable' : 'Enable'}
													</button>
													<button
														on:click={() => deleteUser(userItem.id, userItem.name || userItem.email)}
														class="text-red-600 hover:text-red-900"
													>
														Delete
													</button>
												</div>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
