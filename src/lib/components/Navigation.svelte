<script lang="ts">
	import { goto } from '$app/navigation';
	import { signOut } from '@auth/sveltekit/client';

	  export let user: { id: string; role: string; name?: string; email?: string } | null = null;
	export let currentPage: string = '';

	async function handleSignOut() {
		await signOut({ redirectTo: '/' });
	}

	function navigateTo(path: string) {
		goto(path);
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
					<button
						on:click={() => navigateTo('/')}
						class="text-xl font-bold text-gray-900 hover:text-gray-700"
					>
						Auth App
					</button>
				</div>
				{#if user}
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<button on:click={() => navigateTo('/dashboard')} class={getNavClass('dashboard')}>
							Dashboard
						</button>
						<button on:click={() => navigateTo('/chat')} class={getNavClass('chat')}>
							AI Chat
						</button>
						<button on:click={() => navigateTo('/profile')} class={getNavClass('profile')}>
							Profile
						</button>
						{#if user?.role === 'admin'}
							<button on:click={() => navigateTo('/admin')} class={getNavClass('admin')}>
								Admin Panel
							</button>
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
						<button
							on:click={() => navigateTo('/auth/signin')}
							class="rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
						>
							Sign In
						</button>
						<button
							on:click={() => navigateTo('/auth/signup')}
							class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
						>
							Sign Up
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</nav>
