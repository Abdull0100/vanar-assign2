<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge";
	import { 
		User, Crown, CheckCircle, AlertTriangle, 
		KeyRound, Link, Lock, ArrowRight, Trash2 
	} from "@lucide/svelte";

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

<div class="lg:col-span-1 space-y-4">
	<!-- Account Overview -->
	<Card.Root class="bg-card text-card-foreground border rounded-lg overflow-hidden">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Account Overview</Card.Title>
		</Card.Header>
		<Card.Content class="px-4 py-3 space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-sm">Account Type</span>
				<Badge class="inline-flex items-center gap-1 text-xs" variant="secondary">
					{#if user?.role === 'admin'}
						<Crown class="w-3 h-3" /> Admin
					{:else}
						<User class="w-3 h-3" /> User
					{/if}
				</Badge>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">Email Status</span>
				<Badge
					class="inline-flex items-center gap-1 text-xs
						{user?.emailVerified ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}">
					{#if user?.emailVerified}
						<CheckCircle class="w-3 h-3" /> Verified
					{:else}
						<AlertTriangle class="w-3 h-3" /> Pending
					{/if}
				</Badge>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-muted-foreground">Auth Method</span>
				<Badge class="inline-flex items-center gap-1 text-xs bg-muted text-foreground" variant="secondary">
					{#if user?.password}
						<KeyRound class="w-3 h-3" /> Password
					{:else}
						<Link class="w-3 h-3" /> OAuth
					{/if}
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Actions -->
	<Card.Root class="bg-card text-card-foreground border rounded-lg overflow-hidden">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Quick Actions</Card.Title>
		</Card.Header>
		<Card.Content class="px-4 py-3 space-y-2">
			<button
				on:click={openChangePasswordModal}
				class="w-full flex items-center justify-between rounded-md bg-muted/40 hover:bg-muted px-3 
			       py-2 transition transform hover:scale-[1.02] active:scale-[0.98]"
			>
				<span class="text-sm font-medium">Change Password</span>
				<Lock class="w-4 h-4 text-muted-foreground" />
			</button>
			<button
				on:click={handleChatNavigation}
				class="w-full flex items-center justify-between rounded-md bg-muted/40 hover:bg-muted px-3 
			       py-2 transition transform hover:translate-x-0.5"
			>
				<span class="text-sm font-medium">AI Chat</span>
				<ArrowRight class="w-4 h-4 text-muted-foreground" />
			</button>
			{#if user?.role === 'admin'}
				<button
					on:click={handleAdminNavigation}
					class="w-full flex items-center justify-between rounded-md bg-muted/40 hover:bg-muted px-3 
			       py-2 transition transform hover:translate-x-0.5"
				>
					<span class="text-sm font-medium">Admin Panel</span>
					<ArrowRight class="w-4 h-4 text-muted-foreground" />
				</button>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Account Deletion -->
	<Card.Root class="bg-card text-card-foreground border rounded-lg overflow-hidden">
		<Card.Header class="bg-muted px-4 py-2">
			<Card.Title class="text-sm font-semibold">Account Deletion</Card.Title>
		</Card.Header>
		<Card.Content class="px-4 py-3 space-y-3">
			<p class="text-sm text-muted-foreground">
				Permanently delete your account and all associated data. This action cannot be undone.
			</p>
			<button
				on:click={openDeleteAccountModal}
				class="w-full flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground px-3 py-2 
			       transition transform hover:scale-[1.02] active:scale-[0.98]"
			>
				<Trash2 class="w-4 h-4" />
				<span class="text-sm font-medium">Delete Account</span>
			</button>
		</Card.Content>
	</Card.Root>
</div>
