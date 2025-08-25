<script lang="ts">
	export let user: { id: string; role: string; name?: string | null; email?: string | null } | null = null;
	export let currentPage: string = '';

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
		} catch (e) {
			// ignore errors; we'll still redirect
		} finally {
			window.location.assign('/');
		}
	}

	function isCurrentPage(page: string): boolean {
		return currentPage === page;
	}

	function getNavClass(page: string): string {
		return isCurrentPage(page)
			? 'border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
			: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium';
	}
</script>

<nav class="bg-white shadow">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<div class="flex flex-shrink-0 items-center">
					<a href="/" class="text-xl font-bold text-gray-900 hover:text-gray-700">Auth App</a>
				</div>
				{#if user}
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a href="/dashboard" class={getNavClass('dashboard')}>Dashboard</a>
						<a href="/chat" class={getNavClass('chat')}>AI Chat</a>
						<a href="/profile" class={getNavClass('profile')}>Profile</a>
						{#if user?.role === 'admin'}
							<a href="/admin" class={getNavClass('admin')}>Admin Panel</a>
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex items-center">
				{#if user}
					<div class="ml-3">
						<div class="flex items-center space-x-4">
							<span class="text-sm text-gray-700">
								{user?.role === 'admin' ? 'Admin: ' : 'Welcome, '}{user?.name || user?.email}
							</span>
							<button
								on:click={handleSignOut}
								class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
							>
								Sign Out
							</button>
						</div>
					</div>
				{:else}
					<div class="flex items-center space-x-4">
						<a href="/auth/signin" class="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Sign In</a>
						<a href="/auth/signup" class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Sign Up</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
