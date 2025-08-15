<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let message = '';
  let loading = false;
  let messages: Array<{ message: string; response: string; createdAt: string; id?: number }> = [];
  let error = '';

  $: user = $page.data.session?.user;

  onMount(() => {
    if (!user) {
      goto('/auth/signin');
      return;
    }
    loadChatHistory();
  });

  async function loadChatHistory() {
    try {
      const response = await fetch('/api/chat');
      if (response.ok) {
        const data = await response.json();
        messages = data.messages.reverse(); // Show newest first
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    message = '';
    loading = true;
    error = '';

    // Add user message to UI immediately
    const tempId = Date.now();
    messages = [...messages, { message: userMessage, response: '', createdAt: new Date().toISOString(), id: tempId }];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the message with the AI response
        messages = messages.map(msg => 
          msg.id === tempId 
            ? { ...msg, response: data.response, id: undefined }
            : msg
        );
      } else {
        error = 'Failed to get response from AI';
        // Remove the temporary message
        messages = messages.filter(msg => msg.id !== tempId);
      }
    } catch (err) {
      error = 'An error occurred while sending message';
      // Remove the temporary message
      messages = messages.filter(msg => msg.id !== tempId);
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
</script>

<svelte:head>
  <title>AI Chat - Auth App</title>
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
            <a href="/chat" class="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              AI Chat
            </a>
            <a href="/profile" class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
              Profile
            </a>
          </div>
        </div>
        <div class="flex items-center">
          <span class="text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Chat Interface -->
  <div class="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
      <!-- Chat Header -->
      <div class="bg-indigo-600 px-6 py-4">
        <h2 class="text-lg font-medium text-white">AI Chat Assistant</h2>
        <p class="text-indigo-200 text-sm">Powered by Google Gemini</p>
      </div>

      <!-- Messages -->
      <div class="h-96 overflow-y-auto p-6 space-y-4">
        {#if messages.length === 0}
          <div class="text-center text-gray-500 py-8">
            <p>Start a conversation with the AI assistant!</p>
          </div>
        {/if}

        {#each messages as messageItem}
          <!-- User Message -->
          <div class="flex justify-end">
            <div class="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
              <p class="text-sm">{messageItem.message}</p>
            </div>
          </div>

          <!-- AI Response -->
          {#if messageItem.response}
            <div class="flex justify-start">
              <div class="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-xs lg:max-w-md">
                <p class="text-sm">{messageItem.response}</p>
                <p class="text-xs text-gray-500 mt-2">
                  {new Date(messageItem.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          {/if}
        {/each}

        {#if loading}
          <div class="flex justify-start">
            <div class="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
              <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span class="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Error Display -->
      {#if error}
        <div class="px-6 pb-4">
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      {/if}

      <!-- Message Input -->
      <div class="border-t border-gray-200 p-6">
        <div class="flex space-x-4">
          <div class="flex-1">
            <textarea
              bind:value={message}
              on:keypress={handleKeyPress}
              placeholder="Type your message here..."
              rows="3"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 resize-none"
            ></textarea>
          </div>
          <div class="flex-shrink-0">
            <button
              on:click={sendMessage}
              disabled={loading || !message.trim()}
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
