<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	export let data: any;
	import Navigation from '$lib/components/Navigation.svelte';
	import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
	import ChatInput from '$lib/components/chat/ChatInput.svelte';
	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatMessages from '$lib/components/chat/ChatMessages.svelte';
	import ChatErrorBanner from '$lib/components/chat/ChatErrorBanner.svelte';
	import ChatModals from '$lib/components/chat/ChatModals.svelte';
	import ToastNotification from '$lib/components/chat/ToastNotification.svelte';
	import { createChatStore } from '$lib/stores/chat';

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
		// store handles its internal timers
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
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-gray-50 to-indigo-50">
	<Navigation user={user ?? null} currentPage="chat" />
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
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

			<div class="lg:col-span-3 order-1 lg:order-2 min-h-0 h-full flex flex-col">
				<div class="rounded-xl bg-white shadow-md border border-indigo-100 overflow-hidden h-full min-h-0 flex flex-col">
					<ChatHeader error={$error} retryCountdown={0} {getTimeUntilRetry} />
					<ChatMessages
						bind:this={chatMessagesRef}
						messages={$messages}
						{initializing}
						onEditMessage={editMessage}
					/>
					{#if $error}
						<ChatErrorBanner
							error={$error}
							{canRetryNow}
							{getTimeUntilRetry}
							clearErrorState={clearErrorState}
							onRetry={() => { clearErrorState(); handleSend(); }}
						/>
					{/if}
					<ChatInput value={messageText} loading={$loading} onSend={handleSend} onInput={(v) => messageText = v} />
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

	<ToastNotification show={false} message={''} type={'info'} />
</div>