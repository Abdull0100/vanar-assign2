<script lang="ts">
	import '../app.css';
	import { darkMode } from '$lib/stores/darkMode';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';

	export const data: LayoutData = {} as LayoutData;

	// Initialize dark mode when the app loads
	onMount(() => {
		darkMode.init();
	});
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Full-stack authentication app with AI chat" />
</svelte:head>

<main>
	<slot />
</main>

