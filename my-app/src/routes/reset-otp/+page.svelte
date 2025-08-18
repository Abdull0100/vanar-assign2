<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	let { form } = $props<{ form?: any }>();

	let email = $state('');
	let otp = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);

	function handleSubmit() {
		console.log('🔍 Form submission debug:');
		console.log('📧 Email:', email);
		console.log('🔢 OTP:', otp);
		console.log('🔢 OTP type:', typeof otp);
		console.log('🔢 OTP length:', otp?.length);
		isLoading = true;
	}
</script>

<svelte:head>
	<title>Reset Password with OTP - MyApp</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
				<span class="text-2xl">🔐</span>
			</div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Reset Your Password
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Enter the OTP code sent to your email and create a new password
			</p>
		</div>

		{#if form?.error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex items-center">
					<span class="text-red-500 text-lg mr-2">❌</span>
					<p class="text-red-800 text-sm font-medium">{form.error}</p>
				</div>
			</div>
		{/if}

		<form method="POST" use:enhance={handleSubmit} class="mt-8 space-y-6">
			<div class="space-y-4">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700">
						Email Address
					</label>
					<input
						id="email"
						name="email"
						type="email"
						bind:value={email}
						required
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Enter your email address"
					/>
				</div>

				<div>
					<label for="otp" class="block text-sm font-medium text-gray-700">
						OTP Code
					</label>
					<input
						id="otp"
						name="otp"
						type="text"
						bind:value={otp}
						required
						maxlength="6"
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm font-mono text-center text-lg tracking-widest"
						placeholder="123456"
					/>
					<p class="mt-1 text-xs text-gray-500">Enter the 6-digit code sent to your email</p>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">
						New Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						required
						minlength="6"
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Enter new password"
					/>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700">
						Confirm New Password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						required
						minlength="6"
						class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
						placeholder="Confirm new password"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={isLoading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						<span class="ml-2">Resetting Password...</span>
					{:else}
						<span class="absolute left-0 inset-y-0 flex items-center pl-3">
							<span class="text-lg">🔑</span>
						</span>
						Reset Password
					{/if}
				</button>
			</div>

			<div class="text-center">
				<a
					href="/forgot"
					class="text-sm text-blue-600 hover:text-blue-500 transition-colors"
				>
					← Back to Forgot Password
				</a>
			</div>
		</form>
	</div>
</div>
