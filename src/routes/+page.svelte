
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

    export let data: any;

	let session = data.session;

	// Removed forced redirect to dashboard to allow home access while logged in
</script>

<svelte:head>
	<title>Auth App - Full Authentication & AI Chat</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-indigo-50">
	<Navigation user={session?.user ?? null} currentPage="home" />

	<!-- Hero Section -->
	<section class="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-gray-50 to-indigo-50 py-20 lg:py-28">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
				<!-- Left Side - Hero Content -->
				<div class="text-center lg:text-left">


					<!-- Main Heading -->
					<h1 class="scroll-m-20 text-4xl font-bold tracking-tight text-neutral-800 lg:text-6xl xl:text-7xl">
						<span class="block">Full Authentication</span>
						<span class="block bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
							& AI Chat
						</span>
					</h1>

					<!-- Description -->
					<p class="mt-8 text-xl text-neutral-500 lg:text-2xl max-w-3xl lg:max-w-none mx-auto lg:mx-0 leading-relaxed">
						A complete authentication system with OAuth providers, email verification, password
						reset, and an AI-powered chat interface using Google Gemini.
					</p>

					<!-- CTA Buttons -->
					<div class="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
						{#if !session?.user}
							<Button 
								size="lg" 
								class="text-lg px-8 py-6 bg-indigo-300 hover:bg-indigo-400 text-indigo-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl" 
								onclick={() => goto('/auth/signin')}
							>
								Get Started
							</Button>
							<Button 
								variant="outline" 
								size="lg" 
								class="text-lg px-8 py-6 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-all duration-200 rounded-xl" 
								onclick={() => goto('/auth/signin')}
							>
								Sign In
							</Button>
						{:else}
							<Button 
								size="lg" 
								class="text-lg px-8 py-6 bg-indigo-300 hover:bg-indigo-400 text-indigo-900 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl" 
								onclick={() => goto('/dashboard')}
							>
								Go to Dashboard
							</Button>
						{/if}
					</div>
				</div>

				<!-- Right Side - Chatbot Demo -->
				<div class="flex justify-center lg:justify-end">
					<div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-indigo-200 overflow-hidden">
						<!-- Chat Header -->
						<div class="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-200 px-4 py-3 flex items-center">
							<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
								<img src="/gemini-logo.png" alt="AI" class="w-6 h-6 object-contain" />
							</div>
							<div>
								<h3 class="text-sm font-semibold text-neutral-800">Vanar AI Assistant</h3>
								<p class="text-xs text-neutral-600">The Chain That Thinks</p>
							</div>
							<div class="ml-auto flex items-center space-x-1">
								<div class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
								<span class="text-xs text-neutral-800">Online</span>
							</div>
						</div>

						<!-- Chat Messages -->
						<div class="h-80 bg-gray-50 p-4 overflow-y-auto">
							<!-- AI Message -->
							<div class="flex mb-4">
								<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
									<img src="/gemini-logo.png" alt="AI" class="w-5 h-5 object-contain" />
								</div>
								<div class="bg-white rounded-lg px-3 py-2 shadow-sm max-w-xs">
									<p class="text-sm text-neutral-800">Hello! I'm your AI assistant. How can I help you today?</p>
								</div>
							</div>

							<!-- User Message -->
							<div class="flex justify-end mb-4">
								<div class="bg-indigo-300 rounded-lg px-3 py-2 shadow-sm max-w-xs">
									<p class="text-sm text-indigo-900">Can you explain how blockchain works?</p>
								</div>
							</div>

							<!-- AI Response (Animated) -->
							<div class="flex mb-4">
								<div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
									<img src="/gemini-logo.png" alt="AI" class="w-5 h-5 object-contain" />
								</div>
								<div class="bg-white rounded-lg px-3 py-2 shadow-sm max-w-xs">
									<div class="flex space-x-1">
										<div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce"></div>
										<div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
										<div class="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
									</div>
								</div>
							</div>
						</div>

						<!-- Chat Input -->
						<div class="bg-white border-t border-indigo-200 p-4">
							<div class="flex items-center space-x-2">
								<div class="flex-1 bg-gray-50 rounded-lg px-3 py-2">
									<div class="h-4 bg-gray-200 rounded animate-pulse"></div>
								</div>
								<button 
									class="h-8 w-8 bg-indigo-300 rounded-lg flex items-center justify-center hover:bg-indigo-400 transition-colors"
									aria-label="Send message"
								>
									<svg class="w-4 h-4 text-indigo-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Subtle background decoration -->
		<div class="absolute inset-0 -z-10 overflow-hidden">
			<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-200 blur-3xl opacity-60"></div>
			<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-200 blur-3xl opacity-60"></div>
			<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-200 blur-3xl opacity-40"></div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="bg-white py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight text-neutral-800 lg:text-4xl xl:text-5xl mb-6">
					Everything you need for secure authentication
				</h2>
				<p class="text-xl text-neutral-500 max-w-3xl mx-auto leading-relaxed">
					Built with modern technologies and best practices for security and user experience.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Secure Authentication Card -->
				<Card class="border border-blue-200 shadow-md bg-blue-50 hover:shadow-lg transition-all duration-300 group rounded-xl">
					<CardHeader class="pb-4">
						<div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors duration-200">
							<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
							</svg>
						</div>
						<CardTitle class="text-xl font-semibold text-neutral-800">Secure Authentication</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription class="text-base leading-relaxed text-neutral-500">
							Multiple authentication methods including email/password, Google OAuth, and GitHub OAuth with secure session management.
						</CardDescription>
					</CardContent>
				</Card>

				<!-- Email Verification Card -->
				<Card class="border border-emerald-200 shadow-md bg-emerald-50 hover:shadow-lg transition-all duration-300 group rounded-xl">
					<CardHeader class="pb-4">
						<div class="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors duration-200">
							<svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
							</svg>
						</div>
						<CardTitle class="text-xl font-semibold text-neutral-800">Email Verification</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription class="text-base leading-relaxed text-neutral-500">
							Secure email verification during signup and password reset functionality with time-limited tokens.
						</CardDescription>
					</CardContent>
				</Card>

				<!-- AI Chat Card -->
				<Card class="border border-pink-200 shadow-md bg-pink-50 hover:shadow-lg transition-all duration-300 group rounded-xl">
					<CardHeader class="pb-4">
						<div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-200 transition-colors duration-200">
							<svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
						</div>
						<CardTitle class="text-xl font-semibold text-neutral-800">AI Chat Interface</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription class="text-base leading-relaxed text-neutral-500">
							Powered by Google Gemini, our AI chat assistant provides intelligent responses and conversation history.
						</CardDescription>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>



	<!-- Tech Stack Section -->
	<section class="bg-gradient-to-br from-gray-50 to-yellow-50 py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-16">
				<h2 class="scroll-m-20 text-3xl font-bold tracking-tight text-neutral-800 lg:text-4xl xl:text-5xl mb-6">
					Built with modern technologies
				</h2>
				<p class="text-xl text-neutral-500 max-w-3xl mx-auto leading-relaxed">
					Leveraging the latest tools and frameworks for optimal performance and developer experience.
				</p>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-8">
				<div class="text-center group">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl mb-4 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
						<img 
							src="/sveltekit-icon.png" 
							alt="SvelteKit" 
							class="w-full h-full object-contain"
							on:error={(e) => {
								// Fallback to text icon if image fails to load
								e.target.style.display = 'none';
								e.target.nextElementSibling.style.display = 'block';
							}}
						/>
						<span class="text-2xl font-bold text-indigo-600 hidden">SK</span>
					</div>
					<h3 class="text-lg font-semibold mb-2 text-neutral-800">SvelteKit</h3>
					<p class="text-neutral-500">Full-stack web framework</p>
				</div>

				<div class="text-center group">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl mb-4 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
						<img 
							src="/authjs-icon.jpg" 
							alt="Auth.js" 
							class="w-full h-full object-contain"
							on:error={(e) => {
								// Fallback to text icon if image fails to load
								e.target.style.display = 'none';
								e.target.nextElementSibling.style.display = 'block';
							}}
						/>
						<span class="text-2xl font-bold text-violet-600 hidden">A</span>
					</div>
					<h3 class="text-lg font-semibold mb-2 text-neutral-800">Auth.js</h3>
					<p class="text-neutral-500">Complete authentication</p>
				</div>

				<div class="text-center group">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl mb-4 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
						<img 
							src="/drizzle-icon.png" 
							alt="Drizzle ORM" 
							class="w-full h-full object-contain"
							on:error={(e) => {
								// Fallback to text icon if image fails to load
								e.target.style.display = 'none';
								e.target.nextElementSibling.style.display = 'block';
							}}
						/>
						<span class="text-2xl font-bold text-pink-600 hidden">D</span>
					</div>
					<h3 class="text-lg font-semibold mb-2 text-neutral-800">Drizzle</h3>
					<p class="text-neutral-500">Type-safe ORM</p>
				</div>

				<div class="text-center group">
					<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl mb-4 group-hover:scale-105 transition-transform duration-200 overflow-hidden">
						<img 
							src="/gemini-logo.png" 
							alt="Google Gemini AI" 
							class="w-full h-full object-cover rounded-xl"
							on:error={(e) => {
								// Fallback to text icon if image fails to load
								e.target.style.display = 'none';
								e.target.nextElementSibling.style.display = 'block';
							}}
						/>
						<span class="text-2xl font-bold text-indigo-600 hidden">⚡</span>
					</div>
					<h3 class="text-lg font-semibold mb-2 text-neutral-800">Gemini</h3>
					<p class="text-neutral-500">AI chat integration</p>
				</div>
			</div>
		</div>
	</section>
</div>
