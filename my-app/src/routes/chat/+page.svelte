<script lang="ts">
	import ChatInterface from '$lib/components/ChatInterface.svelte';
</script>

<svelte:head>
	<title>AI Chat - My App</title>
	<meta name="description" content="Chat with our AI assistant" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
	<div class="container mx-auto">
		<div class="mb-8 text-center">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">AI Chat Assistant</h1>
			<p class="text-gray-600 max-w-2xl mx-auto">
				Welcome to our AI-powered chat interface. Ask questions, get help with coding, or just have a conversation!
			</p>
		</div>
		
		<div class="h-[600px]">
			<ChatInterface />
		</div>
		
		<div class="mt-8 text-center text-sm text-gray-500">
			<p>Powered by Google Gemini AI • Built with SvelteKit & TailwindCSS</p>
		</div>
	</div>
</div>
