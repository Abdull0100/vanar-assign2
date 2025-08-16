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
								on:click={() => navigateTo('/dashboard')}
								class="inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900"
							>
								Dashboard
							</button>
							<button
								on:click={() => navigateTo('/chat')}
								class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							>
								AI Chat
							</button>
							<button
								on:click={() => navigateTo('/profile')}
								class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
							>
								Profile
							</button>
							{#if user?.role === 'admin'}
								<button
									on:click={() => navigateTo('/admin')}
									class="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
								>
									Admin Panel
								</button>
							{/if}
						</div>
					</div>
					<div class="flex items-center">
						<div class="ml-3">
							<div class="flex items-center space-x-4">
								<span class="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
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
			<!-- Hero Section -->
			<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 px-8 py-12 text-white shadow-2xl">
				<div class="absolute inset-0 bg-black/20"></div>
				<div class="relative z-10">
					<div class="flex items-center justify-between">
						<div>
							<h1 class="text-4xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
							<p class="text-xl text-indigo-100">
								You're signed in as {user?.email}
							</p>
							<div class="mt-4 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2">
								<div class="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
								<span class="text-sm font-medium">
									{user?.role === 'admin' ? '👑 Administrator' : '👤 User'}
								</span>
							</div>
						</div>
						<div class="hidden md:block">
							<div class="h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
								<span class="text-5xl">🚀</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<!-- AI Chat Card -->
				<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
					<div class="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div class="relative z-10">
						<div class="flex items-center mb-4">
							<div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
								<span class="text-2xl">🤖</span>
							</div>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">AI Assistant</h3>
								<p class="text-sm text-gray-500">Powered by Gemini</p>
							</div>
						</div>
						<p class="text-gray-600 mb-4">Chat with our intelligent AI assistant for help, creativity, and problem-solving.</p>
						<button
							on:click={() => navigateTo('/chat')}
							class="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
						>
							Start Conversation
						</button>
					</div>
				</div>

				<!-- Profile Card -->
				<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
					<div class="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div class="relative z-10">
						<div class="flex items-center mb-4">
							<div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mr-4">
								<span class="text-2xl">👤</span>
							</div>
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Profile Settings</h3>
								<p class="text-sm text-gray-500">Manage account</p>
							</div>
						</div>
						<p class="text-gray-600 mb-4">Update your profile information, change password, and manage account settings.</p>
						<button
							on:click={() => navigateTo('/profile')}
							class="w-full rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
						>
							Edit Profile
						</button>
					</div>
				</div>

				<!-- Admin Panel (Admin Only) -->
				{#if user?.role === 'admin'}
					<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
						<div class="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
						<div class="relative z-10">
							<div class="flex items-center mb-4">
								<div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mr-4">
									<span class="text-2xl">👑</span>
								</div>
								<div>
									<h3 class="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
									<p class="text-sm text-gray-500">System management</p>
								</div>
							</div>
							<p class="text-gray-600 mb-4">Access administrative tools, manage users, and view system analytics.</p>
							<button
								on:click={() => navigateTo('/admin')}
								class="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								Open Admin Panel
							</button>
						</div>
					</div>
				{:else}
					<!-- User Role Card -->
					<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg">
						<div class="relative z-10">
							<div class="flex items-center mb-4">
								<div class="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
									<span class="text-2xl">📊</span>
								</div>
								<div>
									<h3 class="text-lg font-semibold text-gray-900">Your Role</h3>
									<p class="text-sm text-gray-500">Current access level</p>
								</div>
							</div>
							<p class="text-gray-600 mb-4">You have standard user access. Contact an administrator for role upgrades.</p>
							<div class="w-full rounded-lg bg-gray-100 px-4 py-3 text-gray-600 font-medium text-center">
								Standard User
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Quick Stats (if admin) -->
			{#if user?.role === 'admin'}
				<div class="mt-8">
					<h2 class="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
					<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						<div class="rounded-xl bg-white p-6 shadow-lg">
							<div class="flex items-center">
								<div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
									<span class="text-xl">👥</span>
								</div>
								<div class="ml-4">
									<h3 class="text-sm font-medium text-gray-500">Total Users</h3>
									<div class="text-2xl font-bold text-gray-900">
										{#if loadingStats}
											<div class="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
										{:else}
											{stats.totalUsers}
										{/if}
									</div>
								</div>
							</div>
						</div>
						<div class="rounded-xl bg-white p-6 shadow-lg">
							<div class="flex items-center">
								<div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
									<span class="text-xl">💬</span>
								</div>
								<div class="ml-4">
									<h3 class="text-sm font-medium text-gray-500">Chat Messages</h3>
									<div class="text-2xl font-bold text-gray-900">
										{#if loadingStats}
											<div class="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
										{:else}
											{stats.totalMessages}
										{/if}
									</div>
								</div>
							</div>
						</div>
						<div class="rounded-xl bg-white p-6 shadow-lg">
							<div class="flex items-center">
								<div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
									<span class="text-xl">👑</span>
								</div>
								<div class="ml-4">
									<h3 class="text-sm font-medium text-gray-500">Admins</h3>
									<div class="text-2xl font-bold text-gray-900">
										{#if loadingStats}
											<div class="h-6 w-12 bg-gray-200 animate-pulse rounded"></div>
										{:else}
											{stats.adminUsers}
										{/if}
									</div>
								</div>
							</div>
						</div>
						<div class="rounded-xl bg-white p-6 shadow-lg">
							<div class="flex items-center">
								<div class="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
									<span class="text-xl">⚡</span>
								</div>
								<div class="ml-4">
									<h3 class="text-sm font-medium text-gray-500">System Status</h3>
									<div class="text-2xl font-bold {stats.systemStatus === 'online' ? 'text-green-600' : 'text-red-600'}">
										{#if loadingStats}
											<div class="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
										{:else}
											{stats.systemStatus === 'online' ? 'Online' : 'Offline'}
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Loading state while checking session -->
	<div class="flex min-h-screen items-center justify-center bg-gray-50">
		<div class="text-center">
			<div
				class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
			></div>
			<p class="text-gray-600">Checking authentication...</p>
		</div>
	</div>
{/if}
