<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let status = 'verifying';
	let message = 'Verifying your email...';
	let token = '';

	onMount(async () => {
		token = $page.url.searchParams.get('token') || '';

		if (!token) {
			status = 'error';
			message = 'Invalid verification link';
			return;
		}

		try {
			const response = await fetch('/api/auth/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			if (response.ok) {
				status = 'success';
				message = 'Email verified successfully! Redirecting to sign in...';
				setTimeout(() => goto('/auth/signin'), 2000);
			} else {
				status = 'error';
				message = 'Verification failed. Please try again or contact support.';
			}
		} catch (error) {
			status = 'error';
			message = 'An error occurred during verification.';
		}
	});
</script>

<svelte:head>
	<title>Verify Email - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Email Verification</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<div class="text-center">
				{#if status === 'verifying'}
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
					></div>
					<p class="text-gray-600">{message}</p>
				{:else if status === 'success'}
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
					>
						<svg
							class="h-6 w-6 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
					<p class="font-medium text-green-600">{message}</p>
				{:else}
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
					>
						<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<p class="font-medium text-red-600">{message}</p>
				{/if}
			</div>

			<div class="mt-6 text-center">
				<a href="/auth/signin" class="font-medium text-indigo-600 hover:text-indigo-500">
					Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
