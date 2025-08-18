<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	interface User {
		id: string;
		name: string | null;
		email: string;
		role: string;
		verified: boolean;
		disabled: boolean;
		provider: string | null;
		createdAt: Date;
	}

	interface Stats {
		totalUsers: number;
		activeUsers: number;
		adminUsers: number;
		regularUsers: number;
	}

	let { data, form } = $props<{ 
		data: { 
			user: any; 
			users: User[]; 
			stats: Stats;
		};
		form?: any;
	}>();

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function getStatusBadge(user: User) {
		if (user.disabled) {
			return '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Disabled</span>';
		}
		return '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>';
	}

	function getRoleBadge(role: string) {
		if (role === 'admin') {
			return '<span class="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Admin</span>';
		}
		return '<span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">User</span>';
	}

	function getProviderBadge(provider: string | null) {
		if (!provider) return '';
		if (provider === 'google') {
			return '<span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Google</span>';
		}
		if (provider === 'github') {
			return '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">GitHub</span>';
		}
		return '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Email</span>';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Admin Dashboard 🔐</h1>
					<p class="text-gray-600 mt-2">Welcome back, {data.user.name}! Manage your application users and view analytics.</p>
				</div>
				<div class="flex items-center space-x-4">
					<a 
						href="/chat" 
						class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
					>
						Back to Chat
					</a>
				</div>
			</div>
		</div>

		<!-- Statistics Cards -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
			<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
				<div class="flex items-center">
					<div class="p-3 bg-blue-100 rounded-lg">
						<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Total Users</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.totalUsers}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
				<div class="flex items-center">
					<div class="p-3 bg-green-100 rounded-lg">
						<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Active Users</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.activeUsers}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
				<div class="flex items-center">
					<div class="p-3 bg-purple-100 rounded-lg">
						<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Admins</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.adminUsers}</p>
					</div>
				</div>
			</div>

			<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
				<div class="flex items-center">
					<div class="p-3 bg-orange-100 rounded-lg">
						<svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<div class="ml-4">
						<p class="text-sm font-medium text-gray-600">Regular Users</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.regularUsers}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Success/Error Messages -->
		{#if form?.success}
			<div class="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-green-800 font-medium">{form.message}</p>
				</div>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex items-center">
					<svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-red-800 font-medium">{form.error}</p>
				</div>
			</div>
		{/if}

		<!-- Users Table -->
		<div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-xl font-semibold text-gray-900">User Management</h2>
				<p class="text-gray-600 mt-1">Manage user accounts, roles, and status</p>
			</div>

			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						{#each data.users as user}
							<tr class="hover:bg-gray-50">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div class="flex-shrink-0 h-10 w-10">
											<div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
												<span class="text-white font-medium text-sm">
													{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
												</span>
											</div>
										</div>
										<div class="ml-4">
											<div class="text-sm font-medium text-gray-900">{user.name || 'No name'}</div>
											<div class="text-sm text-gray-500">{user.email}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{@html getRoleBadge(user.role)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{@html getStatusBadge(user)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{@html getProviderBadge(user.provider)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">
										{#if user.verified}
											<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">✓ Verified</span>
										{:else}
											<span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">⏳ Pending</span>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{formatDate(user.createdAt)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
									<!-- Role Toggle -->
									<form method="POST" action="?/updateUserRole" use:enhance class="inline">
										<input type="hidden" name="userId" value={user.id} />
										<input type="hidden" name="role" value={user.role === 'admin' ? 'user' : 'admin'} />
										<button 
											type="submit"
											class="px-3 py-1 text-xs font-medium rounded-md transition-colors {user.role === 'admin' 
												? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
												: 'bg-purple-100 text-purple-800 hover:bg-purple-200'}"
										>
											{user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
										</button>
									</form>

									<!-- Status Toggle -->
									<form method="POST" action="?/toggleUserStatus" use:enhance class="inline">
										<input type="hidden" name="userId" value={user.id} />
										<input type="hidden" name="currentStatus" value={user.disabled.toString()} />
										<button 
											type="submit"
											class="px-3 py-1 text-xs font-medium rounded-md transition-colors {user.disabled 
												? 'bg-green-100 text-green-800 hover:bg-green-200' 
												: 'bg-red-100 text-red-800 hover:bg-red-200'}"
										>
											{user.disabled ? 'Enable' : 'Disable'}
										</button>
									</form>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
