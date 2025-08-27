<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge";
	import { User, Crown, Settings } from "@lucide/svelte";

	export let user: { role?: string } | null = null;
</script>

<Card.Root class="relative rounded-2xl bg-card text-card-foreground border mb-6" role="banner" aria-labelledby="profile-settings-title">
	<Card.Header class="relative pr-20">
		<Card.Title id="profile-settings-title" class="text-3xl font-bold">Profile Settings</Card.Title>
		<Card.Description class="text-base text-muted-foreground">Manage your account and preferences</Card.Description>
		<!-- Settings icon positioned in the top right of header -->
		<div class="absolute right-6 top-1/2 -translate-y-1/2" aria-hidden="true">
			<Settings class="w-8 h-8 text-muted-foreground" />
		</div>
	</Card.Header>
	<Card.Content class="pt-0">
		<Badge class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium" variant="secondary">
			<div class="h-2 w-2 rounded-full bg-primary" aria-hidden="true"></div>
			{#if user?.role === 'admin'}
				<Crown class="w-4 h-4" />
				<span>Administrator Account</span>
			{:else}
				<User class="w-4 h-4" />
				<span>User Account</span>
			{/if}
		</Badge>
	</Card.Content>
</Card.Root>
