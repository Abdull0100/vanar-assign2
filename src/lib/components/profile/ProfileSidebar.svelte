<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import {
		User,
		Crown,
		CheckCircle,
		AlertTriangle,
		KeyRound,
		Link,
		Lock,
		ArrowRight,
		Trash2
	} from '@lucide/svelte';

	export let user: any;
	export let openChangePasswordModal: () => void;
	export let openDeleteAccountModal: () => void;

	function handleChatNavigation() {
		goto('/chat');
	}

	function handleAdminNavigation() {
		goto('/admin');
	}
</script>

<div class="space-y-4 lg:col-span-1">
	<!-- Account Overview -->
	<Card.Root class="overflow-hidden rounded-lg border bg-card text-card-foreground">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Account Overview</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2 px-4 py-3">
			<div class="flex items-center justify-between">
				<span class="text-sm">Account Type</span>
				<Badge class="inline-flex items-center gap-1 text-xs" variant="secondary">
					{#if user?.role === 'admin'}
						<Crown class="h-3 w-3" /> Admin
					{:else}
						<User class="h-3 w-3" /> User
					{/if}
				</Badge>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">Email Status</span>
				<Badge
					class="inline-flex items-center gap-1 text-xs
						{user?.emailVerified ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}"
				>
					{#if user?.emailVerified}
						<CheckCircle class="h-3 w-3" /> Verified
					{:else}
						<AlertTriangle class="h-3 w-3" /> Pending
					{/if}
				</Badge>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">Auth Method</span>
				<Badge
					class="inline-flex items-center gap-1 bg-muted text-xs text-foreground"
					variant="secondary"
				>
					{#if user?.password}
						<KeyRound class="h-3 w-3" /> Password
					{:else}
						<Link class="h-3 w-3" /> OAuth
					{/if}
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Actions -->
	<Card.Root class="overflow-hidden rounded-lg border bg-card text-card-foreground">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Quick Actions</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-2 px-4 py-3">
			<button
				on:click={openChangePasswordModal}
				class="flex w-full transform items-center justify-between rounded-md bg-muted/40 px-3
			       py-2 transition hover:scale-[1.02] hover:bg-muted active:scale-[0.98]"
			>
				<span class="text-sm font-medium">Change Password</span>
				<Lock class="h-4 w-4 text-muted-foreground" />
			</button>
			<button
				on:click={handleChatNavigation}
				class="flex w-full transform items-center justify-between rounded-md bg-muted/40 px-3
			       py-2 transition hover:translate-x-0.5 hover:bg-muted"
			>
				<span class="text-sm font-medium">AI Chat</span>
				<ArrowRight class="h-4 w-4 text-muted-foreground" />
			</button>
			{#if user?.role === 'admin'}
				<button
					on:click={handleAdminNavigation}
					class="flex w-full transform items-center justify-between rounded-md bg-muted/40 px-3
			       py-2 transition hover:translate-x-0.5 hover:bg-muted"
				>
					<span class="text-sm font-medium">Admin Panel</span>
					<ArrowRight class="h-4 w-4 text-muted-foreground" />
				</button>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Account Deletion -->
	<Card.Root class="overflow-hidden rounded-lg border bg-card text-card-foreground">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Account Deletion</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-3 px-4 py-3">
			<p class="text-sm text-muted-foreground">
				Permanently delete your account and all associated data. This action cannot be undone.
			</p>
			<button
				on:click={openDeleteAccountModal}
				class="flex w-full transform items-center justify-center gap-2 rounded-md bg-destructive px-3 py-2
			       text-destructive-foreground transition hover:scale-[1.02] active:scale-[0.98]"
			>
				<Trash2 class="h-4 w-4" />
				<span class="text-sm font-medium">Delete Account</span>
			</button>
		</Card.Content>
	</Card.Root>
</div>
