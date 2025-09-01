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
	import DocumentSidebar from '$lib/components/chat/DocumentSidebar.svelte';
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
		treeStructure,
		branchNavigation,
		activePath,
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
		forkMessage,
		switchBranch,
		regenerateMessage
	} = store;

	let messageText = '';
	let chatMessagesRef: any;
	let initializing = true;
	let showDocumentSidebar = false;
	let documentRefreshTrigger = 0;

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

	function toggleDocumentSidebar() {
		showDocumentSidebar = !showDocumentSidebar;
	}

	function handleDocumentUploaded(event: CustomEvent) {
		console.log('Document uploaded:', event.detail);
		// Could show a toast notification here
		documentRefreshTrigger += 1;
	}

	function handleDocumentDeleted(event: CustomEvent) {
		console.log('Document deleted:', event.detail);
		documentRefreshTrigger += 1;
	}
</script>

<svelte:head>
	<title>Vanar AI Assistant - The Chain That Thinks</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="flex h-screen">
		<div class="w-[450px] flex-shrink-0">
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
				{user}
			/>

		</div>
		<div class="flex-1 flex flex-col bg-background">
			<ChatHeader
				error={$error}
				retryCountdown={0}
				{getTimeUntilRetry}
				on:toggleDocuments={toggleDocumentSidebar}
			/>
			<ChatMessages
				bind:this={chatMessagesRef}
				messages={$messages}
				{initializing}
				onForkMessage={forkMessage}
				onRegenerateMessage={regenerateMessage}
				onSwitchBranch={switchBranch}
				branchNavigation={$branchNavigation}
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

	<!-- Document Sidebar -->
	<DocumentSidebar
		isOpen={showDocumentSidebar}
		refreshTrigger={documentRefreshTrigger}
		on:close={() => showDocumentSidebar = false}
		on:documentUploaded={handleDocumentUploaded}
		on:documentDeleted={handleDocumentDeleted}
	/>
</div>