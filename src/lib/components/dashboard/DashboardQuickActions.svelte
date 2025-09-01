<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Bot, User as UserIcon, ShieldCheck, BarChart3 } from '@lucide/svelte';

	export let isAdmin: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="mt-8 grid gap-6 font-sans sm:grid-cols-2 lg:grid-cols-3">
	<!-- AI Chat Card -->
	<Card.Root
		class="group relative overflow-hidden border bg-card text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
	>
		<div
			class="absolute inset-0 from-primary/10 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100"
		></div>
		<Card.Content class="relative z-10 p-6">
			<div class="mb-4 flex items-center">
				<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15">
					<Bot class="h-6 w-6 text-primary" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">AI Assistant</h3>
					<p class="text-sm text-muted-foreground">Powered by Gemini</p>
				</div>
			</div>
			<p class="mb-4 text-muted-foreground">
				Chat with our intelligent AI assistant for help, creativity, and problem-solving.
			</p>
			<button
				on:click={() => navigateTo('/chat')}
				class="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground shadow transition-shadow transition-transform duration-200
				       hover:scale-[1.03] hover:shadow-lg active:scale-95 active:shadow-inner"
			>
				Start Conversation
			</button>
		</Card.Content>
	</Card.Root>

	<!-- Profile Card -->
	<Card.Root
		class="group relative overflow-hidden border bg-card text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
	>
		<div
			class="absolute inset-0 from-secondary/10 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100"
		></div>
		<Card.Content class="relative z-10 p-6">
			<div class="mb-4 flex items-center">
				<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/30">
					<UserIcon class="h-6 w-6 text-secondary-foreground" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Profile Settings</h3>
					<p class="text-sm text-muted-foreground">Manage account</p>
				</div>
			</div>
			<p class="mb-4 text-muted-foreground">
				Update your profile information, change password, and manage account settings.
			</p>
			<button
				on:click={() => navigateTo('/profile')}
				class="w-full rounded-lg bg-secondary px-4 py-3 font-medium text-secondary-foreground shadow transition-shadow transition-transform duration-200
				       hover:scale-[1.03] hover:shadow-lg active:scale-95 active:shadow-inner"
			>
				Edit Profile
			</button>
		</Card.Content>
	</Card.Root>

	<!-- Admin Panel or Role Card -->
	{#if isAdmin}
		<Card.Root
			class="group relative overflow-hidden border bg-card text-card-foreground transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
		>
			<div
				class="absolute inset-0 from-accent/10 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100"
			></div>
			<Card.Content class="relative z-10 p-6">
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
						<ShieldCheck class="h-6 w-6 text-accent" />
					</div>
					<div>
						<h3 class="text-lg font-semibold">Admin Dashboard</h3>
						<p class="text-sm text-muted-foreground">System management</p>
					</div>
				</div>
				<p class="mb-4 text-muted-foreground">
					Access administrative tools, manage users, and view system analytics.
				</p>
				<button
					on:click={() => navigateTo('/admin')}
					class="w-full rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground shadow transition-shadow transition-transform duration-200
					       hover:scale-[1.03] hover:shadow-lg active:scale-95 active:shadow-inner"
				>
					Open Admin Panel
				</button>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="group relative overflow-hidden border bg-card text-card-foreground">
			<Card.Content class="relative z-10 p-6">
				<div class="mb-4 flex items-center">
					<div class="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
						<BarChart3 class="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<h3 class="text-lg font-semibold">Your Role</h3>
						<p class="text-sm text-muted-foreground">Current access level</p>
					</div>
				</div>
				<p class="mb-4 text-muted-foreground">
					You have standard user access. Contact an administrator for role upgrades.
				</p>
				<div class="w-full rounded-lg bg-muted px-4 py-3 text-center font-medium text-foreground">
					Standard User
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
