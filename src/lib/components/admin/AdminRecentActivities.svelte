<script lang="ts">
	export let allRecentActivities: any[] = [];
	export let formatDate: (d: string) => string;
</script>

<div class="space-y-6">
	<div class="bg-card border rounded-lg p-6">
		<h3 class="text-lg font-medium mb-4">Recent Activities</h3>
		<p class="text-sm text-muted-foreground mb-4">All user activities and admin actions across the system</p>

		<div class="space-y-2">
			{#each allRecentActivities.slice(0, 50) as activity}
				<div class="relative group">
					<div class="flex items-center justify-between p-3 bg-card rounded-lg border hover:shadow-md hover:border-border transition-all cursor-pointer">
						<div class="flex items-center space-x-3">
							<div class="flex-shrink-0">
								{#if activity.type === 'user_activity'}
									<div class="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
										<svg class="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
										</svg>
									</div>
								{:else}
									<div class="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
										<svg class="w-3 h-3 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
										</svg>
									</div>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<span class="text-sm">
									{activity.description || activity.activityType || 'Unknown activity'} • {formatDate(activity.createdAt)}
								</span>
							</div>
						</div>
					</div>

					<div class="absolute left-0 top-full mt-2 w-80 bg-card rounded-lg shadow-lg border p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
						<div class="space-y-3">
							<div>
								<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">User</div>
								<div class="text-sm">
									{#if activity.type === 'user_activity'}
										{activity.user?.name || activity.user?.email || 'Unknown User'}
									{:else}
										Admin: {activity.admin?.name || activity.admin?.email || 'Unknown Admin'}
										{#if activity.targetUser}
											<br>Target: {activity.targetUser?.name || activity.targetUser?.email || 'Unknown User'}
										{/if}
									{/if}
								</div>
							</div>

							{#if activity.ipAddress}
								<div>
									<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">IP Address</div>
									<div class="text-sm font-mono">{activity.ipAddress}</div>
								</div>
							{/if}

							{#if activity.userAgent}
								<div>
									<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">User Agent</div>
									<div class="text-sm break-all">{activity.userAgent}</div>
								</div>
							{/if}

							{#if activity.metadata}
								<div>
									<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Metadata</div>
									<div class="text-sm">
										{#if typeof activity.metadata === 'object'}
											{#each Object.entries(activity.metadata) as [key, value]}
												<div class="flex justify-between py-1">
													<span class="font-medium">{key}:</span>
													<span class="text-muted-foreground">{JSON.stringify(value)}</span>
												</div>
											{/each}
										{:else}
											<div class="bg-muted rounded p-2 text-xs font-mono">
												{JSON.stringify(activity.metadata, null, 2)}
											</div>
										{/if}
									</div>
								</div>
							{/if}

							<!-- ✅ Fixed: Removed the extra <div> that was here -->
							<div>
								<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Activity Details</div>
								<div class="text-sm">
									<div class="flex justify-between py-1">
										<span class="font-medium">Type:</span>
										<span class="text-muted-foreground">{activity.type === 'user_activity' ? (activity.activityType || 'Activity') : (activity.actionType || 'Action')}</span>
									</div>
									<div class="flex justify-between py-1">
										<span class="font-medium">Time:</span>
										<span class="text-muted-foreground">{formatDate(activity.createdAt)}</span>
									</div>
									<div class="flex justify-between py-1">
										<span class="font-medium">Description:</span>
										<span class="text-muted-foreground text-right">{activity.description || 'No description'}</span>
									</div>
								</div>
							</div>
						</div>
						<div class="absolute -top-2 left-4 w-4 h-4 bg-card border-l border-t transform rotate-45"></div>
					</div>
				</div>
			{/each}

			{#if allRecentActivities.length === 0}
				<p class="text-muted-foreground text-center py-8">No activities found.</p>
			{/if}
		</div>
	</div>
</div>
