<script lang="ts">
	import { goto } from '$app/navigation';

	let error = '';
	let errorDescription = '';

	$: {
		const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
		error = searchParams.get('error') || 'Unknown error';

		// Map common error codes to user-friendly messages
		switch (error) {
			case 'Configuration':
				errorDescription =
					'There is a problem with the server configuration. Please contact support.';
				break;
			case 'AccessDenied':
				errorDescription = 'You do not have permission to sign in.';
				break;
			case 'Verification':
				errorDescription = 'The verification link has expired or is invalid.';
				break;
			case 'Default':
				errorDescription = 'An error occurred during authentication.';
				break;
			default:
				errorDescription = 'An unexpected error occurred. Please try again.';
		}
	}

	function goToSignIn() {
		goto('/auth/signin');
	}

	function goHome() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Authentication Error - Auth App</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Authentication Error</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100"
				>
					<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
				</div>

				<h3 class="mb-2 text-lg font-medium text-gray-900">
					{error}
				</h3>

				<p class="mb-6 text-gray-600">
					{errorDescription}
				</p>

				<div class="space-y-3">
					<button
						on:click={goToSignIn}
						class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					>
						Try Again
					</button>

					<button
						on:click={goHome}
						class="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					>
						Go Home
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
