<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	export let isAuthenticated: boolean = false;

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<div class="relative overflow-hidden bg-background font-sans text-foreground">
	<div class="mx-auto max-w-7xl">
		<div
			class="relative z-10 bg-background/60 pb-8 backdrop-blur-sm sm:pb-16 md:pb-20 lg:w-full lg:max-w-2xl lg:pb-28 xl:pb-32"
		>
			<main
				class="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28"
			>
				<div class="sm:text-center lg:text-left">
					<!-- Hero heading -->
					<h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
						<span class="block xl:inline">Full Authentication</span>
						<span
							class="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent xl:inline"
						>
							& AI Chat
						</span>
					</h1>

					<!-- Subheading -->
					<p
						class="mt-4 text-base leading-relaxed text-muted-foreground sm:mx-auto sm:mt-6 sm:max-w-xl sm:text-lg md:mt-6 md:text-xl lg:mx-0"
					>
						A complete authentication system with OAuth providers, email verification, password
						reset, and an AI-powered chat interface using Google Gemini.
					</p>

					<!-- CTA buttons -->
					<div class="mt-6 gap-3 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
						{#if !isAuthenticated}
							<Button
								type="button"
								size="lg"
								onclick={() => navigateTo('/auth/signup')}
								class="bg-[var(--primary)] px-8 text-[var(--primary-foreground)] transition-all duration-150 ease-out hover:scale-[1.05] hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] active:scale-[0.97] active:bg-[color-mix(in_oklch,var(--primary),black_20%)] md:px-10"
							>
								Get Started
							</Button>
							<Button
								variant="secondary"
								type="button"
								size="lg"
								onclick={() => navigateTo('/auth/signin')}
								class="bg-[var(--secondary)] px-8 text-[var(--secondary-foreground)] transition-all duration-150 ease-out hover:scale-[1.05] hover:bg-[color-mix(in_oklch,var(--secondary),black_10%)] active:scale-[0.97] active:bg-[color-mix(in_oklch,var(--secondary),black_20%)] md:px-10"
							>
								Sign In
							</Button>
						{:else}
							<Button
								type="button"
								size="lg"
								onclick={() => navigateTo('/dashboard')}
								class="bg-[var(--primary)] px-8 text-[var(--primary-foreground)] transition-all duration-150 ease-out hover:scale-[1.05] hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] active:scale-[0.97] active:bg-[color-mix(in_oklch,var(--primary),black_20%)] md:px-10"
							>
								Go to Dashboard
							</Button>
						{/if}
					</div>
				</div>
			</main>
		</div>
	</div>
</div>
