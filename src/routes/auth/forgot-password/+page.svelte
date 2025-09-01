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

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4"
>
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div
				class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100"
			>
				<span class="text-3xl">🔑</span>
			</div>
			<h1 class="mb-2 text-3xl font-bold text-gray-900">Forgot Password?</h1>
			<p class="text-gray-600">
				Enter your email address and we'll send you a link to reset your password
			</p>
		</div>

		<!-- Reset Form -->
		<div class="rounded-2xl bg-white p-8 shadow-xl">
			{#if success}
				<div class="text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
					>
						<span class="text-3xl text-green-600">✅</span>
					</div>
					<h2 class="mb-2 text-xl font-semibold text-gray-900">Check Your Email</h2>
					<p class="mb-6 text-gray-600">{success}</p>
					<p class="text-sm text-gray-500">
						Please check your email and click the reset link to continue.
					</p>
				</div>
			{:else}
				<form on:submit|preventDefault={requestPasswordReset} class="space-y-6">
					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
							{error}
						</div>
					{/if}

					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
							Email Address
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							class="block w-full rounded-lg border-gray-300 shadow-sm transition-colors focus:border-blue-500 focus:ring-blue-500"
							placeholder="Enter your email address"
						/>
					</div>

					<button
						type="submit"
						disabled={loading || !email.trim()}
						class="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<div class="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
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
		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500">© 2025 Vanar Chain. The Chain That Thinks.</p>
		</div>
	</div>
</div>
