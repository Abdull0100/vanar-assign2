<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let newPassword = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = '';

	let token: string | null = null;

	onMount(() => {
		const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
		token = params.get('token');
		if (!token) {
			error = 'No reset token provided. Please use the link from your email.';
		}
	});

	async function resetPassword() {
		if (!token) {
			error = 'No reset token provided.';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		if (newPassword.length < 8) {
			error = 'Password must be at least 8 characters long.';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/auth/reset/confirm', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					token,
					password: newPassword
				})
			});

			const data = await response.json();

			if (response.ok) {
				success = data.message;
				setTimeout(() => {
					goto('/auth/signin');
				}, 3000);
			} else {
				error = data.error || 'Failed to reset password.';
			}
		} catch (err) {
			error = 'An error occurred while resetting your password.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Vanar Chain</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
				<span class="text-3xl">🔐</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
			<p class="text-gray-600">Enter your new password to complete the reset process</p>
		</div>

		<!-- Reset Form -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			{#if !token}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
						<span class="text-3xl text-red-600">⚠️</span>
					</div>
					<h2 class="text-xl font-semibold text-gray-900 mb-2">Invalid Reset Link</h2>
					<p class="text-gray-600 mb-6">{error}</p>
					<a href="/auth/forgot-password" class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
						Request New Reset
					</a>
				</div>
			{:else}
				{#if success}
					<div class="text-center">
						<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
							<span class="text-3xl text-green-600">✅</span>
						</div>
						<h2 class="text-xl font-semibold text-gray-900 mb-2">Password Reset Successfully!</h2>
						<p class="text-gray-600 mb-6">{success}</p>
						<p class="text-sm text-gray-500">Redirecting to sign in page...</p>
					</div>
				{:else}
					<form on:submit|preventDefault={resetPassword} class="space-y-6">
						{#if error}
							<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
								{error}
							</div>
						{/if}

						<div>
							<label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
								New Password
							</label>
							<input
								type="password"
								id="newPassword"
								bind:value={newPassword}
								required
								minlength="8"
								class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
								placeholder="Enter your new password"
							/>
							<p class="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
						</div>

						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
								Confirm New Password
							</label>
							<input
								type="password"
								id="confirmPassword"
								bind:value={confirmPassword}
								required
								minlength="8"
								class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
								placeholder="Confirm your new password"
							/>
						</div>

						<button
							type="submit"
							disabled={loading || !newPassword || !confirmPassword}
							class="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
						>
							{#if loading}
								<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2"></div>
								Resetting Password...
							{:else}
								<span class="mr-2">🔐</span>
								Reset Password
							{/if}
						</button>
					</form>

					<div class="mt-6 text-center">
						<a href="/auth/signin" class="text-sm text-blue-600 hover:text-blue-700">
							← Back to Sign In
						</a>
					</div>
				{/if}
			{/if}
		</div>

		<!-- Footer -->
		<div class="text-center mt-8">
			<p class="text-sm text-gray-500">
				© 2025  Vanar Chain. The Chain That Thinks.
			</p>
		</div>
	</div>
</div>
