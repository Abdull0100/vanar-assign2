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
				<div class="text-4xl mb-4 animate-bot-glow">🤖</div>
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
						🔐 Sign In
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
						<span class="mr-2">🔍</span>
						Google
					</button>

					<button
						on:click={() => handleOAuthSignIn('github')}
						class="dark-button-secondary flex items-center justify-center"
					>
						<span class="mr-2">🐙</span>
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
