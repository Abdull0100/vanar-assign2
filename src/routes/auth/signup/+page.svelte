<script lang="ts">

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let error = '';
	let success = false;

	$: if ($page.url.searchParams.get('error')) {
		error = $page.url.searchParams.get('error') || '';
	}

	async function handleSignUp() {
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, password })
			});

			const data = await response.json();

			if (response.ok && data.success) {
				success = true;
				setTimeout(() => {
					goto('/verify');
				}, 2000);
			} else {
				error = data.error || 'An error occurred';
			}
		} catch (err) {
			error = 'An error occurred';
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
	<title>Sign Up - Auth App</title>
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

		<!-- Sign Up Card -->
		<div class="dark-card animate-slide-in">
			<div class="text-center mb-8">
				<div class="text-4xl mb-4 animate-bot-glow">🚀</div>
				<h2 class="text-3xl font-bold text-white mb-2">Join Us</h2>
				<p class="text-gray-300">Create your account to get started</p>
			</div>

			{#if success}
				<div class="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-sm text-center">
					<div class="text-2xl mb-2">✅</div>
					Account created successfully! Redirecting to verification...
				</div>
			{:else}
				{#if error}
					<div class="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
						{error}
					</div>
				{/if}

				<form on:submit|preventDefault={handleSignUp} class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-300 mb-2">
							Full Name
						</label>
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							class="dark-input w-full"
							placeholder="Enter your full name"
						/>
					</div>

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
							placeholder="Create a password"
						/>
					</div>

					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							class="dark-input w-full"
							placeholder="Confirm your password"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="dark-button w-full flex justify-center items-center"
					>
						{#if loading}
							<div class="loading-robot mr-2">🤖</div>
							<span class="loading-text">Creating account...</span>
						{:else}
							🚀 Create Account
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
						Already have an account?
						<a href="/auth/signin" class="text-blue-400 hover:text-blue-300 transition-colors font-medium">
							Sign in here
						</a>
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
