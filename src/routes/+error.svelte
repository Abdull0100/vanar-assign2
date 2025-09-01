<script lang="ts">
	export let data: any;
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let status = data?.status || 500;
	let error = data?.error;
	let message = 'Verifying your email...';
	let token = '';
	let email = '';
	let resendDisabled = false;
	let resendCountdown = 60;
	let resendLoading = false;
	let resendError = '';
	let resendSuccess = '';

	function getErrorMessage(status: number) {
		switch (status) {
			case 404:
				return {
					title: 'Page Not Found',
					message: "The page you're looking for doesn't exist or has been moved.",
					icon: '🔍'
				};
			case 403:
				return {
					title: 'Access Forbidden',
					message: "You don't have permission to access this resource.",
					icon: '🚫'
				};
			case 500:
				return {
					title: 'Server Error',
					message: 'Something went wrong on our end. Our developers are working on it!',
					icon: '⚠️'
				};
			default:
				return {
					title: 'Something Went Wrong',
					message: "An unexpected error occurred. Don't worry, our team is on it!",
					icon: '😕'
				};
		}
	}

	$: errorInfo = getErrorMessage(status || 500);

	function goHome() {
		goto('/');
	}

	function goBack() {
		history.back();
	}

	function refreshPage() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Error {status || 500} - Auth App</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4"
>
	<div class="w-full max-w-2xl text-center">
		<!-- Error Icon and Animation -->
		<div class="mb-8">
			<div
				class="mb-6 inline-flex h-32 w-32 animate-bounce items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-orange-100"
			>
				<span class="text-6xl">{errorInfo.icon}</span>
			</div>
		</div>

		<!-- Error Code -->
		<div class="mb-6">
			<h1
				class="mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-8xl font-bold text-transparent"
			>
				{status || 500}
			</h1>
			<h2 class="mb-4 text-3xl font-bold text-gray-900">
				{errorInfo.title}
			</h2>
		</div>

		<!-- Error Message -->
		<div class="mb-8">
			<p class="mb-4 text-xl text-gray-600">
				{errorInfo.message}
			</p>

			<!-- Development Details (only show in dev) -->
			{#if error && import.meta.env.DEV}
				<details class="mt-6 text-left">
					<summary class="mb-2 cursor-pointer text-sm text-gray-500 hover:text-gray-700">
						🔧 Developer Information
					</summary>
					<div class="overflow-auto rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800">
						<strong>Error:</strong>
						{error.message || 'Unknown error'}<br />
						{#if (error as any).stack}
							<strong>Stack:</strong><br />
							<pre class="mt-2 text-xs whitespace-pre-wrap">{(error as any).stack}</pre>
						{/if}
					</div>
				</details>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
			<button
				on:click={goHome}
				class="group inline-flex transform items-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
			>
				<span class="mr-2 group-hover:animate-pulse">🏠</span>
				Go to Homepage
			</button>

			<button
				on:click={goBack}
				class="group inline-flex items-center rounded-lg border border-gray-300 bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200"
			>
				<span class="mr-2 group-hover:animate-pulse">←</span>
				Go Back
			</button>

			{#if status && status >= 500}
				<button
					on:click={refreshPage}
					class="group inline-flex items-center rounded-lg border border-green-300 bg-green-100 px-6 py-3 font-medium text-green-700 transition-all duration-200 hover:bg-green-200"
				>
					<span class="mr-2 group-hover:animate-spin">🔄</span>
					Try Again
				</button>
			{/if}
		</div>

		<!-- Support Information -->
		<div class="mt-12 rounded-xl border border-gray-200 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
			<h3 class="mb-3 flex items-center justify-center text-lg font-semibold text-gray-900">
				<span class="mr-2">🛠️</span>
				Need Help?
			</h3>
			<p class="mb-4 text-gray-600">
				If you continue experiencing issues, our development team is here to help!
			</p>

			<div class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
				<div
					class="flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3"
				>
					<span class="mr-2">📧</span>
					<span class="text-blue-800">Contact Support</span>
				</div>
				<div
					class="flex items-center justify-center rounded-lg border border-green-200 bg-green-50 p-3"
				>
					<span class="mr-2">📚</span>
					<span class="text-green-800">Documentation</span>
				</div>
				<div
					class="flex items-center justify-center rounded-lg border border-purple-200 bg-purple-50 p-3"
				>
					<span class="mr-2">💬</span>
					<span class="text-purple-800">Live Chat</span>
				</div>
			</div>
		</div>

		<!-- Status Message -->
		<div class="mt-8 text-sm text-gray-500">
			<div class="flex items-center justify-center space-x-2">
				<div class="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
				<span>System Status: All services operational</span>
			</div>
			<p class="mt-2">
				Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • Time: {new Date().toLocaleString()}
			</p>
		</div>
	</div>
</div>

<style>
	/* Custom animations */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}
</style>
