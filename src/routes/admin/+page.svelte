<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Navigation from '$lib/components/Navigation.svelte';
	import AdminStatsCards from '$lib/components/admin/AdminStatsCards.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import AdminRecentActivities from '$lib/components/admin/AdminRecentActivities.svelte';
	import AdminUserModal from '$lib/components/admin/AdminUserModal.svelte';
	import AdminDeleteUserModal from '$lib/components/admin/AdminDeleteUserModal.svelte';
	import AdminHeaderTabs from '$lib/components/admin/AdminHeaderTabs.svelte';
	import SimpleCharts from '$lib/components/admin/SimpleCharts.svelte';
	import SimpleOverviewCharts from '$lib/components/admin/SimpleOverviewCharts.svelte';
	import SimpleUserStatsChart from '$lib/components/admin/SimpleUserStatsChart.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		fetchUsers,
		fetchUsersStats,
		fetchAdminActions,
		fetchUserActivities as apiFetchUserActivities,
		fetchUserDetails as apiFetchUserDetails,
		fetchUserStats as apiFetchUserStats,
		updateUserRole as apiUpdateUserRole,
		toggleUserStatus as apiToggleUserStatus,
		deleteUser as apiDeleteUser
	} from '$lib/api/admin';

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
	let activeTab: 'overview' | 'users' | 'activities' | 'conversations' | 'sessions' | 'analytics' = 'overview';
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

	// New data for enhanced tables
	let conversations: any[] = [];
	let chatMessages: any[] = [];
	let sessions: any[] = [];
	let userActivitiesDetailed: any[] = [];

	// Modal state
	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; name: string } | null>(null);

	export let data: any;
	let user = data.session?.user;

	onMount(() => {
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
				loadAllRecentActivities(),
				loadConversations(),
				loadChatMessages(),
				loadSessions(),
				loadUserActivitiesDetailed()
			]);
		} catch (err) {
			error = 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	async function loadUsers() {
		try {
			const data = await fetchUsers();
			users = data.users;
		} catch (err) {
			error = 'An error occurred while loading users';
		}
	}

	async function loadUserStats() {
		try {
			const data = await fetchUsersStats();
			userStats = data.overview;
			mostActiveUsers = data.mostActiveUsers;
		} catch (err) {
			console.error('Failed to load user stats:', err);
		}
	}

	async function loadRecentActivity() {
		try {
			const data = await fetchAdminActions(20);
			adminActions = data.actions;
		} catch (err) {
			console.error('Failed to load recent activity:', err);
		}
	}

	async function loadAllRecentActivities() {
		try {
			const activitiesData = await apiFetchUserActivities();
			userActivities = activitiesData.activities || [];

			const actionsData = await fetchAdminActions(50);
			adminActions = actionsData.actions || [];

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

	async function loadConversations() {
		try {
			const response = await fetch('/api/admin/conversations');
			const data = await response.json();
			conversations = data.conversations || [];
		} catch (err) {
			console.error('Failed to load conversations:', err);
		}
	}

	async function loadChatMessages() {
		try {
			const response = await fetch('/api/admin/chat-messages');
			const data = await response.json();
			chatMessages = data.messages || [];
		} catch (err) {
			console.error('Failed to load chat messages:', err);
		}
	}

	async function loadSessions() {
		try {
			const response = await fetch('/api/admin/sessions');
			const data = await response.json();
			sessions = data.sessions || [];
		} catch (err) {
			console.error('Failed to load sessions:', err);
		}
	}

	async function loadUserActivitiesDetailed() {
		try {
			const response = await fetch('/api/admin/user-activities');
			const data = await response.json();
			userActivitiesDetailed = data.activities || [];
		} catch (err) {
			console.error('Failed to load user activities:', err);
		}
	}

	async function loadUserDetails(userId: string) {
		try {
			userStats = null;
			const data = await apiFetchUserDetails(userId);
			selectedUser = data.user;
			userActivities = data.activities;
			userSessions = data.sessions;
			const stats = await apiFetchUserStats(userId);
			userStats = stats.stats;
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
			await apiUpdateUserRole(userId, newRole);
			users = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
			error = '';
			success = 'User role updated successfully!';
			clearSuccessMessage();
			await loadRecentActivity();
		} catch (err) {
			error = 'An error occurred while updating user role';
		}
	}

	async function toggleUserStatus(userId: string, currentStatus: boolean) {
		try {
			error = '';
			success = '';
			await apiToggleUserStatus(userId, !currentStatus);
			await loadUsers();
			success = 'User status updated successfully!';
			clearSuccessMessage();
			await loadRecentActivity();
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
			await apiDeleteUser(userId);
			users = users.filter(u => u.id !== userId);
			success = 'User deleted successfully!';
			clearSuccessMessage();
			await loadRecentActivity();
		} catch (err) {
			console.error('Delete user error:', err);
			error = 'An error occurred while deleting user. Please check your connection and try again.';
		}
	}

	async function deleteUser(userId: string, userName: string) {
		openDeleteModal(userId, userName);
	}

	// sign-out handled by Navigation component

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

	// Filter functions
	function getFilteredUsers() {
		return users.filter(user => {
			const matchesSearch = !searchQuery || 
				user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				user.email.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesRole = !selectedUserRole || user.role === selectedUserRole;
			return matchesSearch && matchesRole;
		});
	}

	function getFilteredConversations() {
		return conversations.filter(conv => {
			const matchesSearch = !searchQuery || 
				conv.roomName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesSearch;
		});
	}

	function getFilteredSessions() {
		return sessions.filter(session => {
			const matchesSearch = !searchQuery || 
				session.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				session.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				session.ipAddress?.includes(searchQuery);
			return matchesSearch;
		});
	}

	function getFilteredActivities() {
		return allRecentActivities.filter(activity => {
			const matchesSearch = !searchQuery || 
				activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				activity.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				activity.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesType = !selectedActivityType || activity.type === selectedActivityType;
			return matchesSearch && matchesType;
		});
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Comprehensive Analytics</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-indigo-50">
	<!-- Navigation -->
	<Navigation user={user ?? null} currentPage="admin" />

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<!-- Enhanced Header with Search and Filters -->
			<div class="mb-6">
				<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
						<p class="mt-1 text-sm text-gray-600">Comprehensive system management and analytics</p>
					</div>
					
					<!-- Search and Filter Controls -->
					<div class="flex flex-col sm:flex-row gap-3">
						<div class="relative">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search users, conversations, activities..."
								class="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							/>
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
								<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
							</div>
						</div>
						
						{#if activeTab === 'users'}
							<select
								bind:value={selectedUserRole}
								class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							>
								<option value="">All Roles</option>
								<option value="user">User</option>
								<option value="admin">Admin</option>
							</select>
						{/if}
						
						{#if activeTab === 'activities'}
							<select
								bind:value={selectedActivityType}
								class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							>
								<option value="">All Activities</option>
								<option value="user_activity">User Activity</option>
								<option value="admin_action">Admin Action</option>
							</select>
						{/if}
					</div>
				</div>
			</div>

			<AdminHeaderTabs {activeTab} setActiveTab={(t) => activeTab = t} />

			{#if error}
				<div class="border border-red-200 bg-red-50 px-4 py-3 text-red-700 mb-6 rounded-lg">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="border border-green-200 bg-green-50 px-4 py-3 text-green-700 mb-6 rounded-lg">
					{success}
				</div>
			{/if}

			{#if loading}
				<LoadingSpinner label="Loading data..." />
			{:else}
				<!-- Overview Tab -->
				{#if activeTab === 'overview'}
					<div class="space-y-6">
						<AdminStatsCards {users} {userStats} {mostActiveUsers} />
						
						<!-- Quick Stats Grid -->
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div class="bg-white rounded-lg shadow p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
											<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
											</svg>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-500">Total Conversations</p>
										<p class="text-2xl font-semibold text-gray-900">{conversations.length}</p>
									</div>
								</div>
							</div>
							
							<div class="bg-white rounded-lg shadow p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="flex h-8 w-8 items-center justify-center rounded-md bg-green-500">
											<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
											</svg>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-500">Total Messages</p>
										<p class="text-2xl font-semibold text-gray-900">{chatMessages.length}</p>
									</div>
								</div>
							</div>
							
							<div class="bg-white rounded-lg shadow p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500">
											<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-500">Active Sessions</p>
										<p class="text-2xl font-semibold text-gray-900">{sessions.filter(s => s.isActive).length}</p>
									</div>
								</div>
							</div>
							
							<div class="bg-white rounded-lg shadow p-6">
								<div class="flex items-center">
									<div class="flex-shrink-0">
										<div class="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500">
											<svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
											</svg>
										</div>
									</div>
									<div class="ml-4">
										<p class="text-sm font-medium text-gray-500">Total Activities</p>
										<p class="text-2xl font-semibold text-gray-900">{userActivitiesDetailed.length}</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Quick Charts Overview -->
						<SimpleOverviewCharts 
							{users}
							userActivities={userActivitiesDetailed}
						/>
					</div>
				{/if}

				<!-- Users Tab -->
				{#if activeTab === 'users'}
					<SimpleUserStatsChart users={getFilteredUsers()} />
					<AdminUsersTable
						users={getFilteredUsers()}
						currentUser={user}
						onUpdateRole={updateUserRole}
						onToggleStatus={toggleUserStatus}
						onDetails={(id) => loadUserDetails(id)}
						onDelete={(id, name) => deleteUser(id, name)}
						formatDateOnly={(d) => formatDateOnly(d)}
					/>
				{/if}

				<!-- Conversations Tab -->
				{#if activeTab === 'conversations'}
					<div class="bg-white shadow rounded-lg overflow-hidden">
						<div class="px-6 py-4 border-b border-gray-200">
							<h3 class="text-lg font-medium text-gray-900">Conversations</h3>
							<p class="mt-1 text-sm text-gray-600">All chat conversations and their details</p>
						</div>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each getFilteredConversations() as conversation}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{conversation.roomName}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{conversation.user?.name || conversation.user?.email || 'Unknown'}
											</td>
											<td class="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
												{conversation.summary || 'No summary available'}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDateOnly(conversation.createdAt)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDateOnly(conversation.updatedAt)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Sessions Tab -->
				{#if activeTab === 'sessions'}
					<div class="bg-white shadow rounded-lg overflow-hidden">
						<div class="px-6 py-4 border-b border-gray-200">
							<h3 class="text-lg font-medium text-gray-900">User Sessions</h3>
							<p class="mt-1 text-sm text-gray-600">Active and historical user login sessions</p>
						</div>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200">
								<thead class="bg-gray-50">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each getFilteredSessions() as session}
										<tr class="hover:bg-gray-50">
											<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{session.user?.name || session.user?.email || 'Unknown'}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
												{session.ipAddress || 'N/A'}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDate(session.loginTime)}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{session.logoutTime ? formatDate(session.logoutTime) : 'Active'}
											</td>
											<td class="px-6 py-4 whitespace-nowrap">
												<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
													{session.isActive ? 'Active' : 'Ended'}
												</span>
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatDuration(session.loginTime, session.logoutTime)}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Recent Activities Tab -->
				{#if activeTab === 'activities'}
					<AdminRecentActivities allRecentActivities={getFilteredActivities()} {formatDate} />
				{/if}

				<!-- Analytics Tab -->
				{#if activeTab === 'analytics'}
					<div class="space-y-6">
						<!-- Activity Trends -->
						<div class="bg-white shadow rounded-lg p-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Activity Trends</h3>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="bg-blue-50 rounded-lg p-4">
									<h4 class="text-sm font-medium text-blue-900">Today's Activities</h4>
									<p class="text-2xl font-bold text-blue-600">{userActivitiesDetailed.filter(a => {
										const today = new Date().toDateString();
										return new Date(a.createdAt).toDateString() === today;
									}).length}</p>
								</div>
								<div class="bg-green-50 rounded-lg p-4">
									<h4 class="text-sm font-medium text-green-900">This Week's Activities</h4>
									<p class="text-2xl font-bold text-green-600">{userActivitiesDetailed.filter(a => {
										const weekAgo = new Date();
										weekAgo.setDate(weekAgo.getDate() - 7);
										return new Date(a.createdAt) > weekAgo;
									}).length}</p>
								</div>
								<div class="bg-purple-50 rounded-lg p-4">
									<h4 class="text-sm font-medium text-purple-900">This Month's Activities</h4>
									<p class="text-2xl font-bold text-purple-600">{userActivitiesDetailed.filter(a => {
										const monthAgo = new Date();
										monthAgo.setMonth(monthAgo.getMonth() - 1);
										return new Date(a.createdAt) > monthAgo;
									}).length}</p>
								</div>
							</div>
						</div>

						<!-- Charts Section -->
						<SimpleCharts 
							{users}
							{conversations}
							{chatMessages}
							{sessions}
							userActivities={userActivitiesDetailed}
						/>

						<!-- Most Active Users -->
						<div class="bg-white shadow rounded-lg p-6">
							<h3 class="text-lg font-medium text-gray-900 mb-4">Most Active Users</h3>
							<div class="space-y-3">
								{#each mostActiveUsers.slice(0, 5) as user}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div class="flex items-center space-x-3">
											<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
												<span class="text-sm font-medium text-blue-600">
													{user.name?.charAt(0) || user.email.charAt(0)}
												</span>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</p>
												<p class="text-xs text-gray-500">{user.email}</p>
											</div>
										</div>
										<div class="text-right">
											<p class="text-sm font-medium text-gray-900">{user.activityCount || 0}</p>
											<p class="text-xs text-gray-500">activities</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<AdminDeleteUserModal show={$showDeleteModal} target={$deleteTarget} onConfirm={confirmDeleteUser} onCancel={closeDeleteModal} />

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
