<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import { ChartContainer, ChartTooltip, type ChartConfig } from '$lib/components/ui/chart';
	import { Badge } from '$lib/components/ui/badge';

	export let users: any[] = [];
	export let userStats: any = null;
	export let allRecentActivities: any[] = [];

	let userRoleData: any = {};
	let activityTrendData: any = {};
	let conversationTrendData: any = {};
	let verificationStatusData: any = {};
	let activityTypeData: any = {};

	// Chart configurations
	const userRoleConfig = {
		admin: {
			label: "Admin Users",
			color: "hsl(var(--chart-1))",
		},
		user: {
			label: "Regular Users", 
			color: "hsl(var(--chart-2))",
		},
	} satisfies ChartConfig;

	const activityTrendConfig = {
		activities: {
			label: "Activities",
			color: "hsl(var(--chart-3))",
		},
		logins: {
			label: "Logins",
			color: "hsl(var(--chart-4))",
		},
	} satisfies ChartConfig;

	const verificationConfig = {
		verified: {
			label: "Verified",
			color: "hsl(var(--chart-1))",
		},
		unverified: {
			label: "Unverified",
			color: "hsl(var(--chart-5))",
		},
	} satisfies ChartConfig;

	const activityTypeConfig = {
		login: {
			label: "Login",
			color: "hsl(var(--chart-1))",
		},
		chat: {
			label: "Chat",
			color: "hsl(var(--chart-2))",
		},
		profile: {
			label: "Profile",
			color: "hsl(var(--chart-3))",
		},
		admin: {
			label: "Admin Actions",
			color: "hsl(var(--chart-4))",
		},
	} satisfies ChartConfig;

	onMount(() => {
		generateChartData();
	});

	$: if (users || userStats || allRecentActivities) {
		generateChartData();
	}

	function generateChartData() {
		// User Role Distribution
		const adminCount = users.filter(u => u.role === 'admin').length;
		const userCount = users.filter(u => u.role === 'user').length;
		
		userRoleData = [
			{
				role: "admin",
				count: adminCount,
				fill: "hsl(var(--chart-1))",
			},
			{
				role: "user", 
				count: userCount,
				fill: "hsl(var(--chart-2))",
			},
		];

		// Verification Status Distribution
		const verifiedCount = users.filter(u => u.emailVerified).length;
		const unverifiedCount = users.length - verifiedCount;

		verificationStatusData = [
			{
				status: "verified",
				count: verifiedCount,
				fill: "hsl(var(--chart-1))",
			},
			{
				status: "unverified",
				count: unverifiedCount,
				fill: "hsl(var(--chart-5))",
			},
		];

		// Activity Trend (Last 7 days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (6 - i));
			return date;
		});

		activityTrendData = last7Days.map(date => {
			const dateStr = date.toISOString().split('T')[0];
			const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
			
			const activitiesCount = allRecentActivities.filter(activity => 
				activity.createdAt && activity.createdAt.startsWith(dateStr)
			).length;

			const loginsCount = allRecentActivities.filter(activity => 
				activity.createdAt && activity.createdAt.startsWith(dateStr) && 
				(activity.activityType === 'login' || activity.description?.includes('login'))
			).length;

			return {
				day: dayName,
				date: dateStr,
				activities: activitiesCount,
				logins: loginsCount,
			};
		});

		// Activity Type Breakdown
		const activityTypes = {
			login: 0,
			chat: 0,
			profile: 0,
			admin: 0,
		};

		allRecentActivities.forEach(activity => {
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

		activityTypeData = Object.entries(activityTypes).map(([type, count]) => ({
			type,
			count,
			fill: activityTypeConfig[type as keyof typeof activityTypeConfig]?.color || "hsl(var(--muted))",
		}));
	}

	function formatNumber(num: number): string {
		if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
		if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
		return num.toString();
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
			{#if activityTrendData.length > 0}
				<div class="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
					<div class="text-center text-gray-500">
						<div class="text-2xl mb-2">📊</div>
						<p>Activity Trend Chart</p>
						<p class="text-sm">Chart component not available</p>
					</div>
				</div>
			{:else}
				<div class="flex items-center justify-center h-[300px] text-muted-foreground">
					<p>No activity data available</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<!-- User Role Distribution -->
		<Card.Root>
			<Card.Header>
				<Card.Title>User Role Distribution</Card.Title>
				<Card.Description>Admin vs Regular Users</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if userRoleData.length > 0}
					<div class="h-[250px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
						<div class="text-center text-gray-500">
							<div class="text-2xl mb-2">🥧</div>
							<p>User Role Chart</p>
							<p class="text-sm">Chart component not available</p>
						</div>
					</div>
					<div class="flex justify-center space-x-4 mt-4">
						<div class="flex items-center space-x-2">
							<div class="w-3 h-3 rounded-full bg-chart-1"></div>
							<span class="text-sm">Admin: {userRoleData.find((d: any) => d.role === 'admin')?.count || 0}</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-3 h-3 rounded-full bg-chart-2"></div>
							<span class="text-sm">Users: {userRoleData.find((d: any) => d.role === 'user')?.count || 0}</span>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-center h-[250px] text-muted-foreground">
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
				{#if verificationStatusData.length > 0}
					<div class="h-[250px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
						<div class="text-center text-gray-500">
							<div class="text-2xl mb-2">✅</div>
							<p>Verification Status Chart</p>
							<p class="text-sm">Chart component not available</p>
						</div>
					</div>
					<div class="flex justify-center space-x-4 mt-4">
						<div class="flex items-center space-x-2">
							<div class="w-3 h-3 rounded-full bg-chart-1"></div>
							<span class="text-sm">Verified: {verificationStatusData.find((d: any) => d.status === 'verified')?.count || 0}</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-3 h-3 rounded-full bg-chart-5"></div>
							<span class="text-sm">Unverified: {verificationStatusData.find((d: any) => d.status === 'unverified')?.count || 0}</span>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-center h-[250px] text-muted-foreground">
						<p>No verification data available</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Activity Summary Cards -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Quick Stats</Card.Title>
				<Card.Description>System overview metrics</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
					<span class="text-sm font-medium">Total Users</span>
					<Badge variant="default" class="text-lg px-3 py-1">
						{formatNumber(users.length)}
					</Badge>
				</div>
				<div class="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
					<span class="text-sm font-medium">Total Activities</span>
					<Badge variant="secondary" class="text-lg px-3 py-1">
						{formatNumber(allRecentActivities.length)}
					</Badge>
				</div>
				<div class="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
					<span class="text-sm font-medium">Chat Messages</span>
					<Badge variant="outline" class="text-lg px-3 py-1">
						{formatNumber(userStats?.totalChatMessages || 0)}
					</Badge>
				</div>
				<div class="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
					<span class="text-sm font-medium">Conversations</span>
					<Badge variant="outline" class="text-lg px-3 py-1">
						{formatNumber(userStats?.totalConversations || 0)}
					</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Activity Type Breakdown -->
	{#if activityTypeData.some((d: any) => d.count > 0)}
		<Card.Root>
			<Card.Header>
				<Card.Title>Activity Type Breakdown</Card.Title>
				<Card.Description>Distribution of different activity types</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="h-[200px] w-full flex items-center justify-center bg-gray-50 rounded-lg">
					<div class="text-center text-gray-500">
						<div class="text-2xl mb-2">📈</div>
						<p>Activity Type Chart</p>
						<p class="text-sm">Chart component not available</p>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4 mt-4">
					{#each activityTypeData.filter((d: any) => d.count > 0) as item}
						<div class="flex items-center justify-between p-2 rounded border">
							<div class="flex items-center space-x-2">
								<div class="w-3 h-3 rounded-full" style="background-color: {item.fill}"></div>
								<span class="text-sm capitalize">{item.type}</span>
							</div>
							<Badge variant="outline">{item.count}</Badge>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
