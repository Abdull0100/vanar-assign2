<script lang="ts">
	export let stats: { totalUsers: number; adminUsers: number; totalMessages: number; systemStatus: string } = {
		totalUsers: 0,
		adminUsers: 0,
		totalMessages: 0,
		systemStatus: 'online'
	};
	export let loading: boolean = false;
</script>

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
						{#if loading}
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
						{#if loading}
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
						{#if loading}
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
						{#if loading}
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


