<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	export let activeTab: 'overview' | 'users' | 'activities' = 'overview';
	export let setActiveTab: (tab: 'overview' | 'users' | 'activities') => void;

	function handleTabClick(tab: 'overview' | 'users' | 'activities') {
		setActiveTab(tab);
	}
</script>

<div class="mb-8">
	<h1 class="lg:text-3xl font-bold font-sans text-foreground md:text-md sm:text-sm">Comprehensive Admin Dashboard</h1>
	<p class="mt-2 font-sans">Monitor user activities, sessions, and system analytics</p>
</div>

<div class="mb-8">
	<nav class="flex gap-2">
		<button
			type="button"
			class="px-4 py-2 text-sm font-medium rounded border-b-2 transition-colors duration-200 {activeTab === 'overview' 
				? 'border-primary text-primary bg-primary/10' 
				: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50'}"
			on:click={() => handleTabClick('overview')}
		>
			Overview
		</button>
		<button
			type="button"
			class="px-4 py-2 text-sm font-medium rounded border-b-2 transition-colors duration-200 {activeTab === 'users' 
				? 'border-primary text-primary bg-primary/10' 
				: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50'}"
			on:click={() => handleTabClick('users')}
		>
			User Management
		</button>
		<button
			type="button"
			class="px-4 py-2 text-sm font-medium rounded border-b-2 transition-colors duration-200 {activeTab === 'activities' 
				? 'border-primary text-primary bg-primary/10' 
				: 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50'}"
			on:click={() => handleTabClick('activities')}
		>
			Recent Activities
		</button>
	</nav>
	<Separator class="mt-2" />
</div>

