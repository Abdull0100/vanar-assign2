<script lang="ts">
	import { goto } from '$app/navigation';

	export let isAuthenticated: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="relative overflow-hidden bg-white">
	<div class="mx-auto max-w-7xl">
		<div class="relative z-10 bg-white pb-8 sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32">
			<main class="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
				<div class="sm:text-center lg:text-left">
					<h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
						<span class="block xl:inline">Full Authentication</span>
						<span class="block text-indigo-600 xl:inline"> & AI Chat</span>
					</h1>
					<p class="mt-3 text-base text-gray-500 sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl lg:mx-0">
						A complete authentication system with OAuth providers, email verification, password
						reset, and an AI-powered chat interface using Google Gemini.
					</p>
					<div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
						{#if !isAuthenticated}
							<div class="rounded-md shadow">
								<button
									on:click={() => navigateTo('/auth/signup')}
									class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 md:px-10 md:py-4 md:text-lg"
								>
									Get Started
								</button>
							</div>
							<div class="mt-3 sm:mt-0 sm:ml-3">
								<button
									on:click={() => navigateTo('/auth/signin')}
									class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-100 px-8 py-3 text-base font-medium text-indigo-700 hover:bg-indigo-200 md:px-10 md:py-4 md:text-lg"
								>
									Sign In
								</button>
							</div>
						{:else}
							<div class="rounded-md shadow">
								<button
									on:click={() => navigateTo('/dashboard')}
									class="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 md:px-10 md:py-4 md:text-lg"
								>
									Go to Dashboard
								</button>
							</div>
						{/if}
					</div>
				</div>
			</main>
		</div>
	</div>
</div>


