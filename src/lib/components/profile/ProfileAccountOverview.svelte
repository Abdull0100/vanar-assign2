<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { Input } from "$lib/components/ui/input";
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
	} from "@lucide/svelte";

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

<Card.Root class="rounded-2xl bg-card text-card-foreground border">
	<Card.Header class="px-6 py-4">
		<Card.Title class="text-lg font-semibold flex items-center">
			<User class="w-5 h-5 mr-2 text-primary" />
			Personal Information
		</Card.Title>
		<Card.Description class="text-sm text-muted-foreground">
			Update your profile details and contact information
		</Card.Description>
	</Card.Header>

	<Card.Content class="px-4 py-5 sm:px-6">
		{#if error}
			<div class="mb-4 rounded-lg border border-destructive bg-destructive/20 px-4 py-3 flex items-center">
				<AlertTriangle class="w-4 h-4 text-destructive mr-2" />
				<span class="text-destructive">{error}</span>
			</div>
		{/if}

		{#if success}
			<div class="mb-4 rounded-lg border border-accent bg-accent/20 px-4 py-3 flex items-center">
				<CheckCircle class="w-4 h-4 text-accent mr-2" />
				<span class="text-accent">{success}</span>
			</div>
		{/if}

		<form on:submit={handleSubmit}>
			<div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
					<div class="sm:col-span-4">
						<div class="grid gap-2">
							<label for="name" class="text-sm font-medium flex items-center">
								<User class="w-4 h-4 mr-2 text-primary" />
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
									<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
										<CheckCircle class="w-4 h-4 text-accent" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="grid gap-2">
							<label for="email" class="text-sm font-medium flex items-center">
								<Mail class="w-4 h-4 mr-2 text-primary" />
								Email Address
							</label>
							<div class="relative">
								<Input
									type="email"
									name="email"
									id="email"
									value={email}
									disabled
									class="bg-muted cursor-not-allowed"
								/>
								<div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
									<Lock class="w-4 h-4 text-muted-foreground" />
								</div>
							</div>
							<p class="text-sm text-muted-foreground flex items-center">
								<Info class="w-4 h-4 mr-1" />
								Email address cannot be changed for security reasons
							</p>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="block text-sm font-medium mb-2 flex items-center">
							<Shield class="w-4 h-4 mr-2 text-primary" />
							Account Status
						</div>
						<div class="mt-1">
							<div class="flex items-center p-3 rounded-lg {user?.emailVerified ? 'bg-accent/20 border border-accent' : 'bg-destructive/20 border border-destructive'}">
								{#if user?.emailVerified}
									<CheckCircle class="w-5 h-5 mr-2 text-accent" />
								{:else}
									<AlertTriangle class="w-5 h-5 mr-2 text-destructive" />
								{/if}
								<div>
									<span class="text-sm font-medium">{user?.emailVerified ? "Email Verified" : "Pending Verification"}</span>
									<p class="text-xs opacity-80">{user?.emailVerified
										? "Your email has been confirmed"
										: "Please check your email for verification link"}</p>
								</div>
							</div>
						</div>
					</div>

					<div class="sm:col-span-4">
						<div class="block text-sm font-medium mb-2 flex items-center">
							<User class="w-4 h-4 mr-2 text-primary" />
							Account Role
						</div>
						<div class="mt-1">
							<div class="flex items-center p-3 rounded-lg {user?.role === 'admin' ? 'bg-secondary/20 border border-secondary' : 'bg-muted/40 border border-border'}">
								{#if user?.role === "admin"}
									<Shield class="w-5 h-5 mr-2 text-secondary" />
								{:else}
									<User class="w-5 h-5 mr-2 text-muted-foreground" />
								{/if}
								<div>
									<span class="text-sm font-medium">{user?.role === "admin" ? "Administrator" : "Standard User"}</span>
									<p class="text-xs opacity-80">{user?.role === "admin"
										? "Full system access and user management"
										: "Standard user privileges"}</p>
								</div>
							</div>
						</div>
					</div>

					<div class="sm:col-span-6 pt-4">
						<div class="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
							<Button type="button" variant="secondary" onclick={handleReset} class="w-full sm:w-auto">
								<RotateCcw class="w-4 h-4 mr-2" />
								Reset
							</Button>
							<Button type="submit" disabled={saving || !name?.trim?.()} class="w-full sm:w-auto">
								{#if saving}
									<div class="h-4 w-4 animate-spin rounded-full border-b-2 mr-2"></div>
									Saving...
								{:else}
									<Save class="w-4 h-4 mr-2" />
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
