<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	$: user = $page.data.session?.user;

	// Stats for admin dashboard
	let stats = {
		totalUsers: 0,
		adminUsers: 0,
		totalMessages: 0,
		systemStatus: 'online'
	};
	let loadingStats = true;

	// Mock analytics data for charts
	let analyticsData = {
		messagesSent: [12, 19, 15, 25, 22, 30, 28],
		activeUsers: [8, 12, 10, 18, 15, 22, 20],
		loginTrends: [5, 8, 6, 12, 10, 15, 14]
	};

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
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
								Auth App
							</h1>
						</div>
						<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
							<button
								on:click={() => navigateTo('/dashboard')}
								class="nav-link active"
							>
								Dashboard
							</button>
							<button
								on:click={() => navigateTo('/chat')}
								class="nav-link"
							>
								AI Chat
							</button>
							<button
								on:click={() => navigateTo('/profile')}
								class="nav-link"
							>
								Profile
							</button>
							{#if user?.role === 'admin'}
								<button
									on:click={() => navigateTo('/admin')}
									class="nav-link"
								>
									<span class="nav-icon">⚙️</span>
									Admin Panel
								</button>
							{/if}
						</div>
					</div>
					<div class="flex items-center space-x-4">
						<span class="text-sm text-gray-300">
							Welcome, {user.name || user.email}
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
			<!-- Hero Section -->
			<div class="text-center mb-12 animate-slide-in">
				<h1 class="text-4xl md:text-6xl font-bold text-white mb-4">
					Welcome to Your
					<span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Dashboard
					</span>
				</h1>
				<p class="text-xl text-gray-300 max-w-3xl mx-auto">
					Manage your account, track your activity, and explore the AI chat features.
				</p>
			</div>

			<!-- Quick Actions -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.1s;">
					<div class="text-4xl mb-4 animate-float">💬</div>
					<h3 class="text-xl font-semibold text-white mb-2">Start Chatting</h3>
					<p class="text-gray-300 mb-4">Connect with our AI assistant powered by Google Gemini</p>
					<button
						on:click={() => navigateTo('/chat')}
						class="dark-button"
					>
						Open Chat
					</button>
				</div>

				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.2s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 1s;">👤</div>
					<h3 class="text-xl font-semibold text-white mb-2">Profile Settings</h3>
					<p class="text-gray-300 mb-4">Update your profile information and preferences</p>
					<button
						on:click={() => navigateTo('/profile')}
						class="dark-button"
					>
						Edit Profile
					</button>
				</div>

				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.3s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 2s;">🔐</div>
					<h3 class="text-xl font-semibold text-white mb-2">Security</h3>
					<p class="text-gray-300 mb-4">Manage your account security and authentication</p>
					<button
						on:click={() => navigateTo('/profile')}
						class="dark-button-secondary"
					>
						Security Settings
					</button>
				</div>
			</div>

			<!-- Analytics Section -->
			<div class="mb-12">
				<h2 class="text-3xl font-bold text-white mb-8 text-center">Analytics Overview</h2>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div class="analytics-card animate-fade-in" style="animation-delay: 0.1s;">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-gray-400 text-sm">Total Messages</p>
								<p class="text-3xl font-bold text-white">{stats.totalMessages}</p>
							</div>
							<div class="text-3xl animate-pulse">💬</div>
						</div>
					</div>

					<div class="analytics-card animate-fade-in" style="animation-delay: 0.2s;">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-gray-400 text-sm">Active Users</p>
								<p class="text-3xl font-bold text-white">{stats.totalUsers}</p>
							</div>
							<div class="text-3xl animate-pulse">👥</div>
						</div>
					</div>

					<div class="analytics-card animate-fade-in" style="animation-delay: 0.3s;">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-gray-400 text-sm">System Status</p>
								<p class="text-3xl font-bold text-green-400">{stats.systemStatus}</p>
							</div>
							<div class="text-3xl animate-pulse">🟢</div>
						</div>
					</div>
				</div>

				<!-- Charts -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<div class="dark-card animate-fade-in" style="animation-delay: 0.4s;">
						<h3 class="text-xl font-semibold text-white mb-4">Messages Sent (Last 7 Days)</h3>
						<div class="chart-container">
							<div class="bar-chart">
								{#each analyticsData.messagesSent as value, i}
									<div 
										class="bar" 
										style="height: {(value / 30) * 100}%; width: 12%;"
									></div>
								{/each}
							</div>
						</div>
					</div>

					<div class="dark-card animate-fade-in" style="animation-delay: 0.5s;">
						<h3 class="text-xl font-semibold text-white mb-4">Active Users Trend</h3>
						<div class="chart-container">
							<svg class="w-full h-full" viewBox="0 0 100 30">
								<path 
									class="line-path"
									d="M 0,{30 - (analyticsData.activeUsers[0] / 22) * 30} 
										L 14,{30 - (analyticsData.activeUsers[1] / 22) * 30} 
										L 28,{30 - (analyticsData.activeUsers[2] / 22) * 30} 
										L 42,{30 - (analyticsData.activeUsers[3] / 22) * 30} 
										L 56,{30 - (analyticsData.activeUsers[4] / 22) * 30} 
										L 70,{30 - (analyticsData.activeUsers[5] / 22) * 30} 
										L 84,{30 - (analyticsData.activeUsers[6] / 22) * 30}"
									fill="none"
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			<!-- System Overview -->
			<div class="dark-card animate-fade-in" style="animation-delay: 0.6s;">
				<h3 class="text-2xl font-semibold text-white mb-6">System Overview</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div class="text-center">
						<div class="text-3xl mb-2 animate-pulse">🚀</div>
						<p class="text-gray-400 text-sm">Performance</p>
						<p class="text-white font-semibold">Excellent</p>
					</div>
					<div class="text-center">
						<div class="text-3xl mb-2 animate-pulse">🔒</div>
						<p class="text-gray-400 text-sm">Security</p>
						<p class="text-white font-semibold">Protected</p>
					</div>
					<div class="text-center">
						<div class="text-3xl mb-2 animate-pulse">📡</div>
						<p class="text-gray-400 text-sm">Connectivity</p>
						<p class="text-white font-semibold">Stable</p>
					</div>
					<div class="text-center">
						<div class="text-3xl mb-2 animate-pulse">🤖</div>
						<p class="text-gray-400 text-sm">AI Status</p>
						<p class="text-white font-semibold">Online</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-animated flex items-center justify-center">
		<div class="dark-card text-center">
			<div class="loading-robot mb-4">🤖</div>
			<div class="loading-text">Loading...</div>
		</div>
	</div>
{/if}
