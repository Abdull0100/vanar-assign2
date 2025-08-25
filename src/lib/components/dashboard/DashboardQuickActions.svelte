<script lang="ts">
	import { goto } from '$app/navigation';

	export let isAdmin: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

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

	<!-- Admin Panel or Role Card -->
	{#if isAdmin}
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


