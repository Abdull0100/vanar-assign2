<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	export let allRecentActivities: any[] = [];
	export let formatDate: (d: string) => string;
</script>

<div class="font-sans">
	<Card.Root>
		<Card.Header>
			<Card.Title>Recent Activities</Card.Title>
			<Card.Description>All user activities and admin actions across the system</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if allRecentActivities.length > 0}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Activity</Table.Head>
							<Table.Head>User</Table.Head>
							<Table.Head>IP</Table.Head>
							<Table.Head>Time</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each allRecentActivities.slice(0, 50) as activity}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Badge variant={activity.type === 'user_activity' ? 'default' : 'secondary'}>
											{activity.type === 'user_activity' ? 'User' : 'Admin'}
										</Badge>
										<span class="text-sm">{activity.description || activity.activityType || activity.actionType || 'Unknown activity'}</span>
									</div>
								</Table.Cell>
								<Table.Cell>
									<div class="text-sm">
										{#if activity.type === 'user_activity'}
											{activity.user?.name || activity.user?.email || 'Unknown User'}
										{:else}
											{activity.admin?.name || activity.admin?.email || 'Unknown Admin'}
											{#if activity.targetUser}
												<div class="text-xs text-muted-foreground">Target: {activity.targetUser?.name || activity.targetUser?.email || 'Unknown User'}</div>
											{/if}
										{/if}
									</div>
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm font-mono">{activity.ipAddress || '-'}</span>
								</Table.Cell>
								<Table.Cell>
									<span class="text-sm">{formatDate(activity.createdAt)}</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{:else}
				<p class="text-muted-foreground text-center py-8">No activities found.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
