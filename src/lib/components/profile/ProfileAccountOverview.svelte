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

<div class="overflow-hidden bg-white/80 backdrop-blur-sm shadow-xl rounded-xl border border-indigo-200/50">
	<div class="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-200/50">
		<h3 class="text-lg leading-6 font-semibold text-gray-900 flex items-center">
			<svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
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
						<svg class="w-4 h-4 mr-2 inline text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						Full Name
					</label>
					<div class="relative">
											<input type="text" name="name" id="name" bind:value={name} placeholder="Enter your full name" class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-400 focus:ring-indigo-400 transition-colors duration-200 pl-4 pr-4 py-3" />
					{#if name.trim()}
						<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
							<span class="text-indigo-500">✓</span>
						</div>
					{/if}
					</div>
				</div>

				<div class="sm:col-span-4">
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						<svg class="w-4 h-4 mr-2 inline text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Email Address
					</label>
					<div class="relative">
						<input type="email" name="email" id="email" value={email} disabled class="block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm pl-4 pr-10 py-3 cursor-not-allowed" />
						<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
							<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</div>
					</div>
					<p class="mt-2 text-sm text-gray-500 flex items-center">
						<svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Email address cannot be changed for security reasons
					</p>
				</div>

				<div class="sm:col-span-4">
					<div class="block text-sm font-medium text-gray-700 mb-2">
						<svg class="w-4 h-4 mr-2 inline text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
						</svg>
						Account Status
					</div>
					<div class="mt-1">
						<div class="flex items-center p-3 rounded-lg {user?.emailVerified ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}">
							<svg class="w-5 h-5 mr-2 {user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								{#if user?.emailVerified}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								{:else}
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								{/if}
							</svg>
							<div>
								<span class="text-sm font-medium {user?.emailVerified ? 'text-green-800' : 'text-yellow-800'}">{user?.emailVerified ? 'Email Verified' : 'Pending Verification'}</span>
								<p class="text-xs {user?.emailVerified ? 'text-green-600' : 'text-yellow-600'}">{user?.emailVerified ? 'Your email has been confirmed' : 'Please check your email for verification link'}</p>
							</div>
						</div>
					</div>
				</div>

				<div class="sm:col-span-4">
					<div class="block text-sm font-medium text-gray-700 mb-2">
						<svg class="w-4 h-4 mr-2 inline text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
						</svg>
						Account Role
					</div>
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
					<button type="submit" disabled={saving || !name?.trim?.()} class="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-400 to-violet-400 px-6 py-2 text-sm font-medium text-white shadow-lg hover:from-indigo-500 hover:to-violet-500 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
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


