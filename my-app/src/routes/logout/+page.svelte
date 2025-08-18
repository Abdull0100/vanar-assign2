<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Automatically redirect to login page
	onMount(() => {
		goto('/login?logout=success');
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
		<p class="text-gray-600">Logging out...</p>
	</div>
</div>
