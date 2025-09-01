<script lang="ts">
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import AdminStatsCards from '$lib/components/admin/AdminStatsCards.svelte';
	import AdminUsersTable from '$lib/components/admin/AdminUsersTable.svelte';
	import AdminRecentActivities from '$lib/components/admin/AdminRecentActivities.svelte';
	import AdminUserModal from '$lib/components/admin/AdminUserModal.svelte';
	import AdminHeaderTabs from '$lib/components/admin/AdminHeaderTabs.svelte';
	import AdminCharts from '$lib/components/admin/AdminCharts.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import {
		adminStore,
		loadData,
		connectAdminEvents,
		disconnectAdminEvents,
		updateUserRole,
		toggleUserStatus,
		deleteUserAction,
		closeUserModal,
		setActiveTab,
		formatDate,
		formatDateOnly,
		setupKeyboardHandlers
	} from '$lib/api/adminState';

	export let data: any;
	let user = data.session?.user;

	onMount(() => {
		if (user) {
			loadData();
			connectAdminEvents();
		}

		// Setup keyboard handlers
		const cleanup = setupKeyboardHandlers();

		return () => {
			cleanup();
			disconnectAdminEvents();
		};
	});
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
			<AdminHeaderTabs activeTab={$adminStore.activeTab} {setActiveTab} />

			{#if $adminStore.error}
				<div
					class="mb-6 rounded-md border border-[var(--destructive)]/30 bg-[var(--destructive)]/15 px-4 py-3 text-[var(--destructive-foreground)]"
				>
					{$adminStore.error}
				</div>
			{/if}

			{#if $adminStore.success}
				<div
					class="mb-6 rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/15 px-4 py-3 text-[var(--accent-foreground)]"
				>
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
						<AdminCharts />
					</div>
				{/if}

				<!-- Users Tab -->
				{#if $adminStore.activeTab === 'users'}
					<AdminUsersTable
						users={$adminStore.users}
						currentUser={user}
						onUpdateRole={updateUserRole}
						onToggleStatus={toggleUserStatus}
						onDelete={(id) => deleteUserAction(id)}
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

	<AdminUserModal
		selectedUser={$adminStore.selectedUser}
		open={$adminStore.selectedUser != null}
		onClose={closeUserModal}
	/>
</div>
