<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { writable } from 'svelte/store';
	import Navigation from '$lib/components/Navigation.svelte';
	import AdminStatsCards from '$lib/components/admin/AdminStatsCards.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import AdminRecentActivities from '$lib/components/admin/AdminRecentActivities.svelte';
	import AdminUserModal from '$lib/components/admin/AdminUserModal.svelte';

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
	let modalActiveTab: 'sessions' | 'activities' | 'stats' = 'sessions';
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
					const statsData = await response.json();
					userStats = statsData.stats;
				}
			}
		} catch (err) {
			console.error('Failed to load user details:', err);
		}
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

<div class="min-h-screen bg-gray-50">
	<!-- Navigation -->
	<Navigation user={user ?? null} currentPage="admin" />

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Page Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Comprehensive Admin Dashboard</h1>
				<p class="mt-2 text-gray-600">Monitor user activities, sessions, and system analytics</p>
			</div>

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
						<AdminStatsCards {users} {userStats} {mostActiveUsers} />
					</div>
				{/if}

				<!-- Users Tab -->
				{#if activeTab === 'users'}
					<AdminUsersTable
						users={users}
						currentUser={user}
						onUpdateRole={updateUserRole}
						onToggleStatus={toggleUserStatus}
						onDetails={(id) => loadUserDetails(id)}
						onDelete={(id, name) => deleteUser(id, name)}
						formatDateOnly={(d) => formatDateOnly(d)}
					/>
				{/if}

				<!-- Recent Activities Tab -->
				{#if activeTab === 'activities'}
					<AdminRecentActivities {allRecentActivities} {formatDate} />
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

	<AdminUserModal
		selectedUser={selectedUser}
		{userStats}
		{userActivities}
		{userSessions}
		bind:modalActiveTab
		{formatDate}
		{formatDuration}
		{getPaginatedActivities}
		{getTotalPages}
		bind:activitiesPage
		{nextActivitiesPage}
		{prevActivitiesPage}
		{closeUserModal}
	/>
</div>
