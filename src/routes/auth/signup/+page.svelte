<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Redirect to the combined authentication page
		goto('/auth/signin');
	});
</script>

<svelte:head>
	<title>Redirecting... - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
		<p class="text-neutral-600">Redirecting to authentication page...</p>
	</div>
</div>
