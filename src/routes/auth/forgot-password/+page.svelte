<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { Mail, ArrowLeft } from "lucide-svelte";
 
  let email = '';
  let isSubmitted = false;
  let isLoading = false;
  let error = '';
 
  async function handleSubmit() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }
 
    isLoading = true;
    error = '';
 
    try {
      // TODO: Replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      isSubmitted = true;
    } catch (err) {
      error = 'Failed to send reset email. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>
 
<svelte:head>
  <title>Reset Password</title>
</svelte:head>
 
<div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
  <Card class="w-full max-w-md">
    <CardHeader class="space-y-1">
      <div class="flex items-center justify-between">
        <CardTitle class="text-2xl font-bold">Reset Password</CardTitle>
        <a href="/auth/login" class="text-muted-foreground hover:text-foreground">
          <ArrowLeft class="h-4 w-4" />
        </a>
      </div>
      <CardDescription>
        {isSubmitted 
          ? "We've sent you a reset link" 
          : "Enter your email to receive a reset link"
        }
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if isSubmitted}
        <div class="text-center space-y-4">
          <div class="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Mail class="h-6 w-6 text-green-600" />
          </div>
          <div class="space-y-2">
            <h3 class="font-semibold">Check your email</h3>
            <p class="text-sm text-muted-foreground">
              We've sent a password reset link to <br />
              <strong>{email}</strong>
            </p>
          </div>
          <div class="space-y-2">
            <Button href="/auth/login" class="w-full">
              Back to Login
            </Button>
            <button
            type="button"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            border border-input bg-transparent hover:bg-accent hover:text-accent-foreground
            h-10 px-4 py-2 w-full"
            on:click={() => {
                isSubmitted = false;
                email = '';
            }}
            >
                Try different email
            </button>
          </div>
        </div>
      {:else}
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email address</Label>
            <Input 
              id="email"
              type="email" 
              placeholder="Enter your email"
              bind:value={email}
              required
              disabled={isLoading}
            />
          </div>
 
          {#if error}
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          {/if}
 
          <Button type="submit" class="w-full" disabled={isLoading}>
            {#if isLoading}
              Sending...
            {:else}
              Send Reset Link
            {/if}
          </Button>
        </form>
 
        <div class="text-center">
          <p class="text-sm text-muted-foreground">
            Remember your password? 
            <a href="/auth/login" class="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      {/if}
    </CardContent>
  </Card>
</div>