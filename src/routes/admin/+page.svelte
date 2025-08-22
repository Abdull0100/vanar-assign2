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
	}> = [];
	let loading = true;
	let error = '';
	let success = '';
	let stats = {
		totalUsers: 0,
		verifiedUsers: 0,
		adminUsers: 0,
		regularUsers: 0
	};

	// Mock analytics data for charts
	let analyticsData = {
		userGrowth: [5, 8, 12, 15, 18, 22, 25, 28, 30, 32, 35, 38],
		verificationRate: [60, 65, 70, 75, 80, 85, 88, 90, 92, 94, 95, 96],
		adminRatio: [10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38]
	};

	// Modal state
	const showDeleteModal = writable(false);
	const deleteTarget = writable<{ id: string; name: string } | null>(null);

	$: user = $page.data.session?.user;

	onMount(() => {
		// Only redirect if we're sure there's no session data
		if ($page.data.session === null) {
			goto('/auth/signin');
			return;
		}

		if (user && user.role !== 'admin') {
			goto('/dashboard');
			return;
		}

		if (user) {
			loadUsers();
		}
	});

	async function loadUsers() {
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				const data = await response.json();
				users = data.users;
				calculateStats();
			} else {
				error = 'Failed to load users';
			}
		} catch (err) {
			error = 'An error occurred while loading users';
		} finally {
			loading = false;
		}
	}

	function calculateStats() {
		stats = {
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
			error = ''; // Clear previous errors
			success = ''; // Clear previous success messages
			
			const response = await fetch(`/api/admin/users/${userId}/role`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ role: newRole })
			});

			if (response.ok) {
				// Update local state
				users = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
				calculateStats();
				error = ''; // Clear any previous errors
				success = 'User role updated successfully!';
				clearSuccessMessage();
			} else {
				const errorData = await response.json();
				error = errorData.error || 'Failed to update user role';
			}
		} catch (err) {
			error = 'An error occurred while updating user role';
		}
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

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>Admin Panel - Auth App</title>
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
			<div class="text-center mb-12 animate-slide-in">
				<h1 class="text-4xl md:text-6xl font-bold text-white mb-4">
					Admin
					<span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Panel
					</span>
				</h1>
				<p class="text-xl text-gray-300 max-w-3xl mx-auto">
					Manage users, monitor system performance, and oversee application analytics.
				</p>
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

			<!-- Stats Cards -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
				<div class="analytics-card animate-fade-in" style="animation-delay: 0.1s;">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-gray-400 text-sm">Total Users</p>
							<p class="text-3xl font-bold text-white">{stats.totalUsers}</p>
						</div>
						<div class="text-3xl animate-pulse">👥</div>
					</div>
				</div>

				<div class="analytics-card animate-fade-in" style="animation-delay: 0.2s;">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-gray-400 text-sm">Verified Users</p>
							<p class="text-3xl font-bold text-white">{stats.verifiedUsers}</p>
						</div>
						<div class="text-3xl animate-pulse">✅</div>
					</div>
				</div>

				<div class="analytics-card animate-fade-in" style="animation-delay: 0.3s;">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-gray-400 text-sm">Admin Users</p>
							<p class="text-3xl font-bold text-white">{stats.adminUsers}</p>
						</div>
						<div class="text-3xl animate-pulse">👑</div>
					</div>
				</div>

				<div class="analytics-card animate-fade-in" style="animation-delay: 0.4s;">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-gray-400 text-sm">Regular Users</p>
							<p class="text-3xl font-bold text-white">{stats.regularUsers}</p>
						</div>
						<div class="text-3xl animate-pulse">👤</div>
					</div>
				</div>
			</div>

			<!-- Analytics Charts -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
				<div class="dark-card animate-fade-in" style="animation-delay: 0.5s;">
					<h3 class="text-xl font-semibold text-white mb-4">User Growth (Last 12 Months)</h3>
					<div class="chart-container">
						<div class="bar-chart">
							{#each analyticsData.userGrowth as value, i}
								<div 
									class="bar" 
									style="height: {(value / 40) * 100}%; width: 8%;"
								></div>
							{/each}
						</div>
					</div>
				</div>

				<div class="dark-card animate-fade-in" style="animation-delay: 0.6s;">
					<h3 class="text-xl font-semibold text-white mb-4">Verification Rate Trend</h3>
					<div class="chart-container">
						<svg class="w-full h-full" viewBox="0 0 100 30">
							<path 
								class="line-path"
								d="M 0,{30 - (analyticsData.verificationRate[0] / 100) * 30} 
									L 8,{30 - (analyticsData.verificationRate[1] / 100) * 30} 
									L 16,{30 - (analyticsData.verificationRate[2] / 100) * 30} 
									L 24,{30 - (analyticsData.verificationRate[3] / 100) * 30} 
									L 32,{30 - (analyticsData.verificationRate[4] / 100) * 30} 
									L 40,{30 - (analyticsData.verificationRate[5] / 100) * 30} 
									L 48,{30 - (analyticsData.verificationRate[6] / 100) * 30}
									L 56,{30 - (analyticsData.verificationRate[7] / 100) * 30}
									L 64,{30 - (analyticsData.verificationRate[8] / 100) * 30}
									L 72,{30 - (analyticsData.verificationRate[9] / 100) * 30}
									L 80,{30 - (analyticsData.verificationRate[10] / 100) * 30}
									L 88,{30 - (analyticsData.verificationRate[11] / 100) * 30}"
								fill="none"
							/>
						</svg>
					</div>
				</div>
			</div>

			<!-- User Management Section -->
			<div class="dark-card animate-fade-in" style="animation-delay: 0.7s;">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-2xl font-semibold text-white">User Management</h3>
					{#if loading}
						<div class="loading-robot">🤖</div>
					{/if}
				</div>

				{#if users.length > 0}
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b border-white/10">
									<th class="text-left py-3 px-4 text-gray-300 font-medium">User</th>
									<th class="text-left py-3 px-4 text-gray-300 font-medium">Email</th>
									<th class="text-left py-3 px-4 text-gray-300 font-medium">Role</th>
									<th class="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
									<th class="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each users as userItem}
									<tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
										<td class="py-3 px-4">
											<div class="flex items-center">
												<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
													{userItem.name ? userItem.name.charAt(0).toUpperCase() : 'U'}
												</div>
												<span class="text-white">{userItem.name || 'Unknown'}</span>
											</div>
										</td>
										<td class="py-3 px-4 text-gray-300">{userItem.email}</td>
										<td class="py-3 px-4">
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userItem.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}">
												{userItem.role === 'admin' ? '👑 Admin' : '👤 User'}
											</span>
										</td>
										<td class="py-3 px-4">
											<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {userItem.emailVerified ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}">
												{userItem.emailVerified ? '✅ Verified' : '⏳ Pending'}
											</span>
										</td>
										<td class="py-3 px-4">
											<select
												value={userItem.role}
												on:change={(e) => updateUserRole(userItem.id, e.target.value)}
												class="dark-input text-sm"
											>
												<option value="user">User</option>
												<option value="admin">Admin</option>
											</select>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="text-center py-12">
						<div class="text-4xl mb-4 animate-float">👥</div>
						<p class="text-gray-400">No users found</p>
					</div>
				{/if}
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
