<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	$: error = $page.error;
	$: status = $page.status;

	function getErrorMessage(status: number) {
		switch (status) {
			case 404:
				return {
					title: "Page Not Found",
					message: "The page you're looking for doesn't exist or has been moved.",
					icon: "🤖",
					animation: "animate-bounce"
				};
			case 403:
				return {
					title: "Access Forbidden",
					message: "You don't have permission to access this resource.",
					icon: "🚫",
					animation: "animate-pulse"
				};
			case 500:
				return {
					title: "Server Error",
					message: "Something went wrong on our end. Our AI assistant is working on it!",
					icon: "⚠️",
					animation: "animate-shake"
				};
			default:
				return {
					title: "Something Went Wrong",
					message: "An unexpected error occurred. Don't worry, our team is on it!",
					icon: "😕",
					animation: "animate-float"
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

<div class="min-h-screen bg-animated relative overflow-hidden flex items-center justify-center px-4">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute top-20 left-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-float"></div>
		<div class="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-2xl animate-pulse"></div>
	</div>

	<div class="relative z-10 max-w-2xl w-full text-center">
		<!-- Error Robot -->
		<div class="mb-8">
			<div class="error-robot mb-6 {errorInfo.animation}">
				{errorInfo.icon}
			</div>
		</div>

		<!-- Error Status -->
		<div class="mb-6">
			<h1 class="error-status mb-4">
				{status || 500}
			</h1>
			<h2 class="text-3xl font-bold text-white mb-4">
				{errorInfo.title}
			</h2>
		</div>

		<!-- Error Message -->
		<div class="mb-8">
			<p class="error-details mb-6">
				{errorInfo.message}
			</p>
			
			<!-- Development Details (only show in dev) -->
			{#if error && import.meta.env.DEV}
				<details class="mt-6 text-left">
					<summary class="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
						🔧 Developer Information
					</summary>
					<div class="dark-card text-sm font-mono text-gray-300 overflow-auto">
						<strong>Error:</strong> {error.message || 'Unknown error'}<br>
						{#if (error as any).stack}
							<strong>Stack:</strong><br>
							<pre class="whitespace-pre-wrap text-xs mt-2">{(error as any).stack}</pre>
						{/if}
					</div>
				</details>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
			<button
				on:click={goHome}
				class="dark-button"
			>
				🏠 Go Home
			</button>
			<button
				on:click={goBack}
				class="dark-button-secondary"
			>
				⬅️ Go Back
			</button>
			<button
				on:click={refreshPage}
				class="dark-button-secondary"
			>
				🔄 Refresh
			</button>
		</div>

		<!-- Helpful Suggestions -->
		<div class="mt-12">
			<div class="dark-card">
				<h3 class="text-lg font-semibold text-white mb-4">Need Help?</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
					<div class="text-left">
						<p class="text-gray-400 mb-2">Try these solutions:</p>
						<ul class="text-gray-300 space-y-1">
							<li>• Check the URL for typos</li>
							<li>• Clear your browser cache</li>
							<li>• Try a different browser</li>
						</ul>
					</div>
					<div class="text-left">
						<p class="text-gray-400 mb-2">Still having issues?</p>
						<ul class="text-gray-300 space-y-1">
							<li>• Contact our support team</li>
							<li>• Check our status page</li>
							<li>• Report this issue</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
		20%, 40%, 60%, 80% { transform: translateX(5px); }
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}
</style>
