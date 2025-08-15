<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let name = '';
  let email = '';
  let loading = true;
  let saving = false;
  let error = '';
  let success = '';

  $: user = $page.data.session?.user;

  onMount(() => {
    if (!user) {
      goto('/auth/signin');
      return;
    }

    // Load current user data
    name = user.name || '';
    email = user.email || '';
    loading = false;
  });

  async function updateProfile() {
    saving = true;
    error = '';
    success = '';

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        success = 'Profile updated successfully!';
        // Update local session data
        if (user) {
          user.name = name;
        }
      } else {
        const data = await response.json();
        error = data.error || 'Failed to update profile';
      }
    } catch (err) {
      error = 'An error occurred while updating profile';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Profile - Auth App</title>
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
            <a href="/dashboard" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Dashboard
            </a>
            <a href="/chat" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              AI Chat
            </a>
            <a href="/profile" class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Profile
            </a>
            {#if user?.role === 'admin'}
              <a href="/admin" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Admin Panel
              </a>
            {/if}
          </div>
        </div>
        <div class="flex items-center">
          <span class="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div class="px-4 py-6 sm:px-0">
      <div class="max-w-3xl mx-auto">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p class="mt-2 text-gray-600">Manage your account information and preferences</p>
        </div>

        {#if loading}
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading profile...</p>
          </div>
        {:else}
          <div class="bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Update your profile details</p>
            </div>

            {#if error}
              <div class="px-4 py-3 bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            {/if}

            {#if success}
              <div class="px-4 py-3 bg-green-50 border border-green-200 text-green-700">
                {success}
              </div>
            {/if}

            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
              <form on:submit|preventDefault={updateProfile}>
                <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div class="sm:col-span-4">
                    <label for="name" class="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <div class="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        bind:value={name}
                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div class="sm:col-span-4">
                    <label for="email" class="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div class="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        disabled
                        class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                      />
                      <p class="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                    </div>
                  </div>

                  <div class="sm:col-span-4">
                    <p class="block text-sm font-medium text-gray-700">
                      Account Status
                    </p>
                    <div class="mt-1">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        {user?.emailVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </div>
                  </div>

                  <div class="sm:col-span-4">
                    <p class="block text-sm font-medium text-gray-700">
                      Role
                    </p>
                    <div class="mt-1">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                        {user?.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="pt-5">
                  <div class="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">Account Actions</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Manage your account settings</p>
            </div>
            <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Change Password</h4>
                    <p class="text-sm text-gray-500">Update your account password</p>
                  </div>
                  <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Change Password
                  </button>
                </div>
                
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Delete Account</h4>
                    <p class="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                  <button class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
