<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	export let data: any;

	let email = '';
	let password = '';
	let loading = false;
	let error = '';

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

	async function handleOAuthSignIn(provider: string) {
		try {
			// Get OAuth config from server
			const response = await fetch('/api/auth/oauth-config');
			const config = await response.json();

			if (provider === 'google') {
				const googleAuthUrl =
					`https://accounts.google.com/o/oauth2/v2/auth?` +
					`client_id=${encodeURIComponent(config.google.clientId)}&` +
					`redirect_uri=${encodeURIComponent(config.google.redirectUri)}&` +
					`response_type=code&` +
					`scope=${encodeURIComponent('openid email profile')}&` +
					`access_type=offline&` +
					`prompt=${encodeURIComponent('select_account consent')}`;
				window.location.href = googleAuthUrl;
			} else if (provider === 'github') {
				const githubAuthUrl =
					`https://github.com/login/oauth/authorize?` +
					`client_id=${encodeURIComponent(config.github.clientId)}&` +
					`redirect_uri=${encodeURIComponent(config.github.redirectUri)}&` +
					`scope=${encodeURIComponent('user:email')}&` +
					`prompt=${encodeURIComponent('consent')}`;
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

<div
	class="flex min-h-screen items-center justify-center bg-background px-4 font-sans text-foreground"
>
	<div class="w-full max-w-sm">
		<div class="mb-6">
			<button
				on:click={() => goto('/')}
				class="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-2 h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to Home
			</button>
		</div>

		<div class="rounded-lg border border-border bg-card shadow-sm">
			<div class="px-6 pt-6">
				<h2 class="text-2xl font-bold">Sign in to your account</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Or <a href="/auth/signup" class="text-primary hover:underline">create a new account</a>
				</p>
			</div>

			<div class="px-6 py-6">
				{#if error}
					<div
						class="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}

				<form class="grid gap-4" on:submit|preventDefault={handleCredentialsSignIn}>
					<div class="grid gap-2">
						<label for="email" class="text-sm font-medium">Email</label>
						<input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							bind:value={email}
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						/>
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<label for="password" class="text-sm font-medium">Password</label>
							<a
								href="/auth/forgot-password"
								class="ml-auto inline-block text-xs text-muted-foreground underline hover:text-foreground"
							>
								Forgot your password?
							</a>
						</div>
						<input
							id="password"
							type="password"
							required
							bind:value={password}
							class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						/>
					</div>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</Button>
				</form>

				<div class="mt-6">
					<div class="flex items-center gap-3">
						<Separator class="flex-1" />
						<span class="text-xs text-muted-foreground">Or continue with</span>
						<Separator class="flex-1" />
					</div>

					<div class="mt-6 grid grid-cols-2 gap-3">
						<Button
							variant="outline"
							type="button"
							class="w-full"
							onclick={() => handleOAuthSignIn('google')}
						>
							<svg class="h-5 w-5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span class="ml-2">Google</span>
						</Button>

						<Button
							variant="outline"
							type="button"
							class="w-full"
							onclick={() => handleOAuthSignIn('github')}
						>
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span class="ml-2">GitHub</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
