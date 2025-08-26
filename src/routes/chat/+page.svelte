<script lang="ts">
	import { createChatStore } from '$lib/stores/chat';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { AuthError, handleApiError } from '$lib/errors';
	import ChatErrorBanner from '$lib/components/chat/ChatErrorBanner.svelte';
	import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatMessages from '$lib/components/chat/ChatMessages.svelte';
	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatModals from '$lib/components/chat/ChatModals.svelte';
	import ToastNotification from '$lib/components/chat/ToastNotification.svelte';
	import Navigation from '$lib/components/Navigation.svelte';

	export let data: any;

	// --- store setup ---
	let chatStore: ReturnType<typeof createChatStore>;
	let messagesContainer: HTMLElement;

	$: user = data.session?.user;
	const store = createChatStore(user?.id ?? null) as any;
	const {
		messages,
		conversations,
		currentRoomId,
		loading,
		error,
		showDeleteModal,
		deleteTarget,
		showDeleteAllModal,
		deleteAllTarget,
		currentConversation,
		// forking state
		activeVersions,
		forkingLoading,
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
		editMessage,
		// forking actions
		forkUserMessage,
		regenerateAssistantMessage,
		setActiveVersion,
		getActiveVersion,
		getMessagesWithActiveVersions,
		migrateExistingMessages
	} = store;

	// --- filtered messages: active branch only ---
	$: filteredMessages = getMessagesWithActiveVersions();
	$: displayMessages = filteredMessages; // Always use filtered messages to show only active branch
	
	// Debug logging
	$: console.log('All messages:', $messages);
	$: console.log('Filtered messages:', filteredMessages);
	$: console.log('Active versions:', $activeVersions);

	let messageText = '';
	let chatMessagesRef: any;
	let initializing = true;

	onMount(() => {
		loadConversationsFromStorage();
		loadChatHistory().finally(() => {
			// migrate messages for fork support
			if ($messages.length > 0) {
				migrateExistingMessages();
			}
			initializing = false;
		});
	});

	onDestroy(() => {
		// store cleans timers itself
	});

	function handleSend() {
		const text = messageText;
		messageText = '';
		sendMessage(text);
		setTimeout(() => chatMessagesRef?.scrollToBottomPublic?.(), 50);
	}
</script>

<svelte:head>
	<title>Vanar AI Assistant - Forking Chat</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<Navigation user={user ?? null} currentPage="chat" />
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
			<!-- Sidebar -->
			<ChatSidebar
				memoizedConversations={$conversations}
				currentRoomId={$currentRoomId}
				onSelectConversation={selectConversation}
				onNewConversation={newConversation}
				onDeleteConversation={(id) =>
					openDeleteModal(
						id,
						($conversations.find((c: any) => c.id === id)?.roomName) || 'this conversation'
					)}
				onClearAll={openDeleteAllModal}
				error={$error}
				getTimeUntilRetry={getTimeUntilRetry}
				{initializing}
			/>

			<!-- Main chat area -->
			<div class="lg:col-span-3 order-1 lg:order-2 min-h-0 h-full flex flex-col">
				<div class="rounded-xl bg-white shadow-lg overflow-hidden h-full min-h-0 flex flex-col">
					<ChatHeader error={$error} retryCountdown={0} {getTimeUntilRetry} />

					<!-- Branch indicator -->
					{#if $activeVersions && Object.keys($activeVersions).length > 0}
						<div class="bg-gray-100 text-gray-700 text-sm px-4 py-2 border-b border-gray-200 flex items-center justify-between">
							<span>Active Branch: {Object.values($activeVersions).join(' → ')}</span>
							<button
								class="text-xs text-blue-600 hover:underline"
								on:click={() => setActiveVersion(null)}>
								Reset to main branch
							</button>
						</div>
					{/if}

					<!-- Messages -->
					<ChatMessages
						bind:this={chatMessagesRef}
						messages={displayMessages}
						{initializing}
						onEditMessage={editMessage}
						onForkMessage={forkUserMessage}
						onRegenerateMessage={regenerateAssistantMessage}
						onSetActiveVersion={setActiveVersion}
						onGetActiveVersion={getActiveVersion}
					/>

					<!-- Error banner -->
					{#if $error}
						<ChatErrorBanner
							error={$error}
							{canRetryNow}
							{getTimeUntilRetry}
							clearErrorState={clearErrorState}
							onRetry={() => {
								clearErrorState();
								handleSend();
							}}
						/>
					{/if}

					<!-- Input -->
					<ChatInput
						value={messageText}
						loading={$loading}
						onSend={handleSend}
						onInput={(v) => (messageText = v)}
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Modals -->
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

	<!-- Toast -->
	<ToastNotification show={false} message={''} type={'info'} />
</div>
