<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	$: session = $page.data.session;

	onMount(() => {
		// Redirect authenticated users to dashboard
		if (session?.user) {
			goto('/dashboard');
		}
	});

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<svelte:head>
	<title>Auth App - Full Authentication & AI Chat</title>
</svelte:head>

<div class="min-h-screen bg-animated relative overflow-hidden">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
		<div class="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>
	</div>

	<!-- Navigation -->
	<nav class="chatbot-nav relative z-10">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between items-center">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<h1 class="text-xl font-bold text-white flex items-center gap-2">
							<span class="text-2xl animate-bot-glow">🤖</span>
							Auth App
						</h1>
					</div>
				</div>
				<div class="flex items-center space-x-4">
					{#if session?.user}
						<span class="text-sm text-gray-300">
							Welcome, {session.user.name || session.user.email}
						</span>
						<button
							on:click={() => navigateTo('/dashboard')}
							class="dark-button"
						>
							Dashboard
						</button>
					{:else}
						<button
							on:click={() => navigateTo('/auth/signin')}
							class="dark-button-secondary"
						>
							Sign In
						</button>
						<button
							on:click={() => navigateTo('/auth/signup')}
							class="dark-button"
						>
							Sign Up
						</button>
					{/if}
				</div>
			</div>
		</div>
	</nav>

	<!-- Hero Section -->
	<div class="relative z-10">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
			<div class="text-center animate-slide-in">
				<h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
					<span class="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
						Full Authentication
					</span>
					<span class="block text-4xl md:text-6xl mt-2">
						& AI Chat
					</span>
				</h1>
				<p class="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
					A complete authentication system with OAuth providers, email verification, password
					reset, and an AI-powered chat interface using Google Gemini.
				</p>
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					{#if !session?.user}
						<button
							on:click={() => navigateTo('/auth/signup')}
							class="dark-button text-lg px-8 py-4"
						>
							🚀 Get Started
						</button>
						<button
							on:click={() => navigateTo('/auth/signin')}
							class="dark-button-secondary text-lg px-8 py-4"
						>
							🔐 Sign In
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="relative z-10 py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-bold text-white mb-4">Powerful Features</h2>
				<p class="text-xl text-gray-300">Everything you need for modern authentication</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<!-- Feature Card 1 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.1s;">
					<div class="text-4xl mb-4 animate-float">🔐</div>
					<h3 class="text-xl font-semibold text-white mb-3">Secure Authentication</h3>
					<p class="text-gray-300">OAuth with Google & GitHub, email verification, and password reset functionality.</p>
				</div>

				<!-- Feature Card 2 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.2s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 1s;">🤖</div>
					<h3 class="text-xl font-semibold text-white mb-3">AI Chat Interface</h3>
					<p class="text-gray-300">Powered by Google Gemini with real-time streaming responses and conversation history.</p>
				</div>

				<!-- Feature Card 3 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.3s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 2s;">📊</div>
					<h3 class="text-xl font-semibold text-white mb-3">Admin Dashboard</h3>
					<p class="text-gray-300">User management, analytics, and system monitoring with role-based access control.</p>
				</div>

				<!-- Feature Card 4 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.4s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 3s;">🎨</div>
					<h3 class="text-xl font-semibold text-white mb-3">Modern UI/UX</h3>
					<p class="text-gray-300">Beautiful dark theme with smooth animations, glass morphism, and responsive design.</p>
				</div>

				<!-- Feature Card 5 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.5s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 4s;">⚡</div>
					<h3 class="text-xl font-semibold text-white mb-3">Fast & Secure</h3>
					<p class="text-gray-300">Built with SvelteKit 5, PostgreSQL, and Drizzle ORM for optimal performance.</p>
				</div>

				<!-- Feature Card 6 -->
				<div class="dark-card animate-fade-in" style="animation-delay: 0.6s;">
					<div class="text-4xl mb-4 animate-float" style="animation-delay: 5s;">🛡️</div>
					<h3 class="text-xl font-semibold text-white mb-3">Production Ready</h3>
					<p class="text-gray-300">Comprehensive error handling, testing, and deployment configuration included.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Tech Stack Section -->
	<div class="relative z-10 py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-bold text-white mb-4">Built With</h2>
				<p class="text-xl text-gray-300">Modern technologies for the best experience</p>
			</div>
			
			<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.1s;">
					<div class="text-3xl mb-2">⚡</div>
					<p class="text-sm text-gray-300">SvelteKit 5</p>
				</div>
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.2s;">
					<div class="text-3xl mb-2">🐘</div>
					<p class="text-sm text-gray-300">PostgreSQL</p>
				</div>
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.3s;">
					<div class="text-3xl mb-2">🌊</div>
					<p class="text-sm text-gray-300">Drizzle ORM</p>
				</div>
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.4s;">
					<div class="text-3xl mb-2">🔐</div>
					<p class="text-sm text-gray-300">Auth.js</p>
				</div>
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.5s;">
					<div class="text-3xl mb-2">🤖</div>
					<p class="text-sm text-gray-300">Google Gemini</p>
				</div>
				<div class="dark-card text-center animate-fade-in" style="animation-delay: 0.6s;">
					<div class="text-3xl mb-2">🎨</div>
					<p class="text-sm text-gray-300">Tailwind CSS</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<footer class="relative z-10 py-12 border-t border-white/10">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<p class="text-gray-400">
					Built with ❤️ using modern web technologies
				</p>
			</div>
		</div>
	</footer>
</div>
