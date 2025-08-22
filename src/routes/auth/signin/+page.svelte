<script lang="ts">

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	$: if ($page.url.searchParams.get('error')) {
		error = $page.url.searchParams.get('error') || '';
	}

	// Check if user is already signed in
	$: if (browser && $page.data.session?.user) {
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
	<title>Sign In - Auth App</title>
</svelte:head>

<div class="min-h-screen bg-animated relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden">
		<div class="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
		<div class="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style="animation-delay: 2s;"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse"></div>
	</div>

	<div class="relative z-10 w-full max-w-md">
		<!-- Back Button -->
		<div class="mb-6">
			<button
				on:click={() => goto('/')}
				class="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to Home
			</button>
		</div>

		<!-- Sign In Card -->
		<div class="dark-card animate-slide-in">
			<div class="text-center mb-8">
				<!-- <div class="text-4xl mb-4 animate-bot-glow">🤖</div> -->
				<h2 class="text-3xl font-bold text-white mb-2">Welcome Back</h2>
				<p class="text-gray-300">Sign in to your account to continue</p>
			</div>

			{#if error}
				<div class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
					{error}
				</div>
			{/if}

			<form on:submit|preventDefault={handleCredentialsSignIn} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-300 mb-2">
						Email Address
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="dark-input w-full"
						placeholder="Enter your email"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-300 mb-2">
						Password
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="dark-input w-full"
						placeholder="Enter your password"
					/>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember-me"
							name="remember-me"
							type="checkbox"
							class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-300">
							Remember me
						</label>
					</div>

					<div class="text-sm">
						<a href="/auth/forgot-password" class="text-blue-400 hover:text-blue-300 transition-colors">
							Forgot password?
						</a>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="dark-button w-full flex justify-center items-center"
				>
					{#if loading}
						<div class="loading-robot mr-2">🤖</div>
						<span class="loading-text">Signing in...</span>
					{:else}
						Sign In
					{/if}
				</button>
			</form>

			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-white/20"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-2 bg-gray-800/80 text-gray-400">Or continue with</span>
					</div>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3">
					<button
						on:click={() => handleOAuthSignIn('google')}
						class="dark-button-secondary flex items-center justify-center"
					>
						<span class="mr-2"><svg xmlns="http://www.w3.org/2000/svg" 
     width="24" height="24" 
     viewBox="0 0 48 48" 
     fill="none" 
     stroke="white" 
     stroke-width="2" 
     stroke-linecap="round" 
     stroke-linejoin="round">
  <path d="M44.5 20H24v8.5h11.9C34.8 33.6 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 3.1l6.4-6.4C34.6 4.9 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.2-.5-4z"/>
</svg></span>
						Google
					</button>

					<button
						on:click={() => handleOAuthSignIn('github')}
						class="dark-button-secondary flex items-center justify-center"
					>
						<span class="mr-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg></span>
						GitHub
					</button>
				</div>
			</div>

			<div class="mt-8 text-center">
				<p class="text-gray-400">
					Don't have an account?
					<a href="/auth/signup" class="text-blue-400 hover:text-blue-300 transition-colors font-medium">
						Sign up here
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
