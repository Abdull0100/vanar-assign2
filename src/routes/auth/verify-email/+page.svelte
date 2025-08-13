<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-svelte";
 
  let verificationStatus: 'loading' | 'success' | 'error' | 'expired' = 'loading';
  let message = '';
  let canResend = false;
  let isResending = false;
 
  onMount(async () => {
    const token = $page.url.searchParams.get('token');
    const email = $page.url.searchParams.get('email');
 
    if (!token) {
      verificationStatus = 'error';
      message = 'Invalid verification link';
      return;
    }
 
    try {
      // TODO: Replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
 
      // Simulate different outcomes for demo
      const random = Math.random();
      if (random > 0.7) {
        verificationStatus = 'expired';
        message = 'This verification link has expired';
        canResend = true;
      } else if (random > 0.1) {
        verificationStatus = 'success';
        message = 'Your email has been successfully verified!';
      } else {
        verificationStatus = 'error';
        message = 'Verification failed. The link may be invalid or expired.';
        canResend = true;
      }
    } catch (err) {
      verificationStatus = 'error';
      message = 'An error occurred during verification';
      canResend = true;
    }
  });
 
  async function resendVerification() {
    isResending = true;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message = 'A new verification email has been sent!';
    } catch (err) {
      message = 'Failed to resend verification email';
    } finally {
      isResending = false;
    }
  }
</script>
 
<svelte:head>
  <title>Verify Email</title>
</svelte:head>
 
<div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
  <Card class="w-full max-w-md">
    <CardHeader class="space-y-1">
      <CardTitle class="text-2xl font-bold text-center">Email Verification</CardTitle>
      <CardDescription class="text-center">
        {#if verificationStatus === 'loading'}
          Verifying your email address...
        {:else if verificationStatus === 'success'}
          Welcome! Your account is ready
        {:else}
          Verification incomplete
        {/if}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="text-center space-y-4">
        <!-- Status Icon -->
        <div class="mx-auto w-16 h-16 rounded-full flex items-center justify-center
          {verificationStatus === 'success' ? 'bg-green-100' : 
           verificationStatus === 'loading' ? 'bg-blue-100' : 'bg-red-100'}">
          {#if verificationStatus === 'loading'}
            <Loader2 class="h-8 w-8 text-blue-600 animate-spin" />
          {:else if verificationStatus === 'success'}
            <CheckCircle class="h-8 w-8 text-green-600" />
          {:else}
            <XCircle class="h-8 w-8 text-red-600" />
          {/if}
        </div>
 
        <!-- Status Message -->
        <div class="space-y-2">
          <h3 class="font-semibold">
            {#if verificationStatus === 'loading'}
              Verifying...
            {:else if verificationStatus === 'success'}
              Email Verified!
            {:else if verificationStatus === 'expired'}
              Link Expired
            {:else}
              Verification Failed
            {/if}
          </h3>
          <p class="text-sm text-muted-foreground">{message}</p>
        </div>
 
        <!-- Action Buttons -->
        {#if verificationStatus === 'success'}
          <div class="space-y-2">
            <Button href="/dashboard" class="w-full">
              Continue to Dashboard
            </Button>
            <Button href="/auth/login" variant="outline" class="w-full">
              Sign In
            </Button>
          </div>
        {:else if verificationStatus === 'loading'}
          <!-- Show loading state -->
        {:else}
          <!-- Error or expired states -->
          <div class="space-y-2">
            {#if canResend}
              <Button 
                on:click={resendVerification} 
                class="w-full" 
                disabled={isResending}
              >
                {#if isResending}
                  Sending...
                {:else}
                  Send New Verification Email
                {/if}
              </Button>
            {/if}
            <Button href="/auth/signup" variant="outline" class="w-full">
              Back to Sign Up
            </Button>
          </div>
        {/if}
      </div>
    </CardContent>
  </Card>
</div>
 