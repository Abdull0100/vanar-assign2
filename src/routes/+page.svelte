<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import Hero from '$lib/components/home/Hero.svelte';
	import Features from '$lib/components/home/Features.svelte';
	import TechStack from '$lib/components/home/TechStack.svelte';
	export let data: any;

	let session = data.session;

	// Removed forced redirect to dashboard to allow home access while logged in
</script>

<svelte:head>
	<title>Auth App - Full Authentication & AI Chat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navigation user={session?.user ?? null} currentPage="home" />

	<Hero isAuthenticated={!!session?.user} />

	<!-- Features Section -->
	<Features />

	<!-- Tech Stack Section -->
	<TechStack />
</div>
