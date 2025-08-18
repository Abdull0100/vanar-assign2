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
</script>

<svelte:head>
	<title>Sign Up - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
		<p class="mt-2 text-center text-sm text-gray-600">
			Or
			<a href="/auth/signin" class="font-medium text-indigo-600 hover:text-indigo-500">
				sign in to your existing account
			</a>
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			{#if error}
				<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
					Account created successfully! Please check your email for verification. Redirecting to verification page...
				</div>
			{/if}

			<form class="space-y-6" on:submit|preventDefault={handleSignUp}>
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700"> Full Name </label>
					<div class="mt-1">
						<input
							id="name"
							name="name"
							type="text"
							autoComplete="name"
							required
							bind:value={name}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							required
							bind:value={email}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							autoComplete="new-password"
							required
							bind:value={password}
							minlength="8"
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
						Confirm Password
					</label>
					<div class="mt-1">
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							required
							bind:value={confirmPassword}
							minlength="8"
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
						/>
					</div>
				</div>

				<div>
					<button
						type="submit"
						disabled={loading}
						class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{loading ? 'Creating account...' : 'Create account'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
