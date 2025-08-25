<script lang="ts">
	export let user: any;
	export let openChangePasswordModal: () => void;
	export let gotoChat: () => void;
	export let gotoAdmin: () => void;
</script>

<div class="lg:col-span-1 space-y-6">
	<div class="bg-white shadow-lg rounded-xl overflow-hidden">
		<div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
			<h3 class="text-lg font-semibold text-gray-900 flex items-center">
				<span class="mr-2">📊</span>
				Account Overview
			</h3>
		</div>
		<div class="p-6 space-y-4">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Account Type</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
					{user?.role === 'admin' ? '👑 Admin' : '👤 User'}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Email Status</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
					{user?.emailVerified ? '✅ Verified' : '⏳ Pending'}
				</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">Auth Method</span>
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					{user?.password ? '🔑 Password' : '🔗 OAuth'}
				</span>
			</div>
		</div>
	</div>

	<div class="bg-white shadow-lg rounded-xl overflow-hidden">
		<div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
			<h3 class="text-lg font-semibold text-gray-900 flex items-center">
				<span class="mr-2">⚡</span>
				Quick Actions
			</h3>
		</div>
		<div class="p-6 space-y-3">
			<button on:click={openChangePasswordModal} class="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
				<div class="flex items-center">
					<span class="text-blue-600 mr-3">🔑</span>
					<span class="text-sm font-medium text-blue-900">Change Password</span>
				</div>
				<span class="text-blue-400 group-hover:text-blue-600">→</span>
			</button>
			<button on:click={gotoChat} class="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors group">
				<div class="flex items-center">
					<span class="text-indigo-600 mr-3">🤖</span>
					<span class="text-sm font-medium text-indigo-900">AI Chat</span>
				</div>
				<span class="text-indigo-400 group-hover:text-indigo-600">→</span>
			</button>
			{#if user?.role === 'admin'}
				<button on:click={gotoAdmin} class="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors group">
					<div class="flex items-center">
						<span class="text-purple-600 mr-3">👑</span>
						<span class="text-sm font-medium text-purple-900">Admin Panel</span>
					</div>
					<span class="text-purple-400 group-hover:text-purple-600">→</span>
				</button>
			{/if}
		</div>
	</div>

	<div class="bg-white shadow-lg rounded-xl overflow-hidden border border-red-200">
		<div class="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-200">
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


