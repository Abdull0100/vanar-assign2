<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let status = 'verifying';
	let message = 'Verifying your email...';
	let token = '';
	let email = '';
	let resendDisabled = false;
	let resendCountdown = 60;
	let resendLoading = false;
	let resendError = '';
	let resendSuccess = '';

	onMount(async () => {
		token = $page.url.searchParams.get('token') || '';

		if (!token) {
			status = 'no-token';
			message = 'No verification token provided';
			return;
		}

		try {
			const response = await fetch('/api/auth/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});

			if (response.ok) {
				const data = await response.json();
				status = 'success';
				message = 'Email verified successfully! Redirecting to sign in...';
				email = data.email || '';
				setTimeout(() => goto('/auth/signin'), 2000);
			} else {
				const data = await response.json();
				status = 'error';
				message = data.error || 'Verification failed. Please try again or contact support.';
				// Try to get email from expired token for resend functionality
				if (data.email) {
					email = data.email;
				}
			}
		} catch (error) {
			status = 'error';
			message = 'An error occurred during verification.';
		}
	});

	async function handleResendVerification() {
		if (!email) {
			resendError = 'Unable to determine email address. Please try signing up again.';
			return;
		}

		resendLoading = true;
		resendError = '';
		resendSuccess = '';

		try {
			const response = await fetch('/api/auth/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.toLowerCase().trim() })
			});

			const data = await response.json();

			if (response.ok) {
				resendSuccess = 'Verification email sent successfully!';
				startResendCooldown();
			} else {
				resendError = data.error || 'Failed to send verification email';
			}
		} catch (error) {
			resendError = 'An error occurred. Please try again.';
		} finally {
			resendLoading = false;
		}
	}

	function startResendCooldown() {
		resendDisabled = true;
		resendCountdown = 60;
		
		const interval = setInterval(() => {
			resendCountdown--;
			if (resendCountdown <= 0) {
				resendDisabled = false;
				clearInterval(interval);
			}
		}, 1000);
	}
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
			{#if status === 'verifying'}
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"
					></div>
					<p class="text-gray-600">{message}</p>
				</div>
			{:else if status === 'success'}
				<div class="text-center">
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
				</div>
			{:else if status === 'no-token'}
				<div class="text-center">
					<div
						class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100"
					>
						<svg class="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<p class="font-medium text-yellow-600">{message}</p>
					<p class="mt-2 text-sm text-gray-600">
						Please check your email for the verification link, or use the form below to request a new one.
					</p>
				</div>
			{:else}
				<div class="text-center">
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
					<p class="mt-2 text-sm text-gray-600">
						The verification link may have expired. Please request a new one below.
					</p>
				</div>
			{/if}

			{#if status !== 'success'}
				<div class="mt-6 border-t border-gray-200 pt-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">Need a new verification email?</h3>
					
					{#if !email}
						<div class="mb-4 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700 text-sm">
							Unable to determine your email address. Please try signing up again or contact support.
						</div>
					{:else}
						{#if resendError}
							<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
								{resendError}
							</div>
						{/if}

						{#if resendSuccess}
							<div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
								{resendSuccess}
							</div>
						{/if}

						<form class="space-y-4" on:submit|preventDefault={handleResendVerification}>
							<button
								type="submit"
								disabled={resendDisabled || resendLoading}
								class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if resendLoading}
									Sending...
								{:else if resendDisabled}
									Resend in {resendCountdown}s
								{:else}
									Resend verification email
								{/if}
							</button>
						</form>
					{/if}
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
