<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	// Lucide icons
	import { Sparkles, Lock, Database, MessageSquare } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<div class="bg-background py-16 font-sans text-foreground">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="lg:text-center">
			<h2 class="font-sans text-2xl font-semibold tracking-wide text-primary uppercase {mounted ? 'animate-in slide-in-from-top duration-1000 delay-300' : 'opacity-0'}">
				Technology Stack
			</h2>
			<p class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl {mounted ? 'animate-in slide-in-from-top duration-1000 delay-500' : 'opacity-0'}">
				Built with modern technologies
			</p>
			<p class="mt-4 max-w-2xl text-muted-foreground text-lg lg:mx-auto {mounted ? 'animate-in slide-in-from-top duration-1000 delay-700' : 'opacity-0'}">
				Every layer is carefully chosen for performance, security, and scalability.
			</p>
		</div>

		<div class="mt-12">
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
				<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:-translate-y-2 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-900' : 'opacity-0'}">
					<Card.Content class="p-6 text-center">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-primary to-blue-600 text-white animate-spin" style="animation-duration: 3s;">
							<Sparkles class="h-6 w-6" />
						</div>
						<h3 class="mt-5 text-lg font-sans font-semibold text-card-foreground">SvelteKit</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							Full-stack web framework
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:-translate-y-2 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1100' : 'opacity-0'}">
					<Card.Content class="p-6 text-center">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-emerald-600 text-white animate-pulse">
							<Lock class="h-6 w-6" />
						</div>
						<h3 class="mt-5 text-lg font-sans font-semibold text-card-foreground">Auth.js</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							Complete authentication
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:-translate-y-2 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1300' : 'opacity-0'}">
					<Card.Content class="p-6 text-center">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-600 text-white animate-bounce" style="animation-delay: 0.5s; animation-duration: 2s;">
							<Database class="h-6 w-6" />
						</div>
						<h3 class="mt-5 text-lg font-sans font-semibold text-card-foreground">Drizzle</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							Type-safe ORM
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.05] hover:shadow-xl hover:-translate-y-2 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1500' : 'opacity-0'}">
					<Card.Content class="p-6 text-center">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-600 text-white animate-pulse" style="animation-delay: 1s;">
							<MessageSquare class="h-6 w-6" />
						</div>
						<h3 class="mt-5 text-lg font-sans font-semibold text-card-foreground">Gemini</h3>
						<p class="mt-2 text-sm text-muted-foreground">
							AI chat integration
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
