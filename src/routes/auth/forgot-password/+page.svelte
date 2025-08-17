<script lang="ts">
	import { goto } from '$app/navigation';

	let email = '';
	let loading = false;
	let error = '';
	let success = '';

	async function requestPasswordReset() {
		if (!email.trim()) {
			error = 'Please enter your email address.';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			const response = await fetch('/api/auth/reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email: email.trim() })
			});

			const data = await response.json();

			if (response.ok) {
				success = data.message;
				email = '';
			} else {
				error = data.error || 'Failed to send password reset email.';
			}
		} catch (err) {
			error = 'An error occurred while sending the password reset email.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Vanar Chain</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4">
				<span class="text-3xl">🔑</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
			<p class="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
		</div>

		<!-- Reset Form -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			{#if success}
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
						<span class="text-3xl text-green-600">✅</span>
					</div>
					<h2 class="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h2>
					<p class="text-gray-600 mb-6">{success}</p>
					<p class="text-sm text-gray-500">Please check your email and click the reset link to continue.</p>
				</div>
			{:else}
				<form on:submit|preventDefault={requestPasswordReset} class="space-y-6">
					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{error}
						</div>
					{/if}

					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							class="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
							placeholder="Enter your email address"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || !email.trim()}
						class="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
					>
						{#if loading}
							<div class="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2"></div>
							Sending Reset Link...
						{:else}
							<span class="mr-2">📧</span>
							Send Reset Link
						{/if}
					</button>
				</form>

				<div class="mt-6 text-center">
					<a href="/auth/signin" class="text-sm text-blue-600 hover:text-blue-700">
						← Back to Sign In
					</a>
				</div>
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
