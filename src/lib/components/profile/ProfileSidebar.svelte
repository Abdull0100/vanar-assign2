<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge";
	import { User, Crown, CheckCircle, AlertTriangle, KeyRound, Link, Lock } from "@lucide/svelte";
	export let user: any;
	export let openChangePasswordModal: () => void;
	export let gotoChat: () => void;
	export let gotoAdmin: () => void;
</script>

<div class="lg:col-span-1 space-y-6">
	<!-- Account Overview -->
	<Card.Root class="bg-card text-card-foreground border rounded-xl overflow-hidden">
		<Card.Header class="bg-muted px-6 py-4 border-b border-border">
			<Card.Title class="text-lg font-semibold">Account Overview</Card.Title>
		</Card.Header>
		<Card.Content class="p-6 space-y-4">
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
				<Badge class="inline-flex items-center gap-1 text-xs {user?.emailVerified ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}">
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
					{#if user?.password}<KeyRound class="w-3 h-3" /> Password{:else}<Link class="w-3 h-3" /> OAuth{/if}
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Actions -->
	<Card.Root class="bg-card text-card-foreground border rounded-xl overflow-hidden">
		<Card.Header class="bg-muted px-6 py-4 border-b border-border">
			<Card.Title class="text-lg font-semibold">Quick Actions</Card.Title>
		</Card.Header>
		<Card.Content class="p-6 space-y-3">
			<button
				on:click={openChangePasswordModal}
				class="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
			>
				<span class="text-sm font-medium">Change Password</span>
				<Lock class="w-4 h-4 text-muted-foreground" />
			</button>
			<button
				on:click={gotoChat}
				class="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
			>
				<span class="text-sm font-medium">AI Chat</span>
				<span class="text-muted-foreground">→</span>
			</button>
			{#if user?.role === 'admin'}
				<button
					on:click={gotoAdmin}
					class="w-full flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
				>
					<span class="text-sm font-medium">Admin Panel</span>
					<span class="text-muted-foreground">→</span>
				</button>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Account Deletion -->
	<Card.Root class="bg-card text-card-foreground border rounded-xl overflow-hidden">
		<Card.Header class="px-6 py-4 border-b border-border">
			<Card.Title class="text-lg font-semibold text-destructive">Account Deletion</Card.Title>
		</Card.Header>
		<Card.Content class="p-6">
			<slot name="danger"></slot>
		</Card.Content>
	</Card.Root>
</div>
