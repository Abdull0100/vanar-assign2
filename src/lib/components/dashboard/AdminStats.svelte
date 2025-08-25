<script lang="ts">
	export let stats: { totalUsers: number; adminUsers: number; totalMessages: number; systemStatus: string } = {
		totalUsers: 0,
		adminUsers: 0,
		totalMessages: 0,
		systemStatus: 'online'
	};
	export let loading: boolean = false;
</script>

<div class="mt-8 animate-fade-in" style="animation-delay: 0.4s">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">System Overview</h2>
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-float group" style="animation-delay: 0.5s">
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.1)_0%,transparent_50%)] transition-all duration-500 rounded-xl"></div>
			<div class="flex items-center relative z-10">
				<div class="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative">
					<!-- Glowing effect -->
					<div class="absolute inset-0 rounded-lg bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
					<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
					</svg>
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
		<div class="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-float group" style="animation-delay: 0.6s">
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.1)_0%,transparent_50%)] transition-all duration-500 rounded-xl"></div>
			<div class="flex items-center relative z-10">
				<div class="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative">
					<!-- Glowing effect -->
					<div class="absolute inset-0 rounded-lg bg-green-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
					<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
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
		<div class="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-float group" style="animation-delay: 0.7s">
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.1)_0%,transparent_50%)] transition-all duration-500 rounded-xl"></div>
			<div class="flex items-center relative z-10">
				<div class="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative">
					<!-- Glowing effect -->
					<div class="absolute inset-0 rounded-lg bg-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
					<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
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
		<div class="rounded-xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-float group" style="animation-delay: 0.8s">
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(234,179,8,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_30%_70%,rgba(234,179,8,0.1)_0%,transparent_50%)] transition-all duration-500 rounded-xl"></div>
			<div class="flex items-center relative z-10">
				<div class="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative">
					<!-- Glowing effect -->
					<div class="absolute inset-0 rounded-lg bg-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
					<svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
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

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out forwards;
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}
</style>
