<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Bot, MessageSquare, Sparkles, Zap } from '@lucide/svelte';
	import { onMount } from 'svelte';
	
	export let isAuthenticated: boolean = false;

	let mounted = false;
	let typingText = '';
	let currentIndex = 0;
	
	const messages = [
		'Hello! I\'m Vanar AI...',
		'How can I help you today?',
		'Ready to chat and assist!',
		'Let\'s build something amazing!'
	];

	function navigateTo(path: string) {
		goto(path);
	}

	onMount(() => {
		mounted = true;
		startTypingAnimation();
	});

	function startTypingAnimation() {
		const message = messages[currentIndex];
		let charIndex = 0;
		typingText = '';

		const typeInterval = setInterval(() => {
			if (charIndex < message.length) {
				typingText += message[charIndex];
				charIndex++;
			} else {
				clearInterval(typeInterval);
				setTimeout(() => {
					currentIndex = (currentIndex + 1) % messages.length;
					setTimeout(startTypingAnimation, 500);
				}, 2000);
			}
		}, 100);
	}
</script>

<div class="relative overflow-hidden bg-background font-sans text-foreground">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<!-- Floating Chat Bubbles -->
		<div class="absolute top-20 left-10 opacity-20">
			<div class="animate-bounce" style="animation-delay: 0s; animation-duration: 3s;">
				<MessageSquare class="w-8 h-8 text-primary" />
			</div>
		</div>
		<div class="absolute top-40 right-20 opacity-30">
			<div class="animate-bounce" style="animation-delay: 1s; animation-duration: 4s;">
				<Bot class="w-6 h-6 text-primary" />
			</div>
		</div>
		<div class="absolute bottom-40 left-20 opacity-25">
			<div class="animate-bounce" style="animation-delay: 2s; animation-duration: 3.5s;">
				<Sparkles class="w-7 h-7 text-primary" />
			</div>
		</div>
		<div class="absolute top-60 right-40 opacity-20">
			<div class="animate-bounce" style="animation-delay: 0.5s; animation-duration: 2.5s;">
				<Zap class="w-5 h-5 text-primary" />
			</div>
		</div>
		
		<!-- Gradient Orbs -->
		<div class="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply animate-pulse"></div>
		<div class="absolute top-0 -right-4 w-72 h-72 bg-blue-300/10 rounded-full mix-blend-multiply animate-pulse" style="animation-delay: 1s;"></div>
		<div class="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300/10 rounded-full mix-blend-multiply animate-pulse" style="animation-delay: 2s;"></div>
	</div>
	
	<div class="mx-auto max-w-7xl relative">
		<div class="flex items-center min-h-[80vh] lg:min-h-screen">
			<!-- Left Content -->
			<div class="relative z-10 w-full lg:w-1/2 px-4 sm:px-6 lg:px-8">
				<div class="space-y-8">
					<!-- Animated Hero heading -->
					<div class="space-y-4">
						<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl {mounted ? 'animate-in slide-in-from-left duration-1000' : 'opacity-0'}">
							<span class="block">Full Authentication</span>
							<span class="block bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent animate-gradient bg-300% bg-pos-0">
								& AI Chat
							</span>
						</h1>

						<!-- Subheading with delay -->
						<p class="text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed max-w-2xl {mounted ? 'animate-in slide-in-from-left duration-1000 delay-300' : 'opacity-0'}">
							A complete authentication system with OAuth providers, email verification, password
							reset, and an AI-powered chat interface using Google Gemini.
						</p>
					</div>

					<!-- Animated Chat Preview -->
					<div class="bg-card border border-border rounded-2xl p-6 shadow-lg {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-500' : 'opacity-0'}">
						<div class="flex items-start space-x-3">
							<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
								<Bot class="w-4 h-4 text-white" />
							</div>
							<div class="flex-1">
								<div class="bg-muted rounded-lg p-3">
									<div class="flex items-center space-x-2 mb-2">
										<span class="text-sm font-medium text-foreground">Vanar AI</span>
										<div class="flex space-x-1">
											<div class="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
											<div class="w-1 h-1 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
											<div class="w-1 h-1 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
										</div>
									</div>
									<p class="text-sm text-muted-foreground">
										{typingText}<span class="inline-block w-0.5 h-4 bg-primary animate-pulse ml-1"></span>
									</p>
								</div>
							</div>
						</div>
					</div>

					<!-- CTA buttons with enhanced animations -->
					<div class="flex flex-col sm:flex-row gap-4 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-700' : 'opacity-0'}">
						{#if !isAuthenticated}
							<Button
								type="button"
								size="lg"
								onclick={() => navigateTo('/auth/signup')}
								class="px-8 md:px-10 transition-all duration-300 ease-out hover:scale-[1.05] hover:shadow-xl active:scale-[0.97] bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-600/90 group"
							>
								<span class="flex items-center space-x-2">
									<span>Get Started</span>
									<Sparkles class="w-4 h-4 group-hover:animate-spin" />
								</span>
							</Button>
							<Button
								variant="outline"
								type="button"
								size="lg"
								onclick={() => navigateTo('/auth/signin')}
								class="px-8 md:px-10 transition-all duration-300 ease-out hover:scale-[1.05] hover:shadow-lg active:scale-[0.97] border-2 hover:border-primary/50 group"
							>
								<span class="flex items-center space-x-2">
									<span>Sign In</span>
									<Zap class="w-4 h-4 group-hover:text-primary" />
								</span>
							</Button>
						{:else}
							<Button
								type="button"
								size="lg"
								onclick={() => navigateTo('/dashboard')}
								class="px-8 md:px-10 transition-all duration-300 ease-out hover:scale-[1.05] hover:shadow-xl active:scale-[0.97] bg-gradient-to-r from-primary to-blue-600 text-white hover:from-primary/90 hover:to-blue-600/90 group"
							>
								<span class="flex items-center space-x-2">
									<span>Go to Dashboard</span>
									<Sparkles class="w-4 h-4 group-hover:animate-spin" />
								</span>
							</Button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Side - Animated Chat Interface Preview -->
			<div class="hidden lg:flex lg:w-1/2 items-center justify-center p-8">
				<div class="w-full max-w-md {mounted ? 'animate-in slide-in-from-right duration-1000 delay-300' : 'opacity-0'}">
					<!-- Chat Interface Preview -->
					<div class="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
						<!-- Chat Header -->
						<div class="bg-primary p-4">
							<div class="flex items-center space-x-3">
								<div class="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
									<Bot class="w-4 h-4 text-primary-foreground" />
								</div>
								<div>
									<h3 class="text-sm font-semibold text-primary-foreground">Vanar AI Assistant</h3>
									<p class="text-xs text-primary-foreground/80">Online and ready to help</p>
								</div>
							</div>
						</div>
						
						<!-- Chat Messages -->
						<div class="p-4 space-y-4 h-64 overflow-hidden">
							<!-- User Message -->
							<div class="flex justify-end {mounted ? 'animate-in slide-in-from-right duration-500 delay-1000' : 'opacity-0'}">
								<div class="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2 max-w-xs">
									<p class="text-sm">Hello! Can you help me?</p>
								</div>
							</div>
							
							<!-- AI Response -->
							<div class="flex justify-start {mounted ? 'animate-in slide-in-from-left duration-500 delay-1500' : 'opacity-0'}">
								<div class="flex items-start space-x-2">
									<div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
										<Bot class="w-3 h-3 text-white" />
									</div>
									<div class="bg-muted rounded-2xl rounded-bl-sm px-4 py-2 max-w-xs">
										<p class="text-sm text-foreground">Absolutely! I'm here to assist you with anything you need. What would you like to know?</p>
									</div>
								</div>
							</div>

							<!-- Typing Indicator -->
							<div class="flex justify-start {mounted ? 'animate-in slide-in-from-left duration-500 delay-2000' : 'opacity-0'}">
								<div class="flex items-start space-x-2">
									<div class="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
										<Bot class="w-3 h-3 text-white" />
									</div>
									<div class="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
										<div class="flex items-center space-x-1">
											<div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
											<div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.2s;"></div>
											<div class="w-2 h-2 bg-primary rounded-full animate-pulse" style="animation-delay: 0.4s;"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Chat Input Preview -->
						<div class="border-t border-border p-4">
							<div class="flex items-center space-x-3">
								<div class="flex-1 bg-background border border-border rounded-lg px-3 py-2">
									<p class="text-sm text-muted-foreground">Type your message...</p>
								</div>
								<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
									<svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
									</svg>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes gradient {
		0%, 100% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
	}
	
	:global(.animate-gradient) {
		animation: gradient 3s ease infinite;
		background-size: 300% 300%;
	}
	
	:global(.bg-300\%){
		background-size: 300% 300%;
	}
	
	:global(.bg-pos-0){
		background-position: 0% 50%;
	}
</style>
