<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import Navigation from '$lib/components/Navigation.svelte';
	import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatMessages from '$lib/components/chat/ChatMessages.svelte';
	import ChatErrorBanner from '$lib/components/chat/ChatErrorBanner.svelte';
	import ChatModals from '$lib/components/chat/ChatModals.svelte';
	import ToastNotification from '$lib/components/chat/ToastNotification.svelte';
	import { createChatStore } from '$lib/stores/chat';
	
	export let data: any;

	$: user = data.session?.user;
	const store = createChatStore(user?.id ?? null) as any;
	const {
		messages,
		conversations,
		currentConversationId,
		loading,
		error,
		showDeleteModal,
		deleteTarget,
		showDeleteAllModal,
		deleteAllTarget,
		currentConversation,
		loadConversationsFromStorage,
		loadChatHistory,
		selectConversation,
		newConversation,
		updateConversationRoomName,
		debouncedSaveToStorage,
		startRetryCountdown,
		clearErrorState,
		canRetryNow,
		getTimeUntilRetry,
		sendMessage,
		openDeleteModal,
		closeDeleteModal,
		confirmDeleteConversation,
		openDeleteAllModal,
		closeDeleteAllModal,
		confirmDeleteAllConversations,
		editMessage
	} = store;

	let messageText = '';
	let chatMessagesRef: any;
	let initializing = true;

	onMount(() => {
		loadConversationsFromStorage();
		loadChatHistory().finally(() => {
			initializing = false;
		});
	});

	onDestroy(() => {
		// Store handles its internal timers automatically
	});

	function handleSend() {
		const text = messageText;
		messageText = '';
		sendMessage(text);
		setTimeout(() => chatMessagesRef?.scrollToBottomPublic?.(), 50);
	}
</script>

<svelte:head>
	<title>Vanar AI Assistant - The Chain That Thinks</title>
	<style>
		@keyframes fade-in {
			from { opacity: 0; transform: translateY(20px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes float {
			0%, 100% { transform: translateY(0px); }
			50% { transform: translateY(-10px); }
		}
		
		@keyframes glow {
			0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
			50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5); }
		}
		
		.animate-fade-in {
			animation: fade-in 0.8s ease-out;
		}
		
		.animate-float {
			animation: float 3s ease-in-out infinite;
		}
		
		.animate-glow {
			animation: glow 2s ease-in-out infinite;
		}
		
		/* Smooth scrolling */
		html {
			scroll-behavior: smooth;
		}
		
		/* Custom scrollbar */
		::-webkit-scrollbar {
			width: 8px;
		}
		
		::-webkit-scrollbar-track {
			background: rgba(255, 255, 255, 0.1);
			border-radius: 4px;
		}
		
		::-webkit-scrollbar-thumb {
			background: linear-gradient(45deg, #6366f1, #8b5cf6);
			border-radius: 4px;
		}
		
		::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(45deg, #4f46e5, #7c3aed);
		}
		
		/* Ensure chat grid maintains fixed height */
		.chat-grid {
			height: calc(100vh - 20rem) !important;
			max-height: calc(100vh - 20rem) !important;
			overflow: hidden;
		}
		
		/* Ensure sidebar maintains fixed height */
		.chat-sidebar {
			height: 100% !important;
			max-height: 100% !important;
			overflow: hidden;
		}
	</style>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 relative overflow-hidden">
	<!-- Animated background elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-200 blur-3xl opacity-60 animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-violet-200 blur-3xl opacity-60 animate-pulse" style="animation-delay: 2s"></div>
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-pink-200 blur-3xl opacity-40 animate-pulse" style="animation-delay: 4s"></div>
	</div>

	<Navigation user={user ?? null} currentPage="chat" />
	
	<!-- Enhanced Chat Container -->
	<div class="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Enhanced Welcome Header for New Users -->
		{#if $conversations.length === 0 && !initializing}
			<div class="text-center mb-12 animate-fade-in">
				<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 rounded-full mb-6 shadow-lg animate-bounce">
					<img src="/gemini-logo.png" alt="AI" class="w-10 h-10 object-contain" />
				</div>
				<h1 class="text-4xl font-bold text-neutral-800 mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
					Welcome to Vanar AI Assistant
				</h1>
				<p class="text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed mb-8">
					Your intelligent conversation partner powered by Google Gemini. Start a new conversation to begin exploring the possibilities.
				</p>
				<!-- Feature highlights -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
					<div class="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
						<div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
							<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-neutral-800 mb-2">Lightning Fast</h3>
						<p class="text-neutral-600">Get instant responses powered by advanced AI technology</p>
					</div>
					<div class="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-violet-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
						<div class="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
							<svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-neutral-800 mb-2">Smart & Secure</h3>
						<p class="text-neutral-600">Your conversations are protected with enterprise-grade security</p>
					</div>
					<div class="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
						<div class="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
							<svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
							</svg>
						</div>
						<h3 class="text-lg font-semibold text-neutral-800 mb-2">Always Learning</h3>
						<p class="text-neutral-600">Continuously improving to provide better assistance</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Enhanced Chat Layout with Different Header/Footer Design -->
		<div class="relative">
			<!-- Custom Header Bar -->
			<div class="mb-6 bg-gradient-to-r from-indigo-200 via-violet-200 to-pink-200 rounded-2xl shadow-xl border border-indigo-200/50 overflow-hidden">
				<div class="px-6 py-4 flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<div class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
							<img src="/src/lib/assets/images-removebg-preview.png" alt="Vanar" class="w-6 h-6 object-contain" />
						</div>
						<div>
							<h1 class="text-lg font-bold text-neutral-800">Vanar AI Chat</h1>
							<p class="text-sm text-neutral-600">Intelligent Conversations</p>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="flex items-center bg-green-100 px-3 py-1 rounded-lg border border-green-200">
							<div class="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
							<span class="text-xs text-green-700 font-medium">Live</span>
						</div>
						<div class="text-xs text-neutral-500">
							{new Date().toLocaleTimeString()}
						</div>
					</div>
				</div>
			</div>

			<!-- Main Chat Grid -->
			<div class="chat-grid grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 h-[calc(100vh-20rem)] min-h-[600px] max-h-[calc(100vh-20rem)]">
				<!-- Enhanced Sidebar -->
				<div class="chat-sidebar order-2 lg:order-1 h-full">
					<div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-200/50 overflow-hidden h-full max-h-full">
						<ChatSidebar
							memoizedConversations={$conversations}
							currentConversationId={$currentConversationId}
							onSelectConversation={selectConversation}
							onNewConversation={newConversation}
							onDeleteConversation={(id) => openDeleteModal(id, ($conversations.find((c: any) => c.id === id)?.roomName) || 'this conversation')}
							onClearAll={openDeleteAllModal}
							error={$error}
							getTimeUntilRetry={getTimeUntilRetry}
							{initializing}
						/>
					</div>
				</div>

				<!-- Enhanced Main Chat Area -->
				<div class="lg:col-span-3 order-1 lg:order-2 min-h-0 h-full flex flex-col">
					<div class="rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-indigo-200/50 overflow-hidden h-full flex flex-col relative group">
						<!-- Enhanced gradient overlay -->
						<div class="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-violet-50/30 pointer-events-none group-hover:from-indigo-50/40 group-hover:to-violet-50/40 transition-all duration-500"></div>
						
						<!-- Glowing border effect -->
						<div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-400/15 via-violet-400/15 to-pink-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
						
						<!-- Enhanced Chat Header -->
						<div class="relative z-10">
							<ChatHeader error={$error} retryCountdown={0} {getTimeUntilRetry} />
						</div>
						
						<!-- Enhanced Chat Messages -->
						<div class="relative z-10 flex-1 min-h-0">
							<ChatMessages
								bind:this={chatMessagesRef}
								messages={$messages}
								{initializing}
								onEditMessage={editMessage}
							/>
						</div>
						
						<!-- Enhanced Error Banner -->
						{#if $error}
							<div class="relative z-10">
								<ChatErrorBanner
									error={$error}
									{canRetryNow}
									{getTimeUntilRetry}
									clearErrorState={clearErrorState}
									onRetry={() => { clearErrorState(); handleSend(); }}
								/>
							</div>
						{/if}
						
						<!-- Enhanced Chat Input -->
						<div class="relative z-10">
							<ChatInput value={messageText} loading={$loading} onSend={handleSend} onInput={(v) => messageText = v} />
						</div>
					</div>
				</div>
			</div>

			<!-- Custom Footer Bar -->
			<div class="mt-6 bg-gradient-to-r from-indigo-100 via-violet-100 to-pink-100 rounded-2xl border border-indigo-200/50 overflow-hidden shadow-lg">
				<div class="px-6 py-3 flex items-center justify-between">
					<div class="flex items-center space-x-4">
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
							<span class="text-xs text-neutral-700 font-medium">AI Status: Active</span>
						</div>
						<div class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-violet-300 rounded-full animate-pulse" style="animation-delay: 0.5s"></div>
							<span class="text-xs text-neutral-700 font-medium">Connection: Stable</span>
						</div>
					</div>
					<div class="flex items-center space-x-3">
						<div class="text-xs text-neutral-600">
							© 2024 Vanar AI Assistant
						</div>
						<div class="flex items-center space-x-1">
							<div class="w-1 h-1 bg-neutral-400 rounded-full"></div>
							<div class="w-1 h-1 bg-neutral-400 rounded-full"></div>
							<div class="w-1 h-1 bg-neutral-400 rounded-full"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<ChatModals
		showDeleteModal={$showDeleteModal}
		deleteTarget={$deleteTarget}
		onCloseDelete={closeDeleteModal}
		onConfirmDelete={confirmDeleteConversation}
		showDeleteAllModal={$showDeleteAllModal}
		deleteAllTarget={$deleteAllTarget}
		onCloseDeleteAll={closeDeleteAllModal}
		onConfirmDeleteAll={confirmDeleteAllConversations}
	/>

	<!-- Toast notifications for user feedback -->
	<ToastNotification show={false} message="" type="info" />
</div>