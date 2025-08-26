<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	export let activeTab: 'overview' | 'users' | 'activities' = 'overview';
	export let setActiveTab: (tab: 'overview' | 'users' | 'activities') => void;
</script>

<div class="mb-8">
	<h1 class="lg:text-3xl font-bold font-sans text-foreground md:text-md sm:text-sm">Comprehensive Admin Dashboard</h1>
	<p class="mt-2 font-sans">Monitor user activities, sessions, and system analytics</p>
</div>

<div class="mb-8">
	<nav class="flex gap-2">
		<div role="button" tabindex="0" on:click={() => setActiveTab('overview')} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('overview')}>
			<Button
				type="button"
				variant="ghost"
				class={`rounded border-b-2 text-sm font-medium px-1 py-2 ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
			>
				Overview
			</Button>
		</div>
		<div role="button" tabindex="0" on:click={() => setActiveTab('users')} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('users')}>
			<Button
				variant="ghost"
				type="button"
				class={`rounded border-b-2 text-sm font-medium px-1 py-2 ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
			>
				User Management
			</Button>
		</div>
		<div role="button" tabindex="0" on:click={() => setActiveTab('activities')} on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveTab('activities')}>
			<Button
				type="button"
				variant="ghost"
				class={`rounded border-b-2 text-sm font-medium px-1 py-2 ${activeTab === 'activities' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
			>
				Recent Activities
			</Button>
		</div>
	</nav>
	<Separator class="mt-2" />
</div>

