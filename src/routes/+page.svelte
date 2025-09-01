<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Hero from '$lib/components/home/Hero.svelte';
	import Features from '$lib/components/home/Features.svelte';
	import TechStack from '$lib/components/home/TechStack.svelte';
	export let data: any;

	let session = data.session;
	let isLoaded = false;

	onMount(() => {
		// Simulate loading time for better UX
		setTimeout(() => {
			isLoaded = true;
		}, 100);
	});

	// Removed forced redirect to dashboard to allow home access while logged in
</script>

<svelte:head>
	<title>Auth App - Full Authentication & AI Chat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navigation user={session?.user ?? null} currentPage="home" />

	{#if isLoaded}
		<Hero isAuthenticated={!!session?.user} />

		<!-- Features Section -->
		<Features />

		<!-- Tech Stack Section -->
		<TechStack />
	{:else}
		<!-- Loading skeleton -->
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="loading-skeleton h-96 rounded-lg mb-8"></div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div class="loading-skeleton h-48 rounded-lg"></div>
				<div class="loading-skeleton h-48 rounded-lg"></div>
				<div class="loading-skeleton h-48 rounded-lg"></div>
			</div>
			<div class="loading-skeleton h-64 rounded-lg"></div>
		</div>
	{/if}
</div>
