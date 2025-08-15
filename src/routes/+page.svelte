<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  $: session = $page.data.session;

  function navigateTo(path: string) {
    goto(path);
  }
</script>

<svelte:head>
  <title>Auth App - Full Authentication & AI Chat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-gray-900">Auth App</h1>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          {#if session?.user}
            <span class="text-sm text-gray-700">Welcome, {session.user.name || session.user.email}</span>
            <button
              on:click={() => navigateTo('/dashboard')}
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </button>
          {:else}
            <button
              on:click={() => navigateTo('/auth/signin')}
              class="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </button>
            <button
              on:click={() => navigateTo('/auth/signup')}
              class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Up
            </button>
          {/if}
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <div class="relative bg-white overflow-hidden">
    <div class="max-w-7xl mx-auto">
      <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
        <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
          <div class="sm:text-center lg:text-left">
            <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span class="block xl:inline">Full Authentication</span>
              <span class="block text-indigo-600 xl:inline"> & AI Chat</span>
            </h1>
            <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              A complete authentication system with OAuth providers, email verification, password reset, and an AI-powered chat interface using Google Gemini.
            </p>
            <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
              {#if !session?.user}
                <div class="rounded-md shadow">
                  <button
                    on:click={() => navigateTo('/auth/signup')}
                    class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get Started
                  </button>
                </div>
                <div class="mt-3 sm:mt-0 sm:ml-3">
                  <button
                    on:click={() => navigateTo('/auth/signin')}
                    class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10"
                  >
                    Sign In
                  </button>
                </div>
              {:else}
                <div class="rounded-md shadow">
                  <button
                    on:click={() => navigateTo('/dashboard')}
                    class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                  >
                    Go to Dashboard
                  </button>
                </div>
              {/if}
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>

  <!-- Features Section -->
  <div class="py-12 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:text-center">
        <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
        <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Everything you need for secure authentication
        </p>
        <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
          Built with modern technologies and best practices for security and user experience.
        </p>
      </div>

      <div class="mt-10">
        <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Secure Authentication</p>
            <p class="mt-2 ml-16 text-base text-gray-500">
              Multiple authentication methods including email/password, Google OAuth, and GitHub OAuth with secure session management.
            </p>
          </div>

          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Email Verification</p>
            <p class="mt-2 ml-16 text-base text-gray-500">
              Secure email verification during signup and password reset functionality with time-limited tokens.
            </p>
          </div>

          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <p class="ml-16 text-lg leading-6 font-medium text-gray-900">AI Chat Interface</p>
            <p class="mt-2 ml-16 text-base text-gray-500">
              Powered by Google Gemini, our AI chat assistant provides intelligent responses and conversation history.
            </p>
          </div>

          <div class="relative">
            <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Admin Dashboard</p>
            <p class="mt-2 ml-16 text-base text-gray-500">
              Comprehensive admin panel for user management, role control, and system analytics with role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tech Stack Section -->
  <div class="py-12 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:text-center">
        <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Technology Stack</h2>
        <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Built with modern technologies
        </p>
      </div>

      <div class="mt-10">
        <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div class="text-center">
            <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
              <span class="text-lg font-bold">SK</span>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">SvelteKit</h3>
            <p class="mt-2 text-base text-gray-500">Full-stack web framework</p>
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
              <span class="text-lg font-bold">A</span>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Auth.js</h3>
            <p class="mt-2 text-base text-gray-500">Complete authentication</p>
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
              <span class="text-lg font-bold">D</span>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Drizzle</h3>
            <p class="mt-2 text-base text-gray-500">Type-safe ORM</p>
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
              <span class="text-lg font-bold">G</span>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">Gemini</h3>
            <p class="mt-2 text-base text-gray-500">AI chat integration</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
