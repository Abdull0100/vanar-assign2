<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import DashboardHero from '$lib/components/dashboard/DashboardHero.svelte';
	import DashboardQuickActions from '$lib/components/dashboard/DashboardQuickActions.svelte';
	import AdminStats from '$lib/components/dashboard/AdminStats.svelte';
	import LoadingSession from '$lib/components/dashboard/LoadingSession.svelte';
	export let data: any;

	$: user = data.session?.user;

	// Stats for admin dashboard
	let stats = {
		totalUsers: 0,
		adminUsers: 0,
		totalMessages: 0,
		systemStatus: 'online'
	};
	let loadingStats = true;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if (data.session === null) {
			goto('/auth/signin');
		} else if (user?.role === 'admin') {
			loadStats();
		}
	});

	async function loadStats() {
		if (user?.role !== 'admin') return;
		
		try {
			const response = await fetch('/api/admin/stats');
			if (response.ok) {
				stats = await response.json();
			}
		} catch (error) {
			console.error('Error loading stats:', error);
		} finally {
			loadingStats = false;
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

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>Dashboard - Auth App</title>
</svelte:head>
{#if user}
<div class="min-h-screen bg-gray-50">

		<Navigation user={user ?? null} currentPage="dashboard" />

		<!-- Main Content -->
		<div class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
			<!-- Hero Section -->
			<DashboardHero user={user} />

			<!-- Quick Actions -->
			<DashboardQuickActions isAdmin={user?.role === 'admin'} />

			<!-- Quick Stats (if admin) -->
			{#if user?.role === 'admin'}
				<AdminStats stats={stats} loading={loadingStats} />
			{/if}
		</div>
	</div>
{:else}
	<LoadingSession />
{/if}
