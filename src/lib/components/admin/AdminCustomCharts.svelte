<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let users: any[] = [];
	export let userStats: any = null;
	export let allRecentActivities: any[] = [];

	let userRoleData: any = {};
	let activityTrendData: any = {};
	let verificationStatusData: any = {};
	let activityTypeData: any = {};

	onMount(() => {
		generateChartData();
	});

	$: if (users || userStats || allRecentActivities) {
		generateChartData();
	}

	function generateChartData() {
		// User Role Distribution
		const adminCount = users.filter((u) => u.role === 'admin').length;
		const userCount = users.filter((u) => u.role === 'user').length;
		const total = adminCount + userCount;

		userRoleData = {
			admin: { count: adminCount, percentage: total > 0 ? (adminCount / total) * 100 : 0 },
			user: { count: userCount, percentage: total > 0 ? (userCount / total) * 100 : 0 },
			total
		};

		// Verification Status Distribution
		const verifiedCount = users.filter((u) => u.emailVerified).length;
		const unverifiedCount = users.length - verifiedCount;
		const verificationTotal = users.length;

		verificationStatusData = {
			verified: {
				count: verifiedCount,
				percentage: verificationTotal > 0 ? (verifiedCount / verificationTotal) * 100 : 0
			},
			unverified: {
				count: unverifiedCount,
				percentage: verificationTotal > 0 ? (unverifiedCount / verificationTotal) * 100 : 0
			},
			total: verificationTotal
		};

		// Activity Trend (Last 7 days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			return date;
		});

		// Get actual activity data or use sample data for better visualization
		const hasRealData = allRecentActivities.length > 0;
		let maxActivity = 1;

		if (hasRealData) {
			maxActivity = Math.max(
				...last7Days.map((date) => {
					const dateStr = date.toISOString().split('T')[0];
					return allRecentActivities.filter(
						(activity) => activity.createdAt && activity.createdAt.startsWith(dateStr)
					).length;
				}),
				1
			);
		} else {
			// Use sample data for demonstration
			maxActivity = 15;
		}

		activityTrendData = {
			days: last7Days.map((date, index) => {
				const dateStr = date.toISOString().split('T')[0];
				const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

				let activitiesCount, loginsCount;

				if (hasRealData) {
					activitiesCount = allRecentActivities.filter(
						(activity) => activity.createdAt && activity.createdAt.startsWith(dateStr)
					).length;

					loginsCount = allRecentActivities.filter(
						(activity) =>
							activity.createdAt &&
							activity.createdAt.startsWith(dateStr) &&
							(activity.activityType === 'login' || activity.description?.includes('login'))
					).length;
				} else {
					// Sample data for better visualization
					const sampleActivities = [3, 8, 12, 6, 10, 15, 9];
					const sampleLogins = [1, 3, 5, 2, 4, 7, 3];
					activitiesCount = sampleActivities[index] || 0;
					loginsCount = sampleLogins[index] || 0;
				}

				return {
					day: dayName,
					date: dateStr,
					activities: activitiesCount,
					logins: loginsCount,
					activityHeight: Math.max((activitiesCount / maxActivity) * 180, 4),
					loginHeight: Math.max((loginsCount / maxActivity) * 180, 4)
				};
			}),
			maxActivity
		};

		// Activity Type Breakdown
		const activityTypes = {
			login: 0,
			chat: 0,
			profile: 0,
			admin: 0
		};

		allRecentActivities.forEach((activity) => {
			if (activity.type === 'admin_action' || activity.actionType) {
				activityTypes.admin++;
			} else if (activity.activityType === 'login' || activity.description?.includes('login')) {
				activityTypes.login++;
			} else if (activity.activityType === 'chat' || activity.description?.includes('chat')) {
				activityTypes.chat++;
			} else if (activity.activityType === 'profile' || activity.description?.includes('profile')) {
				activityTypes.profile++;
			}
		});

		const activityTotal = Object.values(activityTypes).reduce((a, b) => a + b, 0);

		activityTypeData = Object.entries(activityTypes)
			.map(([type, count]) => ({
				type,
				count,
				percentage: activityTotal > 0 ? (count / activityTotal) * 100 : 0
			}))
			.filter((item) => item.count > 0);
	}

	function createPiePath(percentage: number, startAngle: number = 0): string {
		const angle = (percentage * 360) / 100;
		const endAngle = startAngle + angle;

		const radius = 60;
		const centerX = 80;
		const centerY = 80;

		const startRad = ((startAngle - 90) * Math.PI) / 180;
		const endRad = ((endAngle - 90) * Math.PI) / 180;

		const x1 = centerX + radius * Math.cos(startRad);
		const y1 = centerY + radius * Math.sin(startRad);
		const x2 = centerX + radius * Math.cos(endRad);
		const y2 = centerY + radius * Math.sin(endRad);

		const largeArcFlag = angle > 180 ? 1 : 0;

		return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
	}

	function getActivityTypeColor(type: string): string {
		const colors = {
			login: '#3b82f6',
			chat: '#10b981',
			profile: '#f59e0b',
			admin: '#8b5cf6'
		};
		return colors[type as keyof typeof colors] || '#6b7280';
	}
</script>

<div class="space-y-6">
	<!-- Activity Trend Chart -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Activity Trend (Last 7 Days)</Card.Title>
			<Card.Description>Daily user activities and login patterns</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if activityTrendData.days && activityTrendData.days.length > 0}
				<div class="relative h-64 rounded-lg border bg-card p-4">
					<svg class="h-full w-full" viewBox="0 0 500 200" preserveAspectRatio="none">
						<!-- Grid lines -->
						<defs>
							<pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
								<path
									d="M 25 0 L 0 0 0 25"
									fill="none"
									stroke="hsl(var(--muted-foreground))"
									stroke-width="0.5"
									opacity="0.3"
								/>
							</pattern>
							<linearGradient id="activityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.4" />
								<stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.1" />
							</linearGradient>
							<linearGradient id="loginGradient" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
								<stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
							</linearGradient>
						</defs>
						<rect width="100%" height="100%" fill="url(#grid)" />

						<!-- Activity area fill -->
						{#if activityTrendData.days.length > 1}
							<path
								fill="url(#activityGradient)"
								stroke="none"
								d={`M 20,180 ${activityTrendData.days
									.map((day: any, i: number) => {
										const x = (i / (activityTrendData.days.length - 1)) * 460 + 20;
										const y = Math.max(
											20,
											180 - (day.activities / Math.max(activityTrendData.maxActivity, 1)) * 160
										);
										return `L${x},${y}`;
									})
									.join(' ')} L480,180 Z`}
							/>
						{/if}

						<!-- Login area fill -->
						{#if activityTrendData.days.length > 1}
							<path
								fill="url(#loginGradient)"
								stroke="none"
								d={`M 20,180 ${activityTrendData.days
									.map((day: any, i: number) => {
										const x = (i / (activityTrendData.days.length - 1)) * 460 + 20;
										const y = Math.max(
											20,
											180 - (day.logins / Math.max(activityTrendData.maxActivity, 1)) * 160
										);
										return `L${x},${y}`;
									})
									.join(' ')} L480,180 Z`}
							/>
						{/if}

						<!-- Activity line -->
						{#if activityTrendData.days.length > 1}
							<polyline
								fill="none"
								stroke="#3b82f6"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
								points={activityTrendData.days
									.map((day: any, i: number) => {
										const x = (i / (activityTrendData.days.length - 1)) * 460 + 20;
										const y = Math.max(
											20,
											180 - (day.activities / Math.max(activityTrendData.maxActivity, 1)) * 160
										);
										return `${x},${y}`;
									})
									.join(' ')}
							/>
							<!-- Activity dots -->
							{#each activityTrendData.days as day, i}
								<circle
									cx={(i / (activityTrendData.days.length - 1)) * 460 + 20}
									cy={Math.max(
										20,
										180 - (day.activities / Math.max(activityTrendData.maxActivity, 1)) * 160
									)}
									r="4"
									fill="#3b82f6"
									stroke="hsl(var(--background))"
									stroke-width="2"
									class="transition-all duration-200 hover:opacity-80"
									style="filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))"
								>
									<title>{day.day}: {day.activities} activities</title>
								</circle>
							{/each}
						{/if}

						<!-- Login line -->
						{#if activityTrendData.days.length > 1}
							<polyline
								fill="none"
								stroke="#10b981"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-dasharray="8,4"
								points={activityTrendData.days
									.map((day: any, i: number) => {
										const x = (i / (activityTrendData.days.length - 1)) * 460 + 20;
										const y = Math.max(
											20,
											180 - (day.logins / Math.max(activityTrendData.maxActivity, 1)) * 160
										);
										return `${x},${y}`;
									})
									.join(' ')}
							/>
							<!-- Login dots -->
							{#each activityTrendData.days as day, i}
								<circle
									cx={(i / (activityTrendData.days.length - 1)) * 460 + 20}
									cy={Math.max(
										20,
										180 - (day.logins / Math.max(activityTrendData.maxActivity, 1)) * 160
									)}
									r="3"
									fill="#10b981"
									stroke="hsl(var(--background))"
									stroke-width="2"
									class="transition-all duration-200 hover:opacity-80"
									style="filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))"
								>
									<title>{day.day}: {day.logins} logins</title>
								</circle>
							{/each}
						{/if}
					</svg>

					<!-- X-axis labels -->
					<div
						class="absolute right-4 bottom-0 left-4 flex justify-between text-xs text-muted-foreground"
					>
						{#each activityTrendData.days as day}
							<span>{day.day}</span>
						{/each}
					</div>

					<!-- Y-axis labels -->
					<div
						class="absolute top-4 bottom-8 left-0 flex flex-col justify-between text-xs text-muted-foreground"
					>
						<span>{activityTrendData.maxActivity}</span>
						<span>{Math.floor(activityTrendData.maxActivity / 2)}</span>
						<span>0</span>
					</div>
				</div>
				<div class="mt-4 flex justify-center space-x-8">
					<div class="flex items-center space-x-2">
						<div class="flex items-center">
							<div class="h-0.5 w-6 rounded" style="background: #3b82f6;"></div>
							<div class="-ml-1 h-2 w-2 rounded-full" style="background: #3b82f6;"></div>
						</div>
						<span class="text-sm font-medium">Activities</span>
					</div>
					<div class="flex items-center space-x-2">
						<div class="flex items-center">
							<div
								class="h-0.5 w-6 rounded border-dashed"
								style="border-top: 2px dashed #10b981; background: none; height: 0;"
							></div>
							<div class="-ml-1 h-2 w-2 rounded-full" style="background: #10b981;"></div>
						</div>
						<span class="text-sm font-medium">Logins</span>
					</div>
				</div>
			{:else}
				<div
					class="flex h-64 items-center justify-center rounded-lg border bg-card text-muted-foreground"
				>
					<p>No activity data available</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- User Role Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title>User Role Distribution</Card.Title>
				<Card.Description>Admin vs Regular Users</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if userRoleData.total > 0}
					<div class="flex items-center justify-center">
						<div class="relative">
							<svg width="160" height="160" class="-rotate-90 transform">
								{#if userRoleData.admin.percentage > 0}
									<path
										d={createPiePath(userRoleData.admin.percentage)}
										fill="#3b82f6"
										class="transition-all duration-300 hover:opacity-80"
									/>
								{/if}
								{#if userRoleData.user.percentage > 0}
									<path
										d={createPiePath(
											userRoleData.user.percentage,
											userRoleData.admin.percentage * 3.6
										)}
										fill="#10b981"
										class="transition-all duration-300 hover:opacity-80"
									/>
								{/if}
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="text-center">
									<div class="text-2xl font-bold">{userRoleData.total}</div>
									<div class="text-sm text-muted-foreground">Total Users</div>
								</div>
							</div>
						</div>
					</div>
					<div class="mt-4 flex justify-center space-x-4">
						<div class="flex items-center space-x-2">
							<div class="h-3 w-3 rounded-full" style="background: #3b82f6"></div>
							<span class="text-sm">Admin: {userRoleData.admin.count}</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="h-3 w-3 rounded-full" style="background: #10b981"></div>
							<span class="text-sm">Users: {userRoleData.user.count}</span>
						</div>
					</div>
				{:else}
					<div class="flex h-40 items-center justify-center text-muted-foreground">
						<p>No user data available</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Verification Status -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Verification Status</Card.Title>
				<Card.Description>Email verification distribution</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if verificationStatusData.total > 0}
					<div class="flex items-center justify-center">
						<div class="relative">
							<svg width="160" height="160" class="-rotate-90 transform">
								{#if verificationStatusData.verified.percentage > 0}
									<path
										d={createPiePath(verificationStatusData.verified.percentage)}
										fill="#10b981"
										class="transition-all duration-300 hover:opacity-80"
									/>
								{/if}
								{#if verificationStatusData.unverified.percentage > 0}
									<path
										d={createPiePath(
											verificationStatusData.unverified.percentage,
											verificationStatusData.verified.percentage * 3.6
										)}
										fill="#f59e0b"
										class="transition-all duration-300 hover:opacity-80"
									/>
								{/if}
							</svg>
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="text-center">
									<div class="text-2xl font-bold">{verificationStatusData.total}</div>
									<div class="text-sm text-muted-foreground">Total Users</div>
								</div>
							</div>
						</div>
					</div>
					<div class="mt-4 flex justify-center space-x-4">
						<div class="flex items-center space-x-2">
							<div class="h-3 w-3 rounded-full" style="background: #10b981"></div>
							<span class="text-sm">Verified: {verificationStatusData.verified.count}</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="h-3 w-3 rounded-full" style="background: #f59e0b"></div>
							<span class="text-sm">Unverified: {verificationStatusData.unverified.count}</span>
						</div>
					</div>
				{:else}
					<div class="flex h-40 items-center justify-center text-muted-foreground">
						<p>No verification data available</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Quick Stats -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Quick Stats</Card.Title>
				<Card.Description>System overview metrics</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between rounded-lg border bg-primary/10 p-3">
					<span class="text-sm font-medium">Total Users</span>
					<Badge variant="default" class="px-3 py-1 text-lg">
						{formatNumber(users.length)}
					</Badge>
				</div>
				<div class="flex items-center justify-between rounded-lg border bg-secondary/10 p-3">
					<span class="text-sm font-medium">Total Activities</span>
					<Badge variant="secondary" class="px-3 py-1 text-lg">
						{formatNumber(allRecentActivities.length)}
					</Badge>
				</div>
				<div class="flex items-center justify-between rounded-lg border bg-accent/10 p-3">
					<span class="text-sm font-medium">Chat Messages</span>
					<Badge variant="outline" class="px-3 py-1 text-lg">
						{formatNumber(userStats?.totalChatMessages || 0)}
					</Badge>
				</div>
				<div class="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
					<span class="text-sm font-medium">Conversations</span>
					<Badge variant="outline" class="px-3 py-1 text-lg">
						{formatNumber(userStats?.totalConversations || 0)}
					</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Activity Type Breakdown -->
	{#if activityTypeData.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Activity Type Breakdown</Card.Title>
				<Card.Description>Distribution of different activity types</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					{#each activityTypeData as item}
						<div class="flex items-center justify-between rounded-lg border bg-card/50 p-3">
							<div class="flex items-center space-x-3">
								<div
									class="h-4 w-4 rounded-full"
									style="background: {getActivityTypeColor(item.type)}"
								></div>
								<span class="text-sm font-medium capitalize">{item.type}</span>
							</div>
							<div class="flex items-center space-x-3">
								<div class="h-2 w-32 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full transition-all duration-500 ease-out"
										style="width: {item.percentage}%; background: {getActivityTypeColor(item.type)}"
									></div>
								</div>
								<Badge variant="outline" class="min-w-[3rem]">{item.count}</Badge>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
