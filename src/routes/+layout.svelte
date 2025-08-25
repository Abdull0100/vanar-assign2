<script lang="ts">
	import '../app.css';
	import type { LayoutData } from './$types';

	export const data: LayoutData = {} as LayoutData;
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Full-stack authentication app with AI chat" />
</svelte:head>

<main class="min-h-screen bg-yellow-50">
	<slot />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #fefce8 0%, #f3f4f6 100%);
	}
</style>