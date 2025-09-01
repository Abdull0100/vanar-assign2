<script lang="ts">
	import * as Card from "$lib/components/ui/card";
	import { Shield, Mail, MessageCircle, LayoutDashboard } from "@lucide/svelte";
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<div class="bg-background py-12 font-sans text-foreground">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="lg:text-center">
			<h2 class="text-2xl font-semibold tracking-wide text-primary uppercase font-sans {mounted ? 'animate-in slide-in-from-top duration-1000 delay-200' : 'opacity-0'}">
				Features
			</h2>
			<p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight sm:text-4xl {mounted ? 'animate-in slide-in-from-top duration-1000 delay-400' : 'opacity-0'}">
				Everything you need for secure authentication
			</p>
			<p class="mt-4 max-w-2xl text-xl text-muted-foreground lg:mx-auto {mounted ? 'animate-in slide-in-from-top duration-1000 delay-600' : 'opacity-0'}">
				Built with modern technologies and best practices for security and user experience.
			</p>
		</div>

		<div class="mt-10 grid md:grid-cols-2 gap-6">
			<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-800' : 'opacity-0'}">
				<Card.Header class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground animate-pulse">
						<Shield class="h-6 w-6" />
					</div>
					<Card.Title class="text-card-foreground">Secure Authentication</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.Description class="text-muted-foreground">
						Multiple authentication methods including email/password, Google OAuth, and GitHub OAuth with secure session management.
					</Card.Description>
				</Card.Content>
			</Card.Root>

			<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1000' : 'opacity-0'}">
				<Card.Header class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground animate-pulse" style="animation-delay: 0.5s;">
						<Mail class="h-6 w-6" />
					</div>
					<Card.Title class="text-card-foreground">Email Verification</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.Description class="text-muted-foreground">
						Secure email verification during signup and password reset functionality with time-limited tokens.
					</Card.Description>
				</Card.Content>
			</Card.Root>

			<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1200' : 'opacity-0'}">
				<Card.Header class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground animate-bounce" style="animation-delay: 1s; animation-duration: 2s;">
						<MessageCircle class="h-6 w-6" />
					</div>
					<Card.Title class="text-card-foreground">AI Chat Interface</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.Description class="text-muted-foreground">
						Powered by Google Gemini, our AI chat assistant provides intelligent responses and conversation history.
					</Card.Description>
				</Card.Content>
			</Card.Root>

			<Card.Root class="bg-card text-card-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1 {mounted ? 'animate-in slide-in-from-bottom duration-1000 delay-1400' : 'opacity-0'}">
				<Card.Header class="flex items-center gap-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground animate-pulse" style="animation-delay: 1.5s;">
						<LayoutDashboard class="h-6 w-6" />
					</div>
					<Card.Title class="text-card-foreground">Admin Dashboard</Card.Title>
				</Card.Header>
				<Card.Content>
					<Card.Description class="text-muted-foreground">
						Comprehensive admin panel for user management, role control, and system analytics with role-based access control.
					</Card.Description>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
