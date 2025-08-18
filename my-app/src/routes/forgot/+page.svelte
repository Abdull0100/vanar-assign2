<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<svelte:head>
  <title>Forgot Password</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Forgot your password?
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enter your email address and we'll send you an OTP code to reset your password.
      </p>
    </div>
    
    <div class="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
      {#if form?.success}
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <span class="text-2xl">✅</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
          <p class="text-sm text-gray-600 mb-6">
            If an account with that email exists, we've sent an OTP code. Check your email and enter the code below.
          </p>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-blue-800 text-sm">
              <strong>📧 Email sent!</strong><br>
              Please check your inbox (and spam folder) for the OTP code. The code will expire in 1 hour.
            </p>
          </div>
          <a
            href="/reset-otp"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Enter OTP Code
          </a>
        </div>
      {:else}
        <form method="POST" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              autocomplete="email"
              class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
              placeholder="Enter your email address"
            />
          </div>
          
          {#if form?.error}
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {form.error}
            </div>
          {/if}
          
          <button 
            type="submit" 
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Send OTP Code
          </button>
        </form>
      {/if}
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Remember your password? 
          <a href="/login" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  </div>
</div>
