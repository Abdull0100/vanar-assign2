<script lang="ts">
	import { onMount } from 'svelte';

	export let users: any[] = [];
	export let conversations: any[] = [];
	export let chatMessages: any[] = [];
	export let sessions: any[] = [];
	export let userActivities: any[] = [];

	let userRoleData: any;
	let activityTrendData: any;
	let conversationTrendData: any;
	let sessionData: any;

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

		// Conversation Trend (Last 7 days)
		const conversationCounts = last7Days.map(date => {
			return conversations.filter(conv => 
				conv.createdAt.startsWith(date)
			).length;
		});

		conversationTrendData = {
			labels: last7Days.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
			data: conversationCounts,
			max: Math.max(...conversationCounts, 1)
		};

		// Session Status Distribution
		const sessionCounts = {
			active: sessions.filter(s => s.isActive).length,
			ended: sessions.filter(s => !s.isActive).length
		};

		sessionData = {
			active: sessionCounts.active,
			ended: sessionCounts.ended,
			total: sessionCounts.active + sessionCounts.ended
		};
	}

	function calculateAngle(percentage: number) {
		return (percentage * 360) / 100;
	}

	function createPiePath(percentage: number, startAngle: number = 0) {
		const angle = calculateAngle(percentage);
		const endAngle = startAngle + angle;
		
		const radius = 60;
		const centerX = 80;
		const centerY = 80;
		
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

<div class="space-y-6">
	<!-- User Activity Trend Chart -->
	<div class="bg-white rounded-lg shadow p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">User Activity Trend (Last 7 Days)</h3>
		<div class="h-64 flex items-end justify-between px-4 pb-4">
			{#if activityTrendData}
				{#each activityTrendData.data as value, i}
					<div class="flex flex-col items-center">
						<div 
							class="bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
							style="width: 30px; height: {Math.max((value / activityTrendData.max) * 200, 4)}px;"
						></div>
						<span class="text-xs text-gray-600 mt-2">{activityTrendData.labels[i]}</span>
						<span class="text-xs font-medium text-gray-900">{value}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Conversation Trend Chart -->
	<div class="bg-white rounded-lg shadow p-6">
		<h3 class="text-lg font-medium text-gray-900 mb-4">Conversation Trend (Last 7 Days)</h3>
		<div class="h-64 flex items-end justify-between px-4 pb-4">
			{#if conversationTrendData}
				{#each conversationTrendData.data as value, i}
					<div class="flex flex-col items-center">
						<div 
							class="bg-green-500 rounded-t transition-all duration-300 hover:bg-green-600"
							style="width: 30px; height: {Math.max((value / conversationTrendData.max) * 200, 4)}px;"
						></div>
						<span class="text-xs text-gray-600 mt-2">{conversationTrendData.labels[i]}</span>
						<span class="text-xs font-medium text-gray-900">{value}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Charts Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		<!-- User Role Distribution -->
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">User Role Distribution</h3>
			<div class="flex items-center justify-center">
				{#if userRoleData}
					<div class="relative">
						<svg width="160" height="160" class="transform -rotate-90">
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
								<div class="text-2xl font-bold text-gray-900">{userRoleData.total}</div>
								<div class="text-sm text-gray-600">Total Users</div>
							</div>
						</div>
					</div>
					<div class="ml-6 space-y-2">
						<div class="flex items-center">
							<div class="w-4 h-4 bg-purple-500 rounded mr-2"></div>
							<span class="text-sm">Admin: {userRoleData.admin}</span>
						</div>
						<div class="flex items-center">
							<div class="w-4 h-4 bg-blue-500 rounded mr-2"></div>
							<span class="text-sm">Users: {userRoleData.user}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Session Status Distribution -->
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Session Status</h3>
			<div class="flex items-center justify-center">
				{#if sessionData}
					<div class="relative">
						<svg width="160" height="160" class="transform -rotate-90">
							{#if sessionData.active > 0}
								<path 
									d={createPiePath((sessionData.active / sessionData.total) * 100)} 
									fill="#22c55e" 
									class="transition-all duration-300 hover:opacity-80"
								/>
							{/if}
							{#if sessionData.ended > 0}
								<path 
									d={createPiePath((sessionData.ended / sessionData.total) * 100, (sessionData.active / sessionData.total) * 360)} 
									fill="#6b7280" 
									class="transition-all duration-300 hover:opacity-80"
								/>
							{/if}
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="text-center">
								<div class="text-2xl font-bold text-gray-900">{sessionData.total}</div>
								<div class="text-sm text-gray-600">Total Sessions</div>
							</div>
						</div>
					</div>
					<div class="ml-6 space-y-2">
						<div class="flex items-center">
							<div class="w-4 h-4 bg-green-500 rounded mr-2"></div>
							<span class="text-sm">Active: {sessionData.active}</span>
						</div>
						<div class="flex items-center">
							<div class="w-4 h-4 bg-gray-500 rounded mr-2"></div>
							<span class="text-sm">Ended: {sessionData.ended}</span>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Activity Summary -->
		<div class="bg-white rounded-lg shadow p-6">
			<h3 class="text-lg font-medium text-gray-900 mb-4">Activity Summary</h3>
			<div class="space-y-4">
				<div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
					<span class="text-sm font-medium text-blue-900">Total Activities</span>
					<span class="text-lg font-bold text-blue-600">{userActivities.length}</span>
				</div>
				<div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
					<span class="text-sm font-medium text-green-900">Total Conversations</span>
					<span class="text-lg font-bold text-green-600">{conversations.length}</span>
				</div>
				<div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
					<span class="text-sm font-medium text-purple-900">Total Messages</span>
					<span class="text-lg font-bold text-purple-600">{chatMessages.length}</span>
				</div>
			</div>
		</div>
	</div>
</div>
