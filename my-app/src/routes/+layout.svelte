<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	let { children, data } = $props<{ data: { user: any } }>();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16">
			<div class="flex items-center">
				<a href="/" class="flex items-center space-x-2">
					<span class="text-2xl">🚀</span>
					<span class="text-xl font-bold text-gray-900">MyApp</span>
				</a>
			</div>
			
			<div class="flex items-center space-x-4">
				{#if data.user}
					<a 
						href="/chat" 
						class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						🤖 Chat
					</a>
					<a 
						href="/profile" 
						class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						👤 Profile
					</a>
					{#if data.user.role === 'admin'}
						<a 
							href="/admin" 
							class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
						>
							🔐 Admin
						</a>
					{/if}
					<form method="POST" action="/logout" class="inline">
						<button 
							type="submit" 
							class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
						>
							🚪 Logout
						</button>
					</form>
				{:else}
					<a 
						href="/login" 
						class="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
					>
						🔐 Login
					</a>
					<a 
						href="/signup" 
						class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
					>
						📝 Sign Up
					</a>
				{/if}
			</div>
		</div>
	</div>
</nav>

<main>
	{@render children()}
</main>

<!-- Theme Switcher for testing -->
<ThemeSwitcher />
