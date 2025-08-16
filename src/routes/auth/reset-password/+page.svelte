<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let password = '';
	let confirmPassword = '';
	let loading = false;
	let message = '';
	let messageType = '';
	let token = '';
	let isValidToken = false;

	onMount(async () => {
		token = $page.url.searchParams.get('token') || '';

		if (!token) {
			message = 'Invalid reset link';
			messageType = 'error';
			return;
		}

		// Validate token
		try {
			const response = await fetch('/api/auth/validate-reset-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			if (response.ok) {
				isValidToken = true;
			} else {
				message = 'Invalid or expired reset link';
				messageType = 'error';
			}
		} catch (error) {
			message = 'An error occurred while validating the link';
			messageType = 'error';
		}
	});

	async function handlePasswordReset() {
		if (password !== confirmPassword) {
			message = 'Passwords do not match';
			messageType = 'error';
			return;
		}

		if (password.length < 6) {
			message = 'Password must be at least 6 characters long';
			messageType = 'error';
			return;
		}

		loading = true;
		message = '';
		messageType = '';

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, password })
			});

			if (response.ok) {
				message = 'Password reset successfully! Redirecting to sign in...';
				messageType = 'success';
				setTimeout(() => goto('/auth/signin'), 2000);
			} else {
				const data = await response.json();
				message = data.error || 'Failed to reset password';
				messageType = 'error';
			}
		} catch (error) {
			message = 'An error occurred. Please try again.';
			messageType = 'error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			{#if message}
				<div
					class="mb-4 rounded-md p-4 {messageType === 'success'
						? 'border border-green-200 bg-green-50 text-green-700'
						: 'border border-red-200 bg-red-50 text-red-700'}"
				>
					{message}
				</div>
			{/if}

			{#if isValidToken}
				<form class="space-y-6" on:submit|preventDefault={handlePasswordReset}>
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700">
							New Password
						</label>
						<div class="mt-1">
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								bind:value={password}
								class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
							Confirm New Password
						</label>
						<div class="mt-1">
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								bind:value={confirmPassword}
								class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading}
							class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							{loading ? 'Resetting...' : 'Reset Password'}
						</button>
					</div>
				</form>
			{:else if !message}
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
					></div>
					<p class="text-gray-600">Validating reset link...</p>
				</div>
			{/if}

			<div class="mt-6 text-center">
				<a href="/auth/signin" class="font-medium text-indigo-600 hover:text-indigo-500">
					Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
