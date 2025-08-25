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
<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 relative overflow-hidden">
	<!-- Enhanced animated background elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<!-- Floating orbs -->
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-300 to-blue-400 blur-3xl opacity-40 animate-float-slow"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 blur-3xl opacity-40 animate-float-slow" style="animation-delay: 2s"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 blur-3xl opacity-30 animate-float-slow" style="animation-delay: 4s"></div>
		
		<!-- Additional animated elements -->
		<div class="absolute top-20 left-20 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 blur-2xl opacity-50 animate-pulse" style="animation-delay: 1s"></div>
		<div class="absolute bottom-20 right-20 h-40 w-40 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 blur-2xl opacity-50 animate-pulse" style="animation-delay: 3s"></div>
		<div class="absolute top-1/3 right-1/4 h-24 w-24 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 blur-xl opacity-60 animate-bounce" style="animation-delay: 0.5s"></div>
		<div class="absolute bottom-1/3 left-1/4 h-28 w-28 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 blur-xl opacity-60 animate-bounce" style="animation-delay: 1.5s"></div>
		
		<!-- Animated grid pattern -->
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.1)_1px,transparent_0)] bg-[length:20px_20px] animate-pulse opacity-30"></div>
		
		<!-- Floating particles -->
		<div class="absolute top-10 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-float-fast opacity-70"></div>
		<div class="absolute top-32 right-1/3 w-1 h-1 bg-violet-400 rounded-full animate-float-fast opacity-60" style="animation-delay: 0.5s"></div>
		<div class="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-pink-400 rounded-full animate-float-fast opacity-80" style="animation-delay: 1s"></div>
		<div class="absolute top-1/2 right-10 w-1 h-1 bg-blue-400 rounded-full animate-float-fast opacity-60" style="animation-delay: 1.5s"></div>
		<div class="absolute bottom-40 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float-fast opacity-70" style="animation-delay: 2s"></div>
	</div>

		<Navigation user={user ?? null} currentPage="dashboard" />

		<!-- Main Content -->
		<div class="relative z-10 mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
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

<style>
	@keyframes float-slow {
		0%, 100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(180deg);
		}
	}

	@keyframes float-fast {
		0%, 100% {
			transform: translateY(0px) translateX(0px);
		}
		25% {
			transform: translateY(-10px) translateX(5px);
		}
		50% {
			transform: translateY(-5px) translateX(-5px);
		}
		75% {
			transform: translateY(-15px) translateX(3px);
		}
	}

	.animate-float-slow {
		animation: float-slow 8s ease-in-out infinite;
	}

	.animate-float-fast {
		animation: float-fast 4s ease-in-out infinite;
	}
</style>
