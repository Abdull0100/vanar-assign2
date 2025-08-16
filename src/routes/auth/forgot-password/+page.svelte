<script lang="ts">
	import { goto } from '$app/navigation';

	let email = '';
	let loading = false;
	let message = '';
	let messageType = '';

	async function handlePasswordReset() {
		if (!email) {
			message = 'Please enter your email address';
			messageType = 'error';
			return;
		}

		loading = true;
		message = '';
		messageType = '';

		try {
			const response = await fetch('/api/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			if (response.ok) {
				message = 'Password reset link sent to your email. Please check your inbox.';
				messageType = 'success';
				email = '';
			} else {
				const data = await response.json();
				message = data.error || 'Failed to send password reset email';
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
	<title>Forgot Password - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Reset your password</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Enter your email address and we'll send you a link to reset your password.
		</p>
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

			<form class="space-y-6" on:submit|preventDefault={handlePasswordReset}>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							bind:value={email}
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
						{loading ? 'Sending...' : 'Send reset link'}
					</button>
				</div>
			</form>

			<div class="mt-6 text-center">
				<a href="/auth/signin" class="font-medium text-indigo-600 hover:text-indigo-500">
					Back to Sign In
				</a>
			</div>
		</div>
	</div>
</div>
