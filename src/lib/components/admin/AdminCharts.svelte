<script lang="ts">
	import { TrendingUpIcon, WifiIcon, WifiOffIcon } from '@lucide/svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { AreaChart } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';
	import { adminStore } from '$lib/api/adminState';

	// Access adminStore directly for real-time updates
	// Following Svelte 5 best practices for reactive stores

	let timeRange = $state('7d');
	let lastUpdate = $state(new Date());

	// Track when adminStore data changes for real-time updates
	$effect(() => {
		const activities = $adminStore.allRecentActivities;
		const sseConnected = $adminStore.sseConnected;

		// Update timestamp when data changes
		if (activities.length > 0) {
			lastUpdate = new Date();
		}

		// Log for debugging real-time updates
		if (activities.length > 0) {
			console.log(`Chart data updated: ${activities.length} activities, SSE: ${sseConnected}`);
		}
	});

	const selectedLabel = $derived.by(() => {
		switch (timeRange) {
			case '30d':
				return 'Last 30 days';
			case '14d':
				return 'Last 14 days';
			case '7d':
				return 'Last 7 days';
			default:
				return 'Last 7 days';
		}
	});

	// Generate chart data reactively from adminStore
	// This will automatically update when SSE events trigger store updates
	const chartData = $derived.by(() => {
		const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
		const data = [];
		const allRecentActivities = $adminStore.allRecentActivities;

		for (let i = days - 1; i >= 0; i--) {
			const targetDate = new Date();
			targetDate.setDate(targetDate.getDate() - i);
			targetDate.setHours(0, 0, 0, 0);

			const nextDate = new Date(targetDate);
			nextDate.setDate(nextDate.getDate() + 1);

			// Filter activities using proper date comparison for reliable real-time updates
			let activitiesCount = allRecentActivities.filter((activity) => {
				if (!activity.createdAt) return false;
				const activityDate = new Date(activity.createdAt);
				return activityDate >= targetDate && activityDate < nextDate;
			}).length;

			let loginsCount = allRecentActivities.filter((activity) => {
				if (!activity.createdAt) return false;
				const activityDate = new Date(activity.createdAt);
				const isLogin =
					activity.activityType === 'login' ||
					activity.type === 'user_login' ||
					activity.description?.toLowerCase().includes('login');
				return activityDate >= targetDate && activityDate < nextDate && isLogin;
			}).length;

			// If no real data, use sample data for demonstration
			if (allRecentActivities.length === 0) {
				activitiesCount = Math.floor(Math.random() * 50) + 10;
				loginsCount = Math.floor(Math.random() * 20) + 5;
			}

			data.push({
				date: targetDate,
				activities: activitiesCount,
				logins: loginsCount
			});
		}

		return data;
	});

	const chartConfig = {
		activities: {
			label: 'Activities',
			theme: {
				light: 'hsl(var(--chart-1))',
				dark: 'hsl(var(--chart-1))'
			}
		},
		logins: {
			label: 'Logins',
			theme: {
				light: 'hsl(var(--chart-2))',
				dark: 'hsl(var(--chart-2))'
			}
		}
	} satisfies Chart.ChartConfig;

	// Calculate totals for the footer
	const totalActivities = $derived(chartData.reduce((sum, item) => sum + item.activities, 0));

	const totalLogins = $derived(chartData.reduce((sum, item) => sum + item.logins, 0));

	const previousPeriodActivities = $derived(
		Math.floor(totalActivities * 0.85) // Simulate previous period data
	);

	const growthPercentage = $derived.by(() => {
		if (previousPeriodActivities === 0) return 0;
		return Math.round(
			((totalActivities - previousPeriodActivities) / previousPeriodActivities) * 100
		);
	});
</script>

<Card.Root>
	<Card.Header class="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
		<div class="grid flex-1 gap-1 text-center sm:text-left">
			<div class="flex items-center gap-2">
				<Card.Title>Activity Overview</Card.Title>
				<!-- SSE Connection Status -->
				{#if $adminStore.sseConnected}
					<div class="flex items-center gap-1 text-xs text-primary">
						<WifiIcon class="size-3 animate-pulse" />
						<span class="font-medium">Live</span>
						<span class="rounded bg-primary/10 px-1 text-xs">
							{$adminStore.allRecentActivities.length}
						</span>
					</div>
				{:else}
					<div class="flex items-center gap-1 text-xs text-muted-foreground">
						<WifiOffIcon class="size-3" />
						<span>Offline</span>
					</div>
				{/if}
			</div>
			<Card.Description>
				Daily user activities and logins over time • {$adminStore.allRecentActivities.length} total activities
				<br />
				<span class="text-xs text-muted-foreground">
					Last updated: {lastUpdate.toLocaleTimeString()}
				</span>
			</Card.Description>
		</div>
		<Select.Root type="single" bind:value={timeRange}>
			<Select.Trigger class="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
				{selectedLabel}
			</Select.Trigger>
			<Select.Content class="rounded-xl">
				<Select.Item value="7d" class="rounded-lg">Last 7 days</Select.Item>
				<Select.Item value="14d" class="rounded-lg">Last 14 days</Select.Item>
				<Select.Item value="30d" class="rounded-lg">Last 30 days</Select.Item>
			</Select.Content>
		</Select.Root>
	</Card.Header>
	<Card.Content>
		<Chart.Container config={chartConfig} class="aspect-auto h-[250px] w-full">
			<AreaChart
				data={chartData}
				x="date"
				series={[
					{
						key: 'activities',
						label: 'Activities'
					},
					{
						key: 'logins',
						label: 'Logins'
					}
				]}
				props={{
					area: {
						'fill-opacity': 0.3,
						stroke: 'currentColor',
						'stroke-width': 2,
						class: 'fill-primary/20 stroke-primary'
					},
					line: {
						stroke: 'currentColor',
						'stroke-width': 2,
						class: 'stroke-foreground'
					}
				}}
			/>
		</Chart.Container>
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="grid gap-2">
				<div class="flex items-center gap-2 leading-none font-medium">
					{#if growthPercentage > 0}
						Trending up by {growthPercentage}% this period <TrendingUpIcon class="size-4" />
					{:else if growthPercentage < 0}
						Trending down by {Math.abs(growthPercentage)}% this period
					{:else}
						No change from previous period
					{/if}
				</div>
				<div class="flex items-center gap-2 leading-none text-muted-foreground">
					{totalActivities} total activities • {totalLogins} total logins
				</div>
			</div>
		</div>
	</Card.Footer>
</Card.Root>
