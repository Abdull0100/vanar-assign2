<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	// Lucide icons
	import { Sparkles, Lock, Database, MessageSquare } from '@lucide/svelte';
</script>

<div class="bg-background py-16 font-sans text-foreground">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="lg:text-center">
			<h2 class="font-sans text-2xl font-semibold tracking-wide text-primary uppercase">
				Technology Stack
			</h2>
			<p class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
				Built with modern technologies
			</p>
			<p class="mt-4 max-w-2xl text-lg text-muted-foreground lg:mx-auto">
				Every layer is carefully chosen for performance, security, and scalability.
			</p>
		</div>

		<div class="mt-12">
			<div class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
				<Card.Root
					class="bg-card text-card-foreground transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg"
				>
					<Card.Content class="p-6 text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"
						>
							<Sparkles class="h-6 w-6" />
						</div>
						<h3 class="mt-5 font-sans text-lg font-semibold text-card-foreground">SvelteKit</h3>
						<p class="mt-2 text-sm text-muted-foreground">Full-stack web framework</p>
					</Card.Content>
				</Card.Root>

				<Card.Root
					class="bg-card text-card-foreground transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg"
				>
					<Card.Content class="p-6 text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"
						>
							<Lock class="h-6 w-6" />
						</div>
						<h3 class="mt-5 font-sans text-lg font-semibold text-card-foreground">Auth.js</h3>
						<p class="mt-2 text-sm text-muted-foreground">Complete authentication</p>
					</Card.Content>
				</Card.Root>

				<Card.Root
					class="bg-card text-card-foreground transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg"
				>
					<Card.Content class="p-6 text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"
						>
							<Database class="h-6 w-6" />
						</div>
						<h3 class="mt-5 font-sans text-lg font-semibold text-card-foreground">Drizzle</h3>
						<p class="mt-2 text-sm text-muted-foreground">Type-safe ORM</p>
					</Card.Content>
				</Card.Root>

				<Card.Root
					class="bg-card text-card-foreground transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg"
				>
					<Card.Content class="p-6 text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground"
						>
							<MessageSquare class="h-6 w-6" />
						</div>
						<h3 class="mt-5 font-sans text-lg font-semibold text-card-foreground">Gemini</h3>
						<p class="mt-2 text-sm text-muted-foreground">AI chat integration</p>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
