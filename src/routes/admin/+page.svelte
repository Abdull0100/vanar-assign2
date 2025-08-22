<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';

	let users: Array<{
		id: string;
		name: string;
		email: string;
		role: string;
		createdAt: string;
		emailVerified: string | null;
		stats: any;
	}> = [];
	let loading = true;
	let error = '';
	let success = '';
	let activeTab = 'overview';
	let userStats: any = null;
	let recentActivity: any[] = [];
	let mostActiveUsers: any[] = [];
	let selectedUser: any = null;
	let userActivities: any[] = [];
	let userSessions: any[] = [];
	let adminActions: any[] = [];
	let allRecentActivities: any[] = [];
	let modalActiveTab = 'sessions';
	let activitiesPage = 1;
	let activitiesPerPage = 10;
	
	// Search and filter variables
	let searchQuery = '';
	let selectedActivityType = '';
	let selectedDateRange = 'all';
	let selectedUserRole = '';
	let selectedSpecificActivity = '';
	let analyticsData: any = {
		todayConversations: 0,
		todayLogins: 0,
		totalUsers: 0,
		totalActivities: 0,
		conversationsTrend: [],
		activityBreakdown: []
	};
	let autoRefresh = false;

	// Modal state
	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; name: string } | null>(null);

	$: user = $page.data.session?.user;

	onMount(() => {
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}

		if (user && user.role !== 'admin') {
			goto('/dashboard');
			return;
		}

		if (user) {
			loadData();
		}

		// Add keyboard event listener for ESC key
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && selectedUser) {
				closeUserModal();
			}
		};

		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	async function loadData() {
		try {
			loading = true;
			await Promise.all([
				loadUsers(),
				loadUserStats(),
				loadRecentActivity(),
				loadAllRecentActivities()
			]);
		} catch (err) {
			error = 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				const data = await response.json();
				users = data.users;
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'An error occurred while loading users';
		}
	}

	async function loadUserStats() {
		try {
			const response = await fetch('/api/admin/users/stats');
			if (response.ok) {
				const data = await response.json();
				userStats = data.overview;
				mostActiveUsers = data.mostActiveUsers;
			}
		} catch (err) {
			console.error('Failed to load user stats:', err);
		}
	}

	async function loadRecentActivity() {
		try {
			const response = await fetch('/api/admin/actions?limit=20');
			if (response.ok) {
				const data = await response.json();
				adminActions = data.actions;
			}
		} catch (err) {
			console.error('Failed to load recent activity:', err);
		}
	}

	async function loadAllRecentActivities() {
		try {
			// Load user activities
			const activitiesResponse = await fetch('/api/admin/users/activities');
			if (activitiesResponse.ok) {
				const activitiesData = await activitiesResponse.json();
				userActivities = activitiesData.activities || [];
			}

			// Load admin actions
			const actionsResponse = await fetch('/api/admin/actions?limit=50');
			if (actionsResponse.ok) {
				const actionsData = await actionsResponse.json();
				adminActions = actionsData.actions || [];
			}

			// Combine and sort all activities by date
			allRecentActivities = [
				...userActivities.map(activity => ({
					...activity,
					type: 'user_activity',
					user: activity.user || { id: activity.userId, name: 'Unknown User' }
				})),
				...adminActions.map(action => ({
					...action,
					type: 'admin_action'
				}))
			].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		} catch (err) {
			console.error('Failed to load all recent activities:', err);
		}
	}

	async function loadUserDetails(userId: string) {
		try {
			// Reset userStats to avoid showing stale data from overview
			userStats = null;
			
			const response = await fetch(`/api/admin/users/${userId}/activities`);
			if (response.ok) {
				const data = await response.json();
				selectedUser = data.user;
				userActivities = data.activities;
				userSessions = data.sessions;
				
				// Load user stats for the selected user
				const statsResponse = await fetch(`/api/admin/users/${userId}/stats`);
				if (statsResponse.ok) {
					const statsData = await statsResponse.json();
					userStats = statsData.stats;
				}
			}
		} catch (err) {
			console.error('Failed to load user details:', err);
		}
	}

	function calculateStats() {
		return {
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
			error = '';
			success = '';
			
			const response = await fetch(`/api/admin/users/${userId}/role`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: newRole })
			});

			if (response.ok) {
				users = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
				error = '';
				success = 'User role updated successfully!';
				clearSuccessMessage();
				await loadRecentActivity();
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
			error = '';
			success = '';
			
			const response = await fetch(`/api/admin/users/${userId}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ active: !currentStatus })
			});

			if (response.ok) {
				await loadUsers();
				success = 'User status updated successfully!';
				clearSuccessMessage();
				await loadRecentActivity();
			} else {
				error = 'Failed to update user status';
			}
		} catch (err) {
			error = 'An error occurred while updating user status';
		}
	}

	function openDeleteModal(userId: string, userName: string) {
		deleteTarget.set({ id: userId, name: userName });
		showDeleteModal.set(true);
	}

	function closeDeleteModal() {
		showDeleteModal.set(false);
		deleteTarget.set(null);
	}

	async function confirmDeleteUser() {
		if (!$deleteTarget) return;

		const { id: userId, name: userName } = $deleteTarget;
		closeDeleteModal();

		try {
			error = '';
			success = '';
			
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				users = users.filter(u => u.id !== userId);
				success = 'User deleted successfully!';
				clearSuccessMessage();
				await loadRecentActivity();
			} else {
				const errorData = await response.json();
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

	async function deleteUser(userId: string, userName: string) {
		openDeleteModal(userId, userName);
	}

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
			window.location.href = '/';
		} catch (error) {
			console.error('Sign out error:', error);
			window.location.href = '/';
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleString();
	}
    function formatDateOnly(date: Date | string) {
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        }

	function formatDuration(startTime: string, endTime?: string) {
		const start = new Date(startTime);
		const end = endTime ? new Date(endTime) : new Date();
		const diff = end.getTime() - start.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		return `${hours}h ${minutes}m`;
	}

	function closeUserModal() {
		selectedUser = null;
		userStats = null;
		modalActiveTab = 'sessions';
		activitiesPage = 1;
	}

	function formatSessionToken(token: string) {
		if (!token) return 'N/A';
		return token.length > 20 ? `${token.substring(0, 20)}...` : token;
	}

	function formatMetadata(metadata: any) {
		if (!metadata) return 'No metadata';
		
		try {
			if (typeof metadata === 'string') {
				const parsed = JSON.parse(metadata);
				return Object.entries(parsed).map(([key, value]) => 
					`<strong>${key}:</strong> ${JSON.stringify(value)}`
				).join('<br>');
			} else if (typeof metadata === 'object') {
				return Object.entries(metadata).map(([key, value]) => 
					`<strong>${key}:</strong> ${JSON.stringify(value)}`
				).join('<br>');
			}
			return JSON.stringify(metadata, null, 2);
		} catch {
			return JSON.stringify(metadata);
		}
	}

	function getPaginatedActivities() {
		const start = (activitiesPage - 1) * activitiesPerPage;
		const end = start + activitiesPerPage;
		return userActivities.slice(start, end);
	}

	function getTotalPages() {
		return Math.ceil(userActivities.length / activitiesPerPage);
	}

	function nextActivitiesPage() {
		if (activitiesPage < getTotalPages()) {
			activitiesPage++;
		}
	}

	function prevActivitiesPage() {
		if (activitiesPage > 1) {
			activitiesPage--;
		}
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Comprehensive Analytics</title>
</svelte:head>

{#if user && user.role === 'admin'}
	<div class="min-h-screen bg-animated relative overflow-hidden">
		<!-- Animated Background Elements -->
		<div class="absolute inset-0 overflow-hidden">
			<div class="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
			<div class="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
			<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>
		</div>

		<!-- Navigation -->
		<nav class="chatbot-nav relative z-10">
			<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div class="flex h-16 justify-between items-center">
					<div class="flex items-center">
						<div class="flex-shrink-0">
							<h1 class="text-xl font-bold text-white flex items-center gap-2">
								<span class="text-2xl animate-bot-glow">🤖</span>
								Auth App
							</h1>
						</div>
						<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
							<button
								on:click={() => navigateTo('/dashboard')}
								class="nav-link"
							>
								<span class="nav-icon">📊</span>
								Dashboard
							</button>
							<button
								on:click={() => navigateTo('/chat')}
								class="nav-link"
							>
								<span class="nav-icon">💬</span>
								AI Chat
							</button>
							<button
								on:click={() => navigateTo('/profile')}
								class="nav-link"
							>
								<span class="nav-icon">👤</span>
								Profile
							</button>
							<button
								on:click={() => navigateTo('/admin')}
								class="nav-link active"
							>
								<span class="nav-icon">⚙️</span>
								Admin Panel
							</button>
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-300">
							Admin: {user.name || user.email}
						</span>
						<button
							on:click={handleSignOut}
							class="dark-button-secondary"
						>
							🚪 Sign Out
						</button>
					</div>
				</div>
			</div>
		</nav>

		<!-- Main Content -->
		<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Comprehensive Admin Dashboard</h1>
				<p class="mt-2 text-gray-600">Monitor user activities, sessions, and system analytics</p>
			</div>

			<!-- Success/Error Messages -->
			{#if success}
				<div class="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm">
					{success}
				</div>
			{/if}

			{#if error}
				<div class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
					{error}
				</div>
			{/if}

			<!-- Tab Navigation -->
			<div class="border-b border-gray-200 mb-8">
				<nav class="-mb-px flex space-x-8">
					<button
						on:click={() => activeTab = 'overview'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Overview
					</button>
					<button
						on:click={() => activeTab = 'users'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						User Management
					</button>
					<button
						on:click={() => activeTab = 'activities'}
						class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'activities' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
					>
						Recent Activities
					</button>

				</nav>
			</div>

			{#if error}
				<div class="border border-red-200 bg-red-50 px-4 py-3 text-red-700 mb-6">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="border border-green-200 bg-green-50 px-4 py-3 text-green-700 mb-6">
					{success}
				</div>
			{/if}

			{#if loading}
				<div class="text-center py-8">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
					<p class="mt-2 text-gray-600">Loading data...</p>
				</div>
			{:else}
				<!-- Overview Tab -->
				{#if activeTab === 'overview'}
					<div class="space-y-6">
						<!-- Stats Cards -->
						<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
							<div class="overflow-hidden rounded-lg bg-white shadow">
								<div class="p-5">
									<div class="flex items-center">
										<div class="flex-shrink-0">
											<div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
												<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
												</svg>
											</div>
										</div>
										<div class="ml-5 w-0 flex-1">
											<dl>
												<dt class="truncate text-sm font-medium text-gray-500">Total Users</dt>
												<dd class="text-lg font-medium text-gray-900">{userStats?.totalUsers || calculateStats().totalUsers}</dd>
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
												<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
												</svg>
											</div>
										</div>
										<div class="ml-5 w-0 flex-1">
											<dl>
												<dt class="truncate text-sm font-medium text-gray-500">Verified Users</dt>
												<dd class="text-lg font-medium text-gray-900">{userStats?.verifiedUsers || calculateStats().verifiedUsers}</dd>
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
												<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
												</svg>
											</div>
										</div>
										<div class="ml-5 w-0 flex-1">
											<dl>
												<dt class="truncate text-sm font-medium text-gray-500">Admin Users</dt>
												<dd class="text-lg font-medium text-gray-900">{userStats?.adminUsers || calculateStats().adminUsers}</dd>
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
												<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
												</svg>
											</div>
										</div>
										<div class="ml-5 w-0 flex-1">
											<dl>
												<dt class="truncate text-sm font-medium text-gray-500">Regular Users</dt>
												<dd class="text-lg font-medium text-gray-900">{userStats?.regularUsers || calculateStats().regularUsers}</dd>
											</dl>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Additional Stats -->
						{#if userStats}
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div class="overflow-hidden rounded-lg bg-white shadow">
									<div class="p-5">
										<h3 class="text-lg font-medium text-gray-900 mb-4">Chat Statistics</h3>
										<div class="space-y-3">
											<div class="flex justify-between">
												<span class="text-sm text-gray-500">Total Chat Messages</span>
												<span class="text-sm font-medium text-gray-900">{userStats.totalChatMessages}</span>
											</div>
											<div class="flex justify-between">
												<span class="text-sm text-gray-500">Total Conversations</span>
												<span class="text-sm font-medium text-gray-900">{userStats.totalConversations}</span>
											</div>
										</div>
									</div>
								</div>

								<div class="overflow-hidden rounded-lg bg-white shadow">
									<div class="p-5">
										<h3 class="text-lg font-medium text-gray-900 mb-4">Most Active Users</h3>
										<div class="space-y-2">
											{#each mostActiveUsers.slice(0, 5) as activeUser}
												<div class="flex justify-between items-center">
													<span class="text-sm text-gray-700">{activeUser.name || activeUser.email}</span>
													<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
														{activeUser.stats?.totalChatMessages || 0} messages
													</span>
												</div>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Users Tab -->
				{#if activeTab === 'users'}
					<div class="overflow-hidden bg-white shadow sm:rounded-md">
						<div class="px-4 py-5 sm:px-6">
							<h3 class="text-lg leading-6 font-medium text-gray-900">User Management</h3>
							<p class="mt-1 max-w-2xl text-sm text-gray-500">Manage user roles, status, and view detailed statistics</p>
						</div>

						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">User</th>
										<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Role</th>
										<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
										<!-- <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Chat Stats</th> -->
										<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Joined</th>
										<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200 bg-white">
									{#each users as userItem (userItem.id)}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="flex items-center">
													<div class="h-10 w-10 flex-shrink-0">
														<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
															<span class="text-sm font-medium text-gray-700">
																{userItem.name ? userItem.name.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
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
														on:change={(e) => updateUserRole(userItem.id, (e.target as HTMLSelectElement).value)}
														class="rounded-md border-gray-300 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
													>
														<option value="user">User</option>
														<option value="admin">Admin</option>
													</select>
												{/if}
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {userItem.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
													{userItem.emailVerified ? 'Active' : 'Inactive'}
												</span>
											</td>
											
											<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
												{formatDateOnly(userItem.createdAt)}
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
															on:click={() => loadUserDetails(userItem.id)}
															class="text-blue-600 hover:text-blue-900"
														>
															Details
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
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="text-4xl mb-4 animate-float">👥</div>
						<p class="text-gray-400">No users found</p>
					</div>
				{/if}

				<!-- Recent Activities Tab -->
				{#if activeTab === 'activities'}
					<div class="space-y-6">
						<div class="bg-white shadow rounded-lg p-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
							<p class="text-sm text-gray-600 mb-4">All user activities and admin actions across the system</p>
							
							<div class="space-y-2">
								{#each allRecentActivities.slice(0, 50) as activity}
									<div class="relative group">
										<!-- Concise Activity Item -->
										<div class="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md hover:border-gray-300 transition-all cursor-pointer">
											<div class="flex items-center space-x-3">
												<div class="flex-shrink-0">
													{#if activity.type === 'user_activity'}
														<div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
															<svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
															</svg>
														</div>
													{:else}
														<div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
															<svg class="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
															</svg>
														</div>
													{/if}
												</div>
												<div class="flex-1 min-w-0">
													<span class="text-sm text-gray-900">
														{activity.description || activity.activityType || 'Unknown activity'} • {formatDate(activity.createdAt)}
													</span>
												</div>
											</div>
											<div class="flex-shrink-0">
												<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {activity.type === 'user_activity' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}">
													{activity.type === 'user_activity' ? (activity.activityType || 'Activity') : (activity.actionType || 'Action')}
												</span>
											</div>
										</div>

										<!-- Hover Tooltip -->
										<div class="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
											<div class="space-y-3">
												<!-- User Information -->
												<div>
													<div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User</div>
													<div class="text-sm text-gray-900">
														{#if activity.type === 'user_activity'}
															{activity.user?.name || activity.user?.email || 'Unknown User'}
														{:else}
															Admin: {activity.admin?.name || activity.admin?.email || 'Unknown Admin'}
															{#if activity.targetUser}
																<br>Target: {activity.targetUser?.name || activity.targetUser?.email || 'Unknown User'}
															{/if}
														{/if}
													</div>
												</div>

												<!-- IP Address -->
												{#if activity.ipAddress}
													<div>
														<div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">IP Address</div>
														<div class="text-sm text-gray-900 font-mono">{activity.ipAddress}</div>
													</div>
												{/if}

												<!-- User Agent -->
												{#if activity.userAgent}
													<div>
														<div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User Agent</div>
														<div class="text-sm text-gray-900 break-all">{activity.userAgent}</div>
													</div>
												{/if}

												<!-- Metadata -->
												{#if activity.metadata}
													<div>
														<div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Metadata</div>
														<div class="text-sm text-gray-900">
															{#if typeof activity.metadata === 'object'}
																{#each Object.entries(activity.metadata) as [key, value]}
																	<div class="flex justify-between py-1">
																		<span class="font-medium">{key}:</span>
																		<span class="text-gray-600">{JSON.stringify(value)}</span>
																	</div>
																{/each}
															{:else}
																<div class="bg-gray-50 rounded p-2 text-xs font-mono">
																	{JSON.stringify(activity.metadata, null, 2)}
																</div>
															{/if}
														</div>
													</div>
												{/if}

												<!-- Activity Details -->
												<div>
													<div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Activity Details</div>
													<div class="text-sm text-gray-900">
														<div class="flex justify-between py-1">
															<span class="font-medium">Type:</span>
															<span class="text-gray-600">{activity.type === 'user_activity' ? (activity.activityType || 'Activity') : (activity.actionType || 'Action')}</span>
														</div>
														<div class="flex justify-between py-1">
															<span class="font-medium">Time:</span>
															<span class="text-gray-600">{formatDate(activity.createdAt)}</span>
														</div>
														<div class="flex justify-between py-1">
															<span class="font-medium">Description:</span>
															<span class="text-gray-600 text-right">{activity.description || 'No description'}</span>
														</div>
													</div>
												</div>
											</div>

											<!-- Tooltip Arrow -->
											<div class="absolute -top-2 left-4 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
										</div>
									</div>
								{/each}
								
								{#if allRecentActivities.length === 0}
									<p class="text-gray-500 text-center py-8">No activities found.</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}


			{/if}
		</div>
	</div>

	<!-- Delete User Confirmation Modal -->
	{#if $showDeleteModal && $deleteTarget}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={closeDeleteModal}></div>

			<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
				<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
					<div class="sm:flex sm:items-start">
						<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
						</div>
						<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
								Delete User Account
							</h3>
							<div class="mt-2">
								<p class="text-sm text-gray-500">
									Are you sure you want to permanently delete <strong>"{$deleteTarget.name}"</strong>?
								</p>
								<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
									<div class="flex items-start">
										<svg class="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
											<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
										</svg>
										<div class="text-sm text-red-700">
											<strong>PERMANENT DELETION:</strong> This will permanently erase:
											<ul class="mt-1 ml-4 list-disc">
												<li>All user sessions will be terminated</li>
												<li>User account and profile data</li>
												<li>Chat history and messages</li>
												<li>An email notification will be sent to the user</li>
											</ul>
											<p class="mt-2 font-medium">This action cannot be undone!</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
					<button
						type="button"
						class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={confirmDeleteUser}
					>
						Delete User
					</button>
					<button
						type="button"
						class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200"
						on:click={closeDeleteModal}
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- User Details Modal -->
	{#if selectedUser}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
			<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={closeUserModal}></div>

			<div class="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all">
				<div class="bg-white px-6 py-4 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-medium text-gray-900" id="modal-title">
							User Details: {selectedUser.name || selectedUser.email}
						</h3>
						<button
							on:click={closeUserModal}
							class="text-gray-400 hover:text-gray-600"
							aria-label="Close user details modal"
						>
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				<div class="px-6 py-4 overflow-hidden flex flex-col h-full">
					<!-- User Information -->
					<div class="bg-gray-50 rounded-lg p-4 mb-6 flex-shrink-0">
						<h4 class="text-md font-medium text-gray-900 mb-3">User Information</h4>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Name</h5>
								<p class="mt-1 text-sm text-gray-900">{selectedUser.name || 'No name'}</p>
							</div>
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Email</h5>
								<p class="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
							</div>
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Role</h5>
								<p class="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
							</div>
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Joined</h5>
								<p class="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
							</div>
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Last Activity</h5>
								<div class="mt-1 text-sm text-gray-900">
									{#if userStats && userStats.lastActivityDetails}
										<div class="space-y-1">
											<div class="font-medium text-gray-900">
												{userStats.lastActivityDetails.description || userStats.lastActivityDetails.activityType || 'Unknown activity'}
											</div>
											<div class="text-xs text-gray-500">
												{formatDate(userStats.lastActivityDetails.createdAt)}
											</div>
										</div>
									{:else if userStats && userStats.lastActivity}
										<div class="space-y-1">
											<div class="text-gray-400">Unknown activity</div>
											<div class="text-xs text-gray-500">
												{formatDate(userStats.lastActivity)}
											</div>
										</div>
									{:else}
										<span class="text-gray-400">Never</span>
									{/if}
								</div>
							</div>
							<div>
								<h5 class="block text-sm font-medium text-gray-700">Last Login</h5>
								<div class="mt-1 text-sm text-gray-900">
									{#if userStats && userStats.lastLogin}
										{formatDate(userStats.lastLogin)}
									{:else}
										<span class="text-gray-400">Never</span>
									{/if}
								</div>
							</div>
						</div>
					</div>

					<!-- Tab Navigation -->
					<div class="border-b border-gray-200 mb-6 flex-shrink-0">
						<nav class="-mb-px flex space-x-8">
							<button
								on:click={() => modalActiveTab = 'sessions'}
								class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'sessions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							>
								User Sessions ({userSessions.length})
							</button>
							<button
								on:click={() => modalActiveTab = 'activities'}
								class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'activities' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							>
								User Activities ({userActivities.length})
							</button>
							<button
								on:click={() => modalActiveTab = 'stats'}
								class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
							>
								Chat Stats
							</button>
						</nav>
					</div>

					<!-- Tab Content -->
					<div class="flex-1 overflow-y-auto min-h-0">
						<!-- Sessions Tab -->
						{#if modalActiveTab === 'sessions'}
							<div class="space-y-4">
								<h4 class="text-lg font-medium text-gray-900">User Sessions</h4>
								{#if userSessions.length > 0}
									<div class="overflow-x-auto max-h-96 overflow-y-auto">
										<table class="min-w-full divide-y divide-gray-200">
											<thead class="bg-gray-50">
												<tr>
													
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
													<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
												</tr>
											</thead>
											<tbody class="bg-white divide-y divide-gray-200">
												{#each userSessions as session}
													<tr class="hover:bg-gray-50">
														
														<td class="px-4 py-3 text-sm text-gray-900">
															{session.ipAddress || 'Unknown'}
														</td>
														<td class="px-4 py-3 text-sm text-gray-900">
															{formatDate(session.loginTime)}
														</td>
														<td class="px-4 py-3 text-sm text-gray-900">
															{session.logoutTime ? formatDate(session.logoutTime) : 'Active'}
														</td>
														<td class="px-4 py-3 text-sm">
															{#if session.isActive}
																<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	Active
																</span>
															{:else}
																<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
																	Ended
																</span>
															{/if}
														</td>
														<td class="px-4 py-3 text-sm text-gray-900">
															{#if session.logoutTime}
																{formatDuration(session.loginTime, session.logoutTime)}
															{:else}
																{formatDuration(session.loginTime)}
															{/if}
														</td>
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{:else}
									<p class="text-gray-500 text-center py-8">No sessions found for this user.</p>
								{/if}
							</div>
						{/if}

						<!-- Activities Tab -->
						{#if modalActiveTab === 'activities'}
							<div class="space-y-4">
								<h4 class="text-lg font-medium text-gray-900">User Activities</h4>
								{#if userActivities.length > 0}
									<div class="space-y-3 max-h-96 overflow-y-auto">
										{#each getPaginatedActivities() as activity}
											<div class="bg-gray-50 rounded-lg p-4">
												<div class="flex items-start justify-between">
													<div class="flex-1">
														<div class="flex items-center space-x-3 mb-2">
															<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																{activity.activityType}
															</span>
															<span class="text-sm text-gray-500">
																{formatDate(activity.createdAt)}
															</span>
														</div>
														<div class="text-sm font-medium text-gray-900 mb-2">
															{activity.description}
														</div>
														
														{#if activity.ipAddress}
															<div class="text-xs text-gray-500 mt-2">
																IP: {activity.ipAddress}
															</div>
														{/if}
													</div>
												</div>
											</div>
										{/each}

										<!-- Pagination -->
										{#if getTotalPages() > 1}
											<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
												<div class="flex flex-1 justify-between sm:hidden">
													<button
														on:click={prevActivitiesPage}
														disabled={activitiesPage === 1}
														class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
													>
														Previous
													</button>
													<button
														on:click={nextActivitiesPage}
														disabled={activitiesPage === getTotalPages()}
														class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
													>
														Next
													</button>
												</div>
												<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
													<div>
														<p class="text-sm text-gray-700">
															Showing <span class="font-medium">{((activitiesPage - 1) * activitiesPerPage) + 1}</span> to <span class="font-medium">{Math.min(activitiesPage * activitiesPerPage, userActivities.length)}</span> of <span class="font-medium">{userActivities.length}</span> results
														</p>
													</div>
													<div>
														<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
															<button
																on:click={prevActivitiesPage}
																disabled={activitiesPage === 1}
																class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																<span class="sr-only">Previous</span>
																<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																	<path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
																</svg>
															</button>
															{#each Array.from({length: getTotalPages()}, (_, i) => i + 1) as pageNum}
																<button
																	on:click={() => activitiesPage = pageNum}
																	class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === activitiesPage ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'} ring-inset ring-gray-300"
																>
																	{pageNum}
																</button>
															{/each}
															<button
																on:click={nextActivitiesPage}
																disabled={activitiesPage === getTotalPages()}
																class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
															>
																<span class="sr-only">Next</span>
																<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																	<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
																</svg>
															</button>
														</nav>
													</div>
												</div>
											</div>
										{/if}
									</div>
								{:else}
									<p class="text-gray-500 text-center py-8">No activities found for this user.</p>
								{/if}
							</div>
						{/if}

						<!-- Chat Stats Tab -->
						{#if modalActiveTab === 'stats'}
							<div class="space-y-6 max-h-96 overflow-y-auto">
								<h4 class="text-lg font-medium text-gray-900">Chat Statistics</h4>
								{#if userStats}
									<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
										<div class="bg-blue-50 rounded-lg p-4 text-center">
											<div class="text-3xl font-bold text-blue-600">{userStats.totalChatMessages || 0}</div>
											<div class="text-sm text-blue-700 font-medium">Total Chat Messages</div>
										</div>
										<div class="bg-green-50 rounded-lg p-4 text-center">
											<div class="text-3xl font-bold text-green-600">{userStats.totalConversations || 0}</div>
											<div class="text-sm text-green-700 font-medium">Total Conversations</div>
										</div>
										<div class="bg-purple-50 rounded-lg p-4 text-center">
											<div class="text-3xl font-bold text-purple-600">{userStats.profileUpdateCount || 0}</div>
											<div class="text-sm text-purple-700 font-medium">Profile Updates</div>
										</div>
										<div class="bg-orange-50 rounded-lg p-4 text-center">
											<div class="text-3xl font-bold text-orange-600">{userStats.passwordChangeCount || 0}</div>
											<div class="text-sm text-orange-700 font-medium">Password Changes</div>
										</div>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div class="bg-gray-50 rounded-lg p-4">
											<h5 class="text-md font-medium text-gray-900 mb-3">Last Activity</h5>
											<div class="text-sm text-gray-700">
												{#if userStats.lastActivityDetails}
													<div class="space-y-2">
														<div class="font-medium text-gray-900">
															{userStats.lastActivityDetails.description || userStats.lastActivityDetails.activityType || 'Unknown activity'}
														</div>
														<div class="text-xs text-gray-500">
															{formatDate(userStats.lastActivityDetails.createdAt)}
														</div>
													</div>
												{:else if userStats.lastActivity}
													<div class="space-y-2">
														<div class="text-gray-400">Unknown activity</div>
														<div class="text-xs text-gray-500">
															{formatDate(userStats.lastActivity)}
														</div>
													</div>
												{:else}
													Never
												{/if}
											</div>
										</div>
										<div class="bg-gray-50 rounded-lg p-4">
											<h5 class="text-md font-medium text-gray-900 mb-3">Last Login</h5>
											<div class="text-sm text-gray-700">
												{userStats.lastLogin ? formatDate(userStats.lastLogin) : 'Never'}
											</div>
										</div>
									</div>
								{:else}
									<p class="text-gray-500 text-center py-8">No statistics available for this user.</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
