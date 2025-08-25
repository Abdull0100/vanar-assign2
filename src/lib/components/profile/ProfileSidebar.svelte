<script lang="ts">
	export let user: any;
	export let openChangePasswordModal: () => void;
	export let gotoChat: () => void;
	export let gotoAdmin: () => void;
</script>

<div class="lg:col-span-1 space-y-6">
	<div class="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-indigo-200/50">
		<div class="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-200/50">
			<h3 class="text-lg font-semibold text-gray-900 flex items-center">
				<span class="mr-2">📊</span>
				Account Overview
			</h3>
		</div>
		<div class="p-6 space-y-4">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Account Type</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
					{user?.role === 'admin' ? 'Admin' : 'User'}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Email Status</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
					{user?.emailVerified ? 'Verified' : 'Pending'}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Auth Method</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					{user?.password ? 'Password' : 'OAuth'}
				</span>
			</div>
		</div>
	</div>

	<div class="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-indigo-200/50">
		<div class="bg-gradient-to-r from-violet-50 to-pink-50 px-6 py-4 border-b border-indigo-200/50">
			<h3 class="text-lg font-semibold text-gray-900 flex items-center">
				<span class="mr-2">⚡</span>
				Quick Actions
			</h3>
		</div>
		<div class="p-6 space-y-3">
			<button on:click={openChangePasswordModal} class="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
				<div class="flex items-center">
					<svg class="w-4 h-4 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
					</svg>
					<span class="text-sm font-medium text-blue-900">Change Password</span>
				</div>
				<span class="text-blue-400 group-hover:text-blue-600">→</span>
			</button>
			<button on:click={gotoChat} class="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors group">
				<div class="flex items-center">
					<svg class="w-4 h-4 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
					<span class="text-sm font-medium text-indigo-900">AI Chat</span>
				</div>
				<span class="text-indigo-400 group-hover:text-indigo-600">→</span>
			</button>
			{#if user?.role === 'admin'}
				<button on:click={gotoAdmin} class="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group">
									<div class="flex items-center">
					<svg class="w-4 h-4 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
					<span class="text-sm font-medium text-purple-900">Admin Panel</span>
				</div>
					<span class="text-purple-400 group-hover:text-purple-600">→</span>
				</button>
			{/if}
		</div>
	</div>

	<div class="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-red-200/50">
		<div class="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200/50">
			<h3 class="text-lg font-semibold text-red-900 flex items-center">
				<span class="mr-2">⚠️</span>
				Danger Zone
			</h3>
		</div>
		<div class="p-6">
			<slot name="danger"></slot>
		</div>
	</div>
</div>


