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
	let activeTab: 'overview' | 'users' | 'activities' = 'overview';
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
			<AdminHeaderTabs {activeTab} setActiveTab={(t) => activeTab = t} />

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
				<LoadingSpinner label="Loading data..." />
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
