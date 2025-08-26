<script lang="ts">
	import { goto } from '$app/navigation';

	export let isAdmin: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="mt-8 grid gap-6 grid-cols-1 animate-fade-in">
	<!-- AI Chat Card -->
	<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-float" style="animation-delay: 0.1s">
		<div class="absolute inset-0 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<!-- Animated background pattern -->
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.1)_0%,transparent_50%)] transition-all duration-500"></div>
		<!-- Floating particles -->
		<div class="absolute top-2 right-2 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
		<div class="absolute bottom-2 left-2 w-1 h-1 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" style="animation-delay: 0.5s"></div>
		<div class="relative z-10">
			<div class="flex items-center mb-4">
				<div class="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
					<svg class="w-6 h-6 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">AI Assistant</h3>
					<p class="text-sm text-gray-500">Powered by Gemini</p>
				</div>
			</div>
			<p class="text-gray-600 mb-4">Chat with our intelligent AI assistant for help, creativity, and problem-solving.</p>
			<button
				on:click={() => navigateTo('/chat')}
				class="w-full rounded-xl bg-gradient-to-r from-indigo-400 to-blue-500 px-6 py-4 text-white font-semibold hover:from-indigo-500 hover:to-blue-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group-hover:animate-pulse border-0 focus:outline-none focus:ring-4 focus:ring-indigo-300/50"
			>
				<div class="flex items-center justify-center space-x-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span>Start Conversation</span>
				</div>
			</button>
		</div>
	</div>

	<!-- Profile Card -->
	<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md border border-violet-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-float" style="animation-delay: 0.2s">
		<div class="absolute inset-0 bg-gradient-to-r from-violet-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<!-- Animated background pattern -->
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%)] transition-all duration-500"></div>
		<!-- Floating particles -->
		<div class="absolute top-2 left-2 w-1 h-1 bg-violet-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
		<div class="absolute bottom-2 right-2 w-1 h-1 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" style="animation-delay: 0.5s"></div>
		<div class="relative z-10">
			<div class="flex items-center mb-4">
				<div class="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
					<svg class="w-6 h-6 text-violet-600 group-hover:text-violet-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900">Profile Settings</h3>
					<p class="text-sm text-gray-500">Manage account</p>
				</div>
			</div>
			<p class="text-gray-600 mb-4">Update your profile information, change password, and manage account settings.</p>
			<button
				on:click={() => navigateTo('/profile')}
				class="w-full rounded-xl bg-gradient-to-r from-violet-400 to-purple-500 px-6 py-4 text-white font-semibold hover:from-violet-500 hover:to-purple-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group-hover:animate-pulse border-0 focus:outline-none focus:ring-4 focus:ring-violet-300/50"
			>
				<div class="flex items-center justify-center space-x-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					<span>Edit Profile</span>
				</div>
			</button>
		</div>
	</div>

	<!-- Admin Panel or Role Card -->
	{#if isAdmin}
		<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-md border border-pink-100 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 animate-float" style="animation-delay: 0.3s">
			<div class="absolute inset-0 bg-gradient-to-r from-pink-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.1)_0%,transparent_50%)] transition-all duration-500"></div>
			<!-- Floating particles -->
			<div class="absolute top-2 right-2 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
			<div class="absolute bottom-2 left-2 w-1 h-1 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" style="animation-delay: 0.5s"></div>
			<div class="relative z-10">
				<div class="flex items-center mb-4">
					<div class="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
						<svg class="w-6 h-6 text-pink-600 group-hover:text-pink-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Admin Dashboard</h3>
						<p class="text-sm text-gray-500">System management</p>
					</div>
				</div>
				<p class="text-gray-600 mb-4">Access administrative tools, manage users, and view system analytics.</p>
				<button
					on:click={() => navigateTo('/admin')}
					class="w-full rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 px-6 py-4 text-white font-semibold hover:from-pink-500 hover:to-rose-600 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group-hover:animate-pulse border-0 focus:outline-none focus:ring-4 focus:ring-pink-300/50"
				>
					<div class="flex items-center justify-center space-x-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						<span>Open Admin Panel</span>
					</div>
				</button>
			</div>
		</div>
	{:else}
		<div class="group relative overflow-hidden rounded-xl bg-white p-6 shadow-lg animate-float" style="animation-delay: 0.3s">
			<!-- Animated background pattern -->
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(107,114,128,0.05)_0%,transparent_50%)] group-hover:bg-[radial-gradient(circle_at_30%_70%,rgba(107,114,128,0.1)_0%,transparent_50%)] transition-all duration-500"></div>
			<!-- Floating particles -->
			<div class="absolute top-2 left-2 w-1 h-1 bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500"></div>
			<div class="absolute bottom-2 right-2 w-1 h-1 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" style="animation-delay: 0.5s"></div>
			<div class="relative z-10">
				<div class="flex items-center mb-4">
					<div class="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mr-4 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
						<svg class="w-6 h-6 text-gray-600 group-hover:text-gray-700 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-gray-900">Your Role</h3>
						<p class="text-sm text-gray-500">Current access level</p>
					</div>
				</div>
				<p class="text-gray-600 mb-4">You have standard user access. Contact an administrator for role upgrades.</p>
				<div class="w-full rounded-xl bg-gradient-to-r from-gray-400 to-slate-500 px-6 py-4 text-white font-semibold text-center shadow-lg border-0">
					<div class="flex items-center justify-center space-x-2">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						<span>Standard User</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
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
			transform: translateY(-5px);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.8s ease-out forwards;
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}

	/* Stagger animation delays for cards */
	.animate-float:nth-child(1) { animation-delay: 0.1s; }
	.animate-float:nth-child(2) { animation-delay: 0.2s; }
	.animate-float:nth-child(3) { animation-delay: 0.3s; }
</style>


