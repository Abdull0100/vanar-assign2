<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	export let data: any;

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	// Signup form variables
	let name = '';
	let signupEmail = '';
	let signupPassword = '';
	let confirmPassword = '';
	let signupLoading = false;
	let signupError = '';
	let success = false;

	$: if (typeof window !== 'undefined') {
		const params = new URLSearchParams(window.location.search);
		if (params.get('error')) {
			error = params.get('error') || '';
		}
	}

	// Check if user is already signed in
	$: if (browser && data.session?.user) {
		goto('/dashboard');
	}

	async function handleCredentialsSignIn() {
		if (!email || !password) {
			error = 'Please enter both email and password';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: email.toLowerCase().trim(),
					password
				})
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Force a page reload to ensure session is properly set
				window.location.href = '/dashboard';
			} else {
				error = result.error || 'Sign in failed. Please check your credentials.';
			}
		} catch (err) {
			console.error('SignIn catch error:', err);
			error = 'Network error. Please check your connection and try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSignUp() {
		if (signupPassword !== confirmPassword) {
			signupError = 'Passwords do not match';
			return;
		}

		signupLoading = true;
		signupError = '';

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email: signupEmail, password: signupPassword })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				success = true;
				setTimeout(() => {
					goto('/verify');
				}, 2000);
			} else {
				signupError = data.error || 'An error occurred';
			}
		} catch (err) {
			signupError = 'An error occurred';
		} finally {
			signupLoading = false;
		}
	}

	async function handleOAuthSignIn(provider: string) {
		try {
			// Get OAuth config from server
			const response = await fetch('/api/auth/oauth-config');
			const config = await response.json();
			
			if (provider === 'google') {
				const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
					`client_id=${encodeURIComponent(config.google.clientId)}&` +
					`redirect_uri=${encodeURIComponent(config.google.redirectUri)}&` +
					`response_type=code&` +
					`scope=${encodeURIComponent('openid email profile')}&` +
					`access_type=offline`;
				window.location.href = googleAuthUrl;
			} else if (provider === 'github') {
				const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
					`client_id=${encodeURIComponent(config.github.clientId)}&` +
					`redirect_uri=${encodeURIComponent(config.github.redirectUri)}&` +
					`scope=${encodeURIComponent('user:email')}`;
				window.location.href = githubAuthUrl;
			}
		} catch (err) {
			console.error(`OAuth sign in error for ${provider}:`, err);
			error = `Failed to sign in with ${provider}`;
		}
	}
</script>

<svelte:head>
	<title>Authentication - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200 to-blue-300 blur-3xl opacity-40 animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-violet-200 to-purple-300 blur-3xl opacity-40 animate-pulse" style="animation-delay: 2s"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-gradient-to-br from-pink-200 to-rose-300 blur-3xl opacity-30 animate-pulse" style="animation-delay: 4s"></div>
	</div>

	<!-- Back Button -->
	<div class="absolute top-6 left-6 z-20">
		<button
			on:click={() => goto('/')}
			class="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900 transition-colors bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Home
		</button>
	</div>

	<!-- Main Authentication Container -->
	<div class="relative z-10 flex min-h-screen items-center justify-center p-4">
		<div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
			<div class="flex flex-col lg:flex-row">
				<!-- Left Panel - Sign In (Pastel Purple) -->
				<div class="lg:w-1/2 bg-gradient-to-br from-indigo-300 via-violet-300 to-pink-200 p-8 lg:p-12 relative overflow-hidden">
					<!-- Animated background patterns -->
					<div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
					<div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
					
					<!-- Floating elements -->
					<div class="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
					<div class="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style="animation-delay: 1s"></div>
					<div class="absolute top-1/2 left-4 w-8 h-8 bg-white/10 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
					
					<div class="relative z-10 flex flex-col items-center justify-center h-full text-center">
						<h2 class="text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up">
							Welcome Back!
						</h2>
						<p class="text-lg text-white/90 mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
							Enter your personal details to use all of site features
						</p>
						
						{#if error}
							<div class="mb-6 rounded-xl border border-red-200/50 bg-red-50/80 backdrop-blur-sm px-4 py-3 text-red-700 animate-fade-in">
								{error}
							</div>
						{/if}

						<!-- Login Form -->
						<form class="w-full max-w-sm space-y-6 animate-fade-in-up" style="animation-delay: 0.3s" on:submit|preventDefault={handleCredentialsSignIn}>
							<div>
								<input
									id="loginEmail"
									name="loginEmail"
									type="email"
									autoComplete="email"
									required
									bind:value={email}
									placeholder="Email"
									class="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
								/>
							</div>

							<div>
								<input
									id="loginPassword"
									name="loginPassword"
									type="password"
									autoComplete="current-password"
									required
									bind:value={password}
									placeholder="Password"
									class="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300"
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								class="w-full px-6 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 border border-white/30"
							>
								{loading ? 'Signing in...' : 'SIGN IN'}
							</button>
						</form>

						<!-- Forgot Password Link -->
						<div class="mt-6 animate-fade-in-up" style="animation-delay: 0.4s">
							<a href="/auth/forgot-password" class="text-white/80 hover:text-white transition-colors text-sm">
								Forgot your password?
							</a>
						</div>
					</div>
				</div>

				<!-- Right Panel - Sign Up (White) -->
				<div class="lg:w-1/2 bg-white p-8 lg:p-12 relative">
					<div class="h-full flex flex-col justify-center">
						<h2 class="text-3xl lg:text-4xl font-bold text-neutral-800 mb-8 animate-fade-in-up">
							Create Account
						</h2>
						
						{#if signupError}
							<div class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 animate-fade-in">
								{signupError}
							</div>
						{/if}

						{#if success}
							<div class="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700 animate-fade-in">
								Account created successfully! Please check your email for verification. Redirecting to verification page...
							</div>
						{/if}

						<!-- Social Login Buttons -->
						<div class="flex justify-center gap-3 mb-8 animate-fade-in-up" style="animation-delay: 0.2s">
							<button
								on:click={() => handleOAuthSignIn('google')}
								aria-label="Sign in with Google"
								class="w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
							>
								<svg class="h-5 w-5" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
								</svg>
							</button>
							<button
								on:click={() => handleOAuthSignIn('github')}
								aria-label="Sign in with GitHub"
								class="w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/>
								</svg>
							</button>
						</div>

						<!-- Separator -->
						<div class="relative mb-8 animate-fade-in-up" style="animation-delay: 0.3s">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-t border-gray-300"></div>
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="bg-white px-4 text-gray-500">or use your email for registration</span>
							</div>
						</div>

						<!-- Signup Form -->
						<form class="space-y-6 animate-fade-in-up" style="animation-delay: 0.4s" on:submit|preventDefault={handleSignUp}>
							<div>
								<input
									id="name"
									name="name"
									type="text"
									autoComplete="name"
									required
									bind:value={name}
									placeholder="Name"
									class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
								/>
							</div>

							<div>
								<input
									id="signupEmail"
									name="signupEmail"
									type="email"
									autoComplete="email"
									required
									bind:value={signupEmail}
									placeholder="Email"
									class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
								/>
							</div>

							<div>
								<input
									id="signupPassword"
									name="signupPassword"
									type="password"
									autoComplete="new-password"
									required
									bind:value={signupPassword}
									placeholder="Password"
									minlength="8"
									class="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all duration-300"
								/>
							</div>

							<button
								type="submit"
								disabled={signupLoading}
								class="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-400 to-violet-400 text-white font-semibold hover:from-indigo-500 hover:to-violet-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
							>
								{signupLoading ? 'Creating account...' : 'SIGN UP'}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 1s ease-out forwards;
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}
</style>
