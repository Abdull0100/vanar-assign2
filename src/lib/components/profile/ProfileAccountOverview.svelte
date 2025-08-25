<script lang="ts">
	export let user: any;
	export let name: string;
	export let email: string;
	export let error: string;
	export let success: string;
	export let saving: boolean;
	export let onSubmit: () => void;

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit?.();
	}
</script>

<div class="overflow-hidden bg-white shadow-lg rounded-xl">
	<div class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
		<h3 class="text-lg leading-6 font-semibold text-gray-900 flex items-center">
			<span class="mr-2">👤</span>
			Personal Information
		</h3>
		<p class="mt-1 text-sm text-gray-600">Update your profile details and contact information</p>
	</div>

	{#if error}
		<div class="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center">
			<span class="text-red-600 mr-2">⚠️</span>
			<span class="text-red-700">{error}</span>
		</div>
	{/if}

	{#if success}
		<div class="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center">
			<span class="text-green-600 mr-2">✅</span>
			<span class="text-green-700">{success}</span>
		</div>
	{/if}

	<div class="border-t border-gray-200 px-4 py-5 sm:px-6">
		<form on:submit={handleSubmit}>
			<div class="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-6">
				<div class="sm:col-span-4">
					<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
						<span class="mr-2">👤</span>
						Full Name
					</label>
					<div class="relative">
						<input type="text" name="name" id="name" bind:value={name} placeholder="Enter your full name" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 transition-colors duration-200 pl-4 pr-4 py-3" />
						{#if name.trim()}
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
								<span class="text-green-500">✓</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="sm:col-span-4">
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						<span class="mr-2">📧</span>
						Email Address
					</label>
					<div class="relative">
						<input type="email" name="email" id="email" value={email} disabled class="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm pl-4 pr-10 py-3 cursor-not-allowed" />
						<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
							<span class="text-gray-400">🔒</span>
						</div>
					</div>
					<p class="mt-2 text-sm text-gray-500 flex items-center">
						<span class="mr-1">ℹ️</span>
						Email address cannot be changed for security reasons
					</p>
				</div>

				<div class="sm:col-span-4">
					<div class="block text-sm font-medium text-gray-700 mb-2"><span class="mr-2">📊</span>Account Status</div>
					<div class="mt-1">
						<div class="flex items-center p-3 rounded-lg {user?.emailVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
							<span class="mr-2 text-lg">{user?.emailVerified ? '✅' : '⏳'}</span>
							<div>
								<span class="text-sm font-medium {user?.emailVerified ? 'text-green-800' : 'text-yellow-800'}">{user?.emailVerified ? 'Email Verified' : 'Pending Verification'}</span>
								<p class="text-xs {user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}">{user?.emailVerified ? 'Your email has been confirmed' : 'Please check your email for verification link'}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="sm:col-span-4">
					<div class="block text-sm font-medium text-gray-700 mb-2"><span class="mr-2">🎭</span>Account Role</div>
					<div class="mt-1">
						<div class="flex items-center p-3 rounded-lg {user?.role === 'admin' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}">
							<span class="mr-2 text-lg">{user?.role === 'admin' ? '👑' : '👤'}</span>
							<div>
								<span class="text-sm font-medium {user?.role === 'admin' ? 'text-purple-800' : 'text-blue-800'}">{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</span>
								<p class="text-xs {user?.role === 'admin' ? 'text-purple-600' : 'text-blue-600'}">{user?.role === 'admin' ? 'Full system access and user management' : 'Standard user privileges'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="pt-6">
				<div class="flex justify-end space-x-3">
					<slot name="actions"></slot>
					<button type="submit" disabled={saving || !name?.trim?.()} class="inline-flex items-center rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-lg hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
						{#if saving}
							<div class="h-4 w-4 animate-spin rounded-full border-b-2 border-white mr-2"></div>
							Saving...
						{:else}
							<span class="mr-2">💾</span>
							Save Changes
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>


