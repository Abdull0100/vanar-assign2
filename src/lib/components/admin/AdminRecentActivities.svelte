<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Badge } from '$lib/components/ui/badge';

	export let allRecentActivities: any[] = [];
	export let formatDate: (d: string) => string;

	// Format detailed tooltip content for activities
	function getActivityTooltip(activity: any): string {
		const details = [];
		
		// Activity ID and type
		if (activity.id) details.push(`ID: ${activity.id}`);
		if (activity.type) details.push(`Type: ${activity.type}`);
		if (activity.activityType && activity.activityType !== activity.type) {
			details.push(`Activity Type: ${activity.activityType}`);
		}
		if (activity.actionType && activity.actionType !== activity.activityType) {
			details.push(`Action Type: ${activity.actionType}`);
		}
		
		// User details
		if (activity.user) {
			details.push(`User: ${activity.user.name || activity.user.email || 'Unknown'}`);
			if (activity.user.id) details.push(`User ID: ${activity.user.id}`);
		}
		if (activity.admin) {
			details.push(`Admin: ${activity.admin.name || activity.admin.email || 'Unknown'}`);
			if (activity.admin.id) details.push(`Admin ID: ${activity.admin.id}`);
		}
		if (activity.targetUser) {
			details.push(`Target: ${activity.targetUser.name || activity.targetUser.email || 'Unknown'}`);
		}
		
		// Technical details
		if (activity.ipAddress) details.push(`IP: ${activity.ipAddress}`);
		if (activity.userAgent) details.push(`User Agent: ${activity.userAgent}`);
		if (activity.sessionId) details.push(`Session: ${activity.sessionId.substring(0, 12)}...`);
		
		// Metadata
		if (activity.metadata) {
			try {
				const meta = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
				Object.entries(meta).forEach(([key, value]) => {
					details.push(`${key}: ${JSON.stringify(value)}`);
				});
			} catch {
				details.push(`Metadata: ${activity.metadata}`);
			}
		}
		
		// Timestamps
		if (activity.createdAt) details.push(`Created: ${formatDate(activity.createdAt)}`);
		if (activity.updatedAt && activity.updatedAt !== activity.createdAt) {
			details.push(`Updated: ${formatDate(activity.updatedAt)}`);
		}
		
		return details.join('\n');
	}
</script>

<Tooltip.Provider>
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
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<Table.Row class="cursor-pointer hover:bg-muted/50 transition-colors" {...props}>
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
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content side="right" class="max-w-sm text-xs">
										<div class="space-y-1">
											<div class="font-medium text-primary-foreground">Activity Details</div>
											<div class="text-primary-foreground/90 whitespace-pre-line">
												{getActivityTooltip(activity)}
											</div>
										</div>
									</Tooltip.Content>
								</Tooltip.Root>
							{/each}
						</Table.Body>
					</Table.Root>
				{:else}
					<p class="text-muted-foreground text-center py-8">No activities found.</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</Tooltip.Provider>
