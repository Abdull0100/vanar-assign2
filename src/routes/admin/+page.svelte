<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import AdminStatsCards from '$lib/components/admin/AdminStatsCards.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import AdminRecentActivities from '$lib/components/admin/AdminRecentActivities.svelte';
	import AdminUserModal from '$lib/components/admin/AdminUserModal.svelte';
	import AdminDeleteUserModal from '$lib/components/admin/AdminDeleteUserModal.svelte';
	import AdminHeaderTabs from '$lib/components/admin/AdminHeaderTabs.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		adminStore,
		showDeleteModal,
		deleteTarget,
		loadData,
		loadUserDetails,
		updateUserRole,
		toggleUserStatus,
		openDeleteModal,
		closeDeleteModal,
		confirmDeleteUser,
		closeUserModal,
		setActiveTab,
		setModalActiveTab,
		formatDate,
		formatDateOnly,
		formatDuration,
		getPaginatedActivities,
		getTotalPages,
		nextActivitiesPage,
		prevActivitiesPage,
		setupKeyboardHandlers
	} from '$lib/api/adminState';

	export let data: any;
	let user = data.session?.user;

	onMount(() => {
		if (user) {
			loadData();
		}

		// Setup keyboard handlers
		const cleanup = setupKeyboardHandlers();

		return () => {
			cleanup();
		};
	});

	async function handleDeleteUser(userId: string, userName: string) {
		openDeleteModal(userId, userName);
	}
</script>

<svelte:head>
	<title>Admin Dashboard - Comprehensive Analytics</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Navigation -->
	<Navigation user={user ?? null} currentPage="admin" />

	<!-- Main Content -->
	<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		<div class="px-4 py-6 sm:px-0">
			<AdminHeaderTabs 
				activeTab={$adminStore.activeTab} 
				setActiveTab={setActiveTab} 
			/>

			{#if $adminStore.error}
				<div class="border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive mb-6 rounded-md">
					{$adminStore.error}
				</div>
			{/if}

			{#if $adminStore.success}
				<div class="border border-green-200 bg-green-50 px-4 py-3 text-green-700 mb-6 rounded-md">
					{$adminStore.success}
				</div>
			{/if}

			{#if $adminStore.loading}
				<LoadingSpinner label="Loading data..." />
			{:else}
				<!-- Overview Tab -->
				{#if $adminStore.activeTab === 'overview'}
					<div class="space-y-6">
						<AdminStatsCards 
							users={$adminStore.users} 
							userStats={$adminStore.userStats} 
							mostActiveUsers={$adminStore.mostActiveUsers} 
						/>
					</div>
				{/if}

				<!-- Users Tab -->
				{#if $adminStore.activeTab === 'users'}
					<AdminUsersTable
						users={$adminStore.users}
						currentUser={user}
						onUpdateRole={updateUserRole}
						onToggleStatus={toggleUserStatus}
						onDetails={(id) => loadUserDetails(id)}
						onDelete={(id, name) => handleDeleteUser(id, name)}
						formatDateOnly={(d) => formatDateOnly(d)}
					/>
				{/if}

				<!-- Recent Activities Tab -->
				{#if $adminStore.activeTab === 'activities'}
					<AdminRecentActivities 
						allRecentActivities={$adminStore.allRecentActivities} 
						{formatDate} 
					/>
				{/if}
			{/if}
		</div>
	</div>

	<AdminDeleteUserModal 
		show={$showDeleteModal} 
		target={$deleteTarget} 
		onConfirm={confirmDeleteUser} 
		onCancel={closeDeleteModal} 
	/>

	<AdminUserModal
		selectedUser={$adminStore.selectedUser}
		userStats={$adminStore.userStats}
		userActivities={$adminStore.userActivities}
		userSessions={$adminStore.userSessions}
		modalActiveTab={$adminStore.modalActiveTab}
		setModalActiveTab={setModalActiveTab}
		{formatDate}
		{formatDuration}
		{getPaginatedActivities}
		{getTotalPages}
		activitiesPage={$adminStore.activitiesPage}
		{nextActivitiesPage}
		{prevActivitiesPage}
		{closeUserModal}
	/>
</div>
