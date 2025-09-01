<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import { goto } from '$app/navigation';
	export let user: {
		id: string;
		role: string;
		name?: string | null;
		email?: string | null;
	} | null = null;
	export let currentPage: string = '';

	async function handleSignOut() {
		try {
			await fetch('/api/auth/signout', { method: 'POST' });
		} catch (e) {
			// ignore errors; we'll still redirect
		} finally {
			goto('/');
		}
	}

	function isCurrentPage(page: string): boolean {
		return currentPage === page;
	}

	function getNavClass(page: string): string {
		return isCurrentPage(page)
			? 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-primary text-foreground'
			: 'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-muted-foreground hover:text-foreground hover:border-border';
	}
</script>

<nav class="border-b border-border bg-background font-sans">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 justify-between">
			<div class="flex">
				<div class="flex flex-shrink-0 items-center">
					<a href="/" class="text-xl font-bold text-foreground hover:text-muted-foreground"
						>Auth App</a
					>
				</div>
				{#if user}
					<div class="hidden sm:ml-6 sm:flex sm:space-x-8">
						<a
							href="/dashboard"
							class={getNavClass('dashboard')}
							aria-current={isCurrentPage('dashboard') ? 'page' : undefined}>Dashboard</a
						>
						<a
							href="/chat"
							class={getNavClass('chat')}
							aria-current={isCurrentPage('chat') ? 'page' : undefined}>AI Chat</a
						>
						<a
							href="/profile"
							class={getNavClass('profile')}
							aria-current={isCurrentPage('profile') ? 'page' : undefined}>Profile</a
						>
						{#if user?.role === 'admin'}
							<a
								href="/admin"
								class={getNavClass('admin')}
								aria-current={isCurrentPage('admin') ? 'page' : undefined}>Admin Panel</a
							>
						{/if}
					</div>
				{/if}
			</div>
			<div class="flex items-center">
				<div class="flex items-center space-x-2">
					<DarkModeToggle />
					{#if user}
						<div class="ml-1">
							<div class="flex items-center space-x-4">
								<span class="text-sm text-muted-foreground">
									{user?.role === 'admin' ? 'Admin: ' : 'Welcome, '}{user?.name || user?.email}
								</span>
								<Button variant="destructive" type="button" onclick={handleSignOut}>
									Sign Out
								</Button>
							</div>
						</div>
					{:else}
						<div class="flex items-center space-x-2">
							<Button href="/auth/signin" variant="ghost">Sign In</Button>
							<Button href="/auth/signup">Sign Up</Button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</nav>
