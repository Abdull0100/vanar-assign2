<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  export let data: { email?: string; error?: string; success?: boolean };
  
  let otp = '';
  let newPassword = '';
  let confirmPassword = '';
  let loading = false;
  let error = '';
  
  function handleSubmit() {
    if (newPassword !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }
    if (newPassword.length < 6) {
      error = 'Password must be at least 6 characters';
      return;
    }
    error = '';
    loading = true;
  }
</script>

<svelte:head>
  <title>Reset Password - MyApp</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
      <p class="text-gray-600">
        {data.email ? `Enter the OTP sent to ${data.email}` : 'Enter your OTP code'}
      </p>
    </div>

    <!-- OTP Form -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      {#if data.error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-600 text-sm">{data.error}</p>
        </div>
      {/if}

      {#if data.success}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-600 text-sm">Password reset successful! Redirecting to login...</p>
        </div>
      {:else}
        <form method="POST" use:enhance={handleSubmit} class="space-y-6">
          <!-- OTP Input -->
          <div>
            <label for="otp" class="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              bind:value={otp}
              maxlength="6"
              pattern="[0-9]{6}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Enter the 6-digit code from your email</p>
          </div>

          <!-- New Password -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              bind:value={newPassword}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password"
              required
            />
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              bind:value={confirmPassword}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
              required
            />
          </div>

          {#if error}
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-red-600 text-sm">{error}</p>
            </div>
          {/if}

          <!-- Submit Button -->
          <button
            type="submit"
            disabled={loading}
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <!-- Back to Login -->
        <div class="mt-6 text-center">
          <a href="/login" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Login
          </a>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="text-center mt-8">
      <p class="text-gray-500 text-sm">
        Didn't receive the OTP? 
        <a href="/forgot" class="text-blue-600 hover:text-blue-700 font-medium">
          Request new OTP
        </a>
      </p>
    </div>
  </div>
</div>
