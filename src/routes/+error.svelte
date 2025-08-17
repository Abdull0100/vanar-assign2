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
					icon: "🔍"
				};
			case 403:
				return {
					title: "Access Forbidden",
					message: "You don't have permission to access this resource.",
					icon: "🚫"
				};
			case 500:
				return {
					title: "Server Error",
					message: "Something went wrong on our end. Our developers are working on it!",
					icon: "⚠️"
				};
			default:
				return {
					title: "Something Went Wrong",
					message: "An unexpected error occurred. Don't worry, our team is on it!",
					icon: "😕"
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

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
	<div class="max-w-2xl w-full text-center">
		<!-- Error Icon and Animation -->
		<div class="mb-8">
			<div class="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-red-100 to-orange-100 mb-6 animate-bounce">
				<span class="text-6xl">{errorInfo.icon}</span>
			</div>
		</div>

		<!-- Error Code -->
		<div class="mb-6">
			<h1 class="text-8xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
				{status || 500}
			</h1>
			<h2 class="text-3xl font-bold text-gray-900 mb-4">
				{errorInfo.title}
			</h2>
		</div>

		<!-- Error Message -->
		<div class="mb-8">
			<p class="text-xl text-gray-600 mb-4">
				{errorInfo.message}
			</p>
			
			<!-- Development Details (only show in dev) -->
					{#if error && import.meta.env.DEV}
			<details class="mt-6 text-left">
				<summary class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
					🔧 Developer Information
				</summary>
				<div class="bg-gray-100 rounded-lg p-4 text-sm font-mono text-gray-800 overflow-auto">
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
				class="group inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
			>
				<span class="mr-2 group-hover:animate-pulse">🏠</span>
				Go to Homepage
			</button>

			<button
				on:click={goBack}
				class="group inline-flex items-center px-6 py-3 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-300"
			>
				<span class="mr-2 group-hover:animate-pulse">←</span>
				Go Back
			</button>

			{#if status && status >= 500}
				<button
					on:click={refreshPage}
					class="group inline-flex items-center px-6 py-3 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 transition-all duration-200 border border-green-300"
				>
					<span class="mr-2 group-hover:animate-spin">🔄</span>
					Try Again
				</button>
			{/if}
		</div>

		<!-- Support Information -->
		<div class="mt-12 p-6 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg">
			<h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center justify-center">
				<span class="mr-2">🛠️</span>
				Need Help?
			</h3>
			<p class="text-gray-600 mb-4">
				If you continue experiencing issues, our development team is here to help!
			</p>
			
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
				<div class="flex items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-200">
					<span class="mr-2">📧</span>
					<span class="text-blue-800">Contact Support</span>
				</div>
				<div class="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-200">
					<span class="mr-2">📚</span>
					<span class="text-green-800">Documentation</span>
				</div>
				<div class="flex items-center justify-center p-3 bg-purple-50 rounded-lg border border-purple-200">
					<span class="mr-2">💬</span>
					<span class="text-purple-800">Live Chat</span>
				</div>
			</div>
		</div>

		<!-- Status Message -->
		<div class="mt-8 text-sm text-gray-500">
			<div class="flex items-center justify-center space-x-2">
				<div class="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
				<span>System Status: All services operational</span>
			</div>
			<p class="mt-2">
				Error ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • 
				Time: {new Date().toLocaleString()}
			</p>
		</div>
	</div>
</div>

<style>
	/* Custom animations */
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}
</style>
