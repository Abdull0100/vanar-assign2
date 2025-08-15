<script lang="ts">
  import { signOut } from '@auth/sveltekit/client';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  $: user = $page.data.session?.user;

  async function handleSignOut() {
    await signOut({ redirectTo: '/' });
  }

  function navigateTo(path: string) {
    goto(path);
  }
</script>

<svelte:head>
  <title>Dashboard - Auth App</title>
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
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <button
              on:click={() => navigateTo('/dashboard')}
              class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              Dashboard
            </button>
            <button
              on:click={() => navigateTo('/chat')}
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              AI Chat
            </button>
            <button
              on:click={() => navigateTo('/profile')}
              class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              Profile
            </button>
            {#if user?.role === 'admin'}
              <button
                on:click={() => navigateTo('/admin')}
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Admin Panel
              </button>
            {/if}
          </div>
        </div>
        <div class="flex items-center">
          <div class="ml-3">
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
              <button
                on:click={handleSignOut}
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Welcome to your Dashboard</h2>
          <p class="text-lg text-gray-600 mb-8">
            You're successfully signed in as {user?.email}
          </p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div class="bg-white p-6 rounded-lg shadow">
              <h3 class="text-lg font-medium text-gray-900 mb-2">AI Chat</h3>
              <p class="text-gray-600 mb-4">Chat with our AI assistant powered by Gemini</p>
              <button
                on:click={() => navigateTo('/chat')}
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Start Chatting
              </button>
            </div>

            <div class="bg-white p-6 rounded-lg shadow">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Profile</h3>
              <p class="text-gray-600 mb-4">Update your profile information</p>
              <button
                on:click={() => navigateTo('/profile')}
                class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Edit Profile
              </button>
            </div>

            {#if user?.role === 'admin'}
              <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Admin Panel</h3>
                <p class="text-gray-600 mb-4">Manage users and view analytics</p>
                <button
                  on:click={() => navigateTo('/admin')}
                  class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  Access Admin
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
