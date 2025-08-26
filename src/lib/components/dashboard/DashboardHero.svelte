<script lang="ts">
	import type { DefaultSession } from '@auth/core/types';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Crown, User as UserIcon } from '@lucide/svelte';

	export let user:
		| ({ id: string; role: string; emailVerified?: Date | null; password?: string | null } &
				DefaultSession['user'])
		| undefined;
</script>

<Card.Root class="rounded-2xl bg-card text-card-foreground border">
	<div class="px-8 py-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
				<p class="text-base text-muted-foreground">You're signed in as {user?.email}</p>
				<div class="mt-4 inline-flex items-center rounded-full bg-muted/30 px-4 py-2">
					<div class="h-2 w-2 rounded-full bg-primary mr-2"></div>
					<span class="text-sm font-medium flex items-center gap-2">
						{#if user?.role === 'admin'}
							<Crown class="h-4 w-4" /> Administrator
						{:else}
							<UserIcon class="h-4 w-4" /> User
						{/if}
					</span>
				</div>
			</div>
		</div>
	</div>
</Card.Root>


