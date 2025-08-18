<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children, data } = $props<{ data: { user: any } }>();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex items-center space-x-8">
				<a href="/" class="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
					MyApp
				</a>
				<div class="hidden md:flex space-x-6">
					<a 
						href="/chat" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors {$page.url.pathname === '/chat' 
							? 'bg-purple-100 text-purple-700' 
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						🤖 AI Chat
					</a>

					<a 
						href="/profile" 
						class="px-3 py-2 rounded-md text-sm font-medium transition-colors {$page.url.pathname === '/profile' 
							? 'bg-blue-100 text-blue-700' 
							: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
					>
						Profile
					</a>
					{#if data.user?.role === 'admin'}
						<a 
							href="/admin" 
							class="px-3 py-2 rounded-md text-sm font-medium transition-colors {$page.url.pathname === '/admin' 
								? 'bg-red-100 text-red-700' 
								: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}"
						>
							Admin
						</a>
					{/if}
				</div>
			</div>
			<div class="flex items-center space-x-4">
				<!-- Mobile AI Chat Link -->
				<a 
					href="/chat" 
					class="md:hidden px-3 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
				>
					🤖 Chat
				</a>
				<a 
					href="/auth/logout" 
					class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
				>
					Logout
				</a>
			</div>
		</div>
	</div>
</nav>

<main class="min-h-screen bg-gray-50">
	{@render children?.()}
</main>
