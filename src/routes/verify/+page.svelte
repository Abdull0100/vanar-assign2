<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Get the token from the current URL if it exists
		const params =
			typeof window !== 'undefined'
				? new URLSearchParams(window.location.search)
				: new URLSearchParams();
		const token = params.get('token');
		const redirectUrl = token ? `/auth/verify?token=${token}` : '/auth/verify';
		goto(redirectUrl);
	});
</script>

<svelte:head>
	<title>Redirecting to Verification - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
				></div>
				<p class="text-gray-600">Redirecting to verification page...</p>
			</div>
		</div>
	</div>
</div>
