<script lang="ts">
	import { onMount } from 'svelte';

	export let users: any[] = [];
	export let userActivities: any[] = [];

	let userRoleData: any;
	let activityTrendData: any;

	onMount(() => {
		generateChartData();
	});

	function generateChartData() {
		// User Role Distribution
		const roleCounts = {
			admin: users.filter(u => u.role === 'admin').length,
			user: users.filter(u => u.role === 'user').length
		};

		userRoleData = {
			admin: roleCounts.admin,
			user: roleCounts.user,
			total: roleCounts.admin + roleCounts.user
		};

		// Activity Trend (Last 7 days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - i);
			return date.toISOString().split('T')[0];
		}).reverse();

		const activityCounts = last7Days.map(date => {
			return userActivities.filter(activity => 
				activity.createdAt.startsWith(date)
			).length;
		});

		activityTrendData = {
			labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
			data: activityCounts,
			max: Math.max(...activityCounts, 1)
		};
	}

	function createPiePath(percentage: number, startAngle: number = 0) {
		const angle = (percentage * 360) / 100;
		const endAngle = startAngle + angle;
		
		const radius = 50;
		const centerX = 70;
		const centerY = 70;
		
		const startRad = (startAngle - 90) * Math.PI / 180;
		const endRad = (endAngle - 90) * Math.PI / 180;
		
		const x1 = centerX + radius * Math.cos(startRad);
		const y1 = centerY + radius * Math.sin(startRad);
		const x2 = centerX + radius * Math.cos(endRad);
		const y2 = centerY + radius * Math.sin(endRad);
		
		const largeArcFlag = angle > 180 ? 1 : 0;
		
		return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- User Role Distribution -->
	<div class="bg-white rounded-lg shadow p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
		<div class="flex items-center justify-center">
			{#if userRoleData}
				<div class="relative">
					<svg width="140" height="140" class="transform -rotate-90">
						{#if userRoleData.admin > 0}
							<path 
								d={createPiePath((userRoleData.admin / userRoleData.total) * 100)} 
								fill="#9333ea" 
								class="transition-all duration-300 hover:opacity-80"
							/>
						{/if}
						{#if userRoleData.user > 0}
							<path 
								d={createPiePath((userRoleData.user / userRoleData.total) * 100, (userRoleData.admin / userRoleData.total) * 360)} 
								fill="#3b82f6" 
								class="transition-all duration-300 hover:opacity-80"
							/>
						{/if}
					</svg>
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center">
							<div class="text-xl font-bold text-gray-900">{userRoleData.total}</div>
							<div class="text-xs text-gray-600">Total</div>
						</div>
					</div>
				</div>
				<div class="ml-4 space-y-2">
					<div class="flex items-center">
						<div class="w-3 h-3 bg-purple-500 rounded mr-2"></div>
						<span class="text-sm">Admin: {userRoleData.admin}</span>
					</div>
					<div class="flex items-center">
						<div class="w-3 h-3 bg-blue-500 rounded mr-2"></div>
						<span class="text-sm">Users: {userRoleData.user}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Activity Trend -->
	<div class="bg-white rounded-lg shadow p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Activity Trend (Last 7 Days)</h3>
		<div class="h-48 flex items-end justify-between px-4 pb-4">
			{#if activityTrendData}
				{#each activityTrendData.data as value, i}
					<div class="flex flex-col items-center">
						<div 
							class="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
							style="width: 20px; height: {Math.max((value / activityTrendData.max) * 150, 4)}px;"
						></div>
						<span class="text-xs text-gray-600 mt-2">{activityTrendData.labels[i]}</span>
						<span class="text-xs font-medium text-gray-900">{value}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
