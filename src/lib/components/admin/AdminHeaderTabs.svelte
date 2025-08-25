<script lang="ts">
	export let activeTab: 'overview' | 'users' | 'activities' = 'overview';
	export let setActiveTab: (tab: 'overview' | 'users' | 'activities') => void;
</script>

<div class="mb-8">
	<h1 class="text-3xl font-bold text-gray-900">Comprehensive Admin Dashboard</h1>
	<p class="mt-2 text-gray-600">Monitor user activities, sessions, and system analytics</p>
</div>

<div class="border-b border-gray-200 mb-8">
	<nav class="-mb-px flex space-x-8">
		<button
			on:click={() => setActiveTab('overview')}
			class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
		>
			Overview
		</button>
		<button
			on:click={() => setActiveTab('users')}
			class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
		>
			User Management
		</button>
		<button
			on:click={() => setActiveTab('activities')}
			class="py-2 px-1 border-b-2 font-medium text-sm {activeTab === 'activities' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
		>
			Recent Activities
		</button>
	</nav>
</div>


