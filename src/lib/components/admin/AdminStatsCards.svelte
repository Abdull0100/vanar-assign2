<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let users: Array<{
		id: string;
		role: string;
		emailVerified: string | null;
		createdAt: string;
	}> = [];
	export let userStats: any = null;
	export let mostActiveUsers: any[] = [];

	function calculateStats() {
		return {
			totalUsers: users.length,
			verifiedUsers: users.filter((u) => u.emailVerified).length,
			adminUsers: users.filter((u) => u.role === 'admin').length,
			regularUsers: users.filter((u) => u.role === 'user').length
		};
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
	<Card.Root>
		<Card.Content>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
						<svg
							class="h-5 w-5 text-primary-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
							></path>
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="truncate font-sans text-sm font-medium text-muted-foreground">
							Total Users
						</dt>
						<dd class="text-lg font-medium">
							{userStats?.totalUsers || calculateStats().totalUsers}
						</dd>
					</dl>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
						<svg
							class="h-5 w-5 text-secondary-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="truncate font-sans text-sm font-medium text-muted-foreground">
							Verified Users
						</dt>
						<dd class="text-lg font-medium">
							{userStats?.verifiedUsers || calculateStats().verifiedUsers}
						</dd>
					</dl>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
						<svg
							class="h-5 w-5 text-accent-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							></path>
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="truncate font-sans text-sm font-medium text-muted-foreground">
							Admin Users
						</dt>
						<dd class="text-lg font-medium">
							{userStats?.adminUsers || calculateStats().adminUsers}
						</dd>
					</dl>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Content>
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
						<svg
							class="h-5 w-5 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							></path>
						</svg>
					</div>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="truncate font-sans text-sm font-medium text-muted-foreground">
							Regular Users
						</dt>
						<dd class="text-lg font-medium">
							{userStats?.regularUsers || calculateStats().regularUsers}
						</dd>
					</dl>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>

{#if userStats}
	<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
		<Card.Root>
			<Card.Content>
				<h3 class="mb-4 font-sans text-lg font-medium">Chat Statistics</h3>
				<div class="space-y-3">
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Total Chat Messages</span>
						<span class="text-sm font-medium">{userStats.totalChatMessages}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-sm text-muted-foreground">Total Conversations</span>
						<span class="text-sm font-medium">{userStats.totalConversations}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content>
				<h3 class="mb-4 font-sans text-lg font-medium">Most Active Users</h3>
				<div class="space-y-2">
					{#each mostActiveUsers.slice(0, 5) as activeUser}
						<div class="flex items-center justify-between">
							<span class="text-sm">{activeUser.name || activeUser.email}</span>
							<Badge variant="secondary" class="rounded-full px-2 py-1 text-xs">
								{activeUser.stats?.totalChatMessages || 0} messages
							</Badge>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
