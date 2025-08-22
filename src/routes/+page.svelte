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
							<div class="relative">
								<img 
									src="/4bcb1fb72d1d08efa44efa5ceb712ec7.gif" 
									alt="Vanar AI Assistant" 
									class="w-8 h-8 rounded-lg object-cover animate-bot-glow"
								/>
								<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white"></div>
							</div>
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
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
				<!-- Left Content -->
				<div class="text-left animate-slide-in">
					<h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
						<span class="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
							Full Authentication
						</span>
						<span class="block text-4xl md:text-6xl mt-2">
							& AI Chat
						</span>
					</h1>
					<p class="text-xl text-gray-300 max-w-2xl mb-8 leading-relaxed">
						A complete authentication system with OAuth providers, email verification, password
						reset, and an AI-powered chat interface using Google Gemini.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 items-start">
						{#if !session?.user}
							<button
								on:click={() => navigateTo('/auth/signup')}
								class="dark-button text-lg px-8 py-4 group relative overflow-hidden"
							>
								<span class="relative z-10 flex items-center">
									🚀 Get Started
									<svg class="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
									</svg>
								</span>
								<div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
							<button
								on:click={() => navigateTo('/auth/signin')}
								class="dark-button-secondary text-lg px-8 py-4 group relative overflow-hidden"
							>
								<span class="relative z-10 flex items-center">
									🔐 Sign In
									<svg class="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
									</svg>
								</span>
								<div class="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
							</button>
						{/if}
					</div>
				</div>
				
				<!-- Right Content - GIF Display -->
				<div class="flex justify-center lg:justify-end animate-fade-in" style="animation-delay: 0.3s;">
					<div class="relative">
						<!-- Main GIF Container -->
						<div class="relative w-80 h-80 lg:w-96 lg:h-96 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 shadow-2xl overflow-hidden">
							<img 
								src="/4bcb1fb72d1d08efa44efa5ceb712ec7.gif" 
								alt="Vanar AI Assistant" 
								class="w-full h-full object-cover rounded-3xl"
							/>
							<!-- Overlay gradient -->
							<div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
							
							<!-- Floating elements -->
							<div class="absolute top-4 right-4 w-8 h-8 bg-green-500/80 rounded-full flex items-center justify-center animate-pulse">
								<div class="w-2 h-2 bg-white rounded-full"></div>
							</div>
							<div class="absolute bottom-4 left-4 w-6 h-6 bg-blue-500/80 rounded-full flex items-center justify-center animate-bounce" style="animation-delay: 1s;">
								<div class="w-1.5 h-1.5 bg-white rounded-full"></div>
							</div>
						</div>
						
						<!-- Decorative elements -->
						<div class="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full opacity-20 animate-float"></div>
						<div class="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-full opacity-20 animate-float" style="animation-delay: 2s;"></div>
						
						<!-- Glow effect -->
						<div class="absolute inset-0 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl -z-10 animate-pulse"></div>
					</div>
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
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.1s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300">🔐</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Secure Authentication</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">OAuth with Google & GitHub, email verification, and password reset functionality.</p>
				</div>

				<!-- Feature Card 2 -->
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.2s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style="animation-delay: 1s;">🤖</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">AI Chat Interface</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">Powered by Google Gemini with real-time streaming responses and conversation history.</p>
				</div>

				<!-- Feature Card 3 -->
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.3s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style="animation-delay: 2s;">📊</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Admin Dashboard</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">User management, analytics, and system monitoring with role-based access control.</p>
				</div>

				<!-- Feature Card 4 -->
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.4s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style="animation-delay: 3s;">🎨</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-pink-300 transition-colors duration-300">Modern UI/UX</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">Beautiful dark theme with smooth animations, glass morphism, and responsive design.</p>
				</div>

				<!-- Feature Card 5 -->
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.5s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style="animation-delay: 4s;">⚡</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-yellow-300 transition-colors duration-300">Fast & Secure</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">Built with SvelteKit 5, PostgreSQL, and Drizzle ORM for optimal performance.</p>
				</div>

				<!-- Feature Card 6 -->
				<div class="dark-card animate-fade-in group hover:scale-105 transition-all duration-300" style="animation-delay: 0.6s;">
					<div class="relative">
						<div class="text-4xl mb-4 animate-float group-hover:scale-110 transition-transform duration-300" style="animation-delay: 5s;">🛡️</div>
						<div class="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
							<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
							</svg>
						</div>
					</div>
					<h3 class="text-xl font-semibold text-white mb-3 group-hover:text-red-300 transition-colors duration-300">Production Ready</h3>
					<p class="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">Comprehensive error handling, testing, and deployment configuration included.</p>
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
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.1s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">⚡</div>
					<p class="text-sm text-gray-300 group-hover:text-blue-300 transition-colors duration-300 font-medium">SvelteKit 5</p>
					<div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.2s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">🐘</div>
					<p class="text-sm text-gray-300 group-hover:text-indigo-300 transition-colors duration-300 font-medium">PostgreSQL</p>
					<div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.3s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">🌊</div>
					<p class="text-sm text-gray-300 group-hover:text-cyan-300 transition-colors duration-300 font-medium">Drizzle ORM</p>
					<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.4s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">🔐</div>
					<p class="text-sm text-gray-300 group-hover:text-green-300 transition-colors duration-300 font-medium">Auth.js</p>
					<div class="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.5s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">🤖</div>
					<p class="text-sm text-gray-300 group-hover:text-purple-300 transition-colors duration-300 font-medium">Google Gemini</p>
					<div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
				<div class="dark-card text-center animate-fade-in group hover:scale-110 transition-all duration-300 hover:shadow-2xl" style="animation-delay: 0.6s;">
					<div class="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">🎨</div>
					<p class="text-sm text-gray-300 group-hover:text-teal-300 transition-colors duration-300 font-medium">Tailwind CSS</p>
					<div class="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<footer class="relative z-10 py-16 border-t border-white/10">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<div class="flex items-center justify-center mb-6">
					<div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden">
						<img 
							src="/4bcb1fb72d1d08efa44efa5ceb712ec7.gif" 
							alt="Vanar AI Assistant" 
							class="w-12 h-12 rounded-full object-cover"
						/>
					</div>
				</div>
				<p class="text-gray-400 text-lg font-medium">
					Built with <span class="text-red-400 animate-pulse">❤️</span> using modern web technologies
				</p>
				<div class="mt-4 flex items-center justify-center space-x-2">
					<div class="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
					<div class="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
					<div class="w-2 h-2 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
				</div>
			</div>
		</div>
	</footer>
</div>
