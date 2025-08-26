<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Bot, User as UserIcon, ShieldCheck, BarChart3 } from '@lucide/svelte';

	export let isAdmin: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 font-sans">
	<!-- AI Chat Card -->
	<Card.Root class="group relative overflow-hidden bg-card text-card-foreground border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
		<div class="absolute inset-0  from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<Card.Content class="relative z-10 p-6">
			<div class="flex items-center mb-4">
				<div class="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center mr-4">
					<Bot class="h-6 w-6 text-primary" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">AI Assistant</h3>
					<p class="text-sm text-muted-foreground">Powered by Gemini</p>
				</div>
			</div>
			<p class="text-muted-foreground mb-4">Chat with our intelligent AI assistant for help, creativity, and problem-solving.</p>
			<button
				on:click={() => navigateTo('/chat')}
				class="w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground font-medium transition-transform transition-shadow duration-200 shadow 
				       hover:shadow-lg hover:scale-[1.03] active:scale-95 active:shadow-inner"
			>
				Start Conversation
			</button>
		</Card.Content>
	</Card.Root>

	<!-- Profile Card -->
	<Card.Root class="group relative overflow-hidden bg-card text-card-foreground border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
		<div class="absolute inset-0  from-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
		<Card.Content class="relative z-10 p-6">
			<div class="flex items-center mb-4">
				<div class="h-12 w-12 rounded-lg bg-secondary/30 flex items-center justify-center mr-4">
					<UserIcon class="h-6 w-6 text-secondary-foreground" />
				</div>
				<div>
					<h3 class="text-lg font-semibold">Profile Settings</h3>
					<p class="text-sm text-muted-foreground">Manage account</p>
				</div>
			</div>
			<p class="text-muted-foreground mb-4">Update your profile information, change password, and manage account settings.</p>
			<button
				on:click={() => navigateTo('/profile')}
				class="w-full rounded-lg bg-secondary px-4 py-3 text-secondary-foreground font-medium transition-transform transition-shadow duration-200 shadow 
				       hover:shadow-lg hover:scale-[1.03] active:scale-95 active:shadow-inner"
			>
				Edit Profile
			</button>
		</Card.Content>
	</Card.Root>

	<!-- Admin Panel or Role Card -->
	{#if isAdmin}
		<Card.Root class="group relative overflow-hidden bg-card text-card-foreground border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
			<div class="absolute inset-0  from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
			<Card.Content class="relative z-10 p-6">
				<div class="flex items-center mb-4">
					<div class="h-12 w-12 rounded-lg bg-accent/20 flex items-center justify-center mr-4">
						<ShieldCheck class="h-6 w-6 text-accent" />
					</div>
					<div>
						<h3 class="text-lg font-semibold">Admin Dashboard</h3>
						<p class="text-sm text-muted-foreground">System management</p>
					</div>
				</div>
				<p class="text-muted-foreground mb-4">Access administrative tools, manage users, and view system analytics.</p>
				<button
					on:click={() => navigateTo('/admin')}
					class="w-full rounded-lg bg-accent px-4 py-3 text-accent-foreground font-medium transition-transform transition-shadow duration-200 shadow 
					       hover:shadow-lg hover:scale-[1.03] active:scale-95 active:shadow-inner"
				>
					Open Admin Panel
				</button>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="group relative overflow-hidden bg-card text-card-foreground border">
			<Card.Content class="relative z-10 p-6">
				<div class="flex items-center mb-4">
					<div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mr-4">
						<BarChart3 class="h-6 w-6 text-muted-foreground" />
					</div>
					<div>
						<h3 class="text-lg font-semibold">Your Role</h3>
						<p class="text-sm text-muted-foreground">Current access level</p>
					</div>
				</div>
				<p class="text-muted-foreground mb-4">You have standard user access. Contact an administrator for role upgrades.</p>
				<div class="w-full rounded-lg bg-muted px-4 py-3 text-foreground font-medium text-center">
					Standard User
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
