<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import {
		User,
		Mail,
		Info,
		CheckCircle,
		AlertTriangle,
		Shield,
		Lock,
		Save,
		RotateCcw
	} from '@lucide/svelte';

	export let user: any;
	export let name: string;
	export let email: string;
	export let error: string;
	export let success: string;
	export let saving: boolean;
	export let onSubmit: () => void;
	export let onReset: (() => void) | undefined = undefined;

	function handleSubmit(e: Event) {
		e.preventDefault();
		onSubmit?.();
	}

	function handleReset() {
		if (onReset) {
			onReset();
		} else {
			// Default reset behavior
			name = user?.name || '';
		}
	}
</script>

<Card.Root class="rounded-2xl border bg-card text-card-foreground">
	<Card.Header class="px-6 py-4">
		<Card.Title class="flex items-center text-lg font-semibold">
			<User class="mr-2 h-5 w-5 text-primary" />
			Personal Information
		</Card.Title>
		<Card.Description class="text-sm text-muted-foreground">
			Update your profile details and contact information
		</Card.Description>
	</Card.Header>

	<Card.Content class="px-4 py-5 sm:px-6">
		{#if error}
			<div
				class="mb-4 flex items-center rounded-lg border border-destructive bg-destructive/20 px-4 py-3"
			>
				<AlertTriangle class="mr-2 h-4 w-4 text-destructive" />
				<span class="text-destructive">{error}</span>
			</div>
		{/if}

		{#if success}
			<div class="mb-4 flex items-center rounded-lg border border-accent bg-accent/20 px-4 py-3">
				<CheckCircle class="mr-2 h-4 w-4 text-accent" />
				<span class="text-accent">{success}</span>
			</div>
		{/if}

		<form on:submit={handleSubmit}>
			<div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
					<div class="sm:col-span-4">
						<div class="grid gap-2">
							<label for="name" class="flex items-center text-sm font-medium">
								<User class="mr-2 h-4 w-4 text-primary" />
								Full Name
							</label>
							<div class="relative">
								<Input
									type="text"
									name="name"
									id="name"
									bind:value={name}
									placeholder="Enter your full name"
								/>
								{#if name?.trim()}
									<div
										class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
									>
										<CheckCircle class="h-4 w-4 text-accent" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="grid gap-2">
							<label for="email" class="flex items-center text-sm font-medium">
								<Mail class="mr-2 h-4 w-4 text-primary" />
								Email Address
							</label>
							<div class="relative">
								<Input
									type="email"
									name="email"
									id="email"
									value={email}
									disabled
									class="cursor-not-allowed bg-muted"
								/>
								<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
									<Lock class="h-4 w-4 text-muted-foreground" />
								</div>
							</div>
							<p class="flex items-center text-sm text-muted-foreground">
								<Info class="mr-1 h-4 w-4" />
								Email address cannot be changed for security reasons
							</p>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="mb-2 block flex items-center text-sm font-medium">
							<Shield class="mr-2 h-4 w-4 text-primary" />
							Account Status
						</div>
						<div class="mt-1">
							<div
								class="flex items-center rounded-lg p-3 {user?.emailVerified
									? 'border border-accent bg-accent/20'
									: 'border border-destructive bg-destructive/20'}"
							>
								{#if user?.emailVerified}
									<CheckCircle class="mr-2 h-5 w-5 text-accent" />
								{:else}
									<AlertTriangle class="mr-2 h-5 w-5 text-destructive" />
								{/if}
								<div>
									<span class="text-sm font-medium"
										>{user?.emailVerified ? 'Email Verified' : 'Pending Verification'}</span
									>
									<p class="text-xs opacity-80">
										{user?.emailVerified
											? 'Your email has been confirmed'
											: 'Please check your email for verification link'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="mb-2 block flex items-center text-sm font-medium">
							<User class="mr-2 h-4 w-4 text-primary" />
							Account Role
						</div>
						<div class="mt-1">
							<div
								class="flex items-center rounded-lg p-3 {user?.role === 'admin'
									? 'border border-secondary bg-secondary/20'
									: 'border border-border bg-muted/40'}"
							>
								{#if user?.role === 'admin'}
									<Shield class="mr-2 h-5 w-5 text-secondary" />
								{:else}
									<User class="mr-2 h-5 w-5 text-muted-foreground" />
								{/if}
								<div>
									<span class="text-sm font-medium"
										>{user?.role === 'admin' ? 'Administrator' : 'Standard User'}</span
									>
									<p class="text-xs opacity-80">
										{user?.role === 'admin'
											? 'Full system access and user management'
											: 'Standard user privileges'}
									</p>
								</div>
							</div>
						</div>
					</div>

					<div class="pt-4 sm:col-span-6">
						<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="secondary"
								onclick={handleReset}
								class="w-full sm:w-auto"
							>
								<RotateCcw class="mr-2 h-4 w-4" />
								Reset
							</Button>
							<Button type="submit" disabled={saving || !name?.trim?.()} class="w-full sm:w-auto">
								{#if saving}
									<div class="mr-2 h-4 w-4 animate-spin rounded-full border-b-2"></div>
									Saving...
								{:else}
									<Save class="mr-2 h-4 w-4" />
									Save Changes
								{/if}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</Card.Content>
</Card.Root>
