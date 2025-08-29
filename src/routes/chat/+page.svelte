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
		activeDocument,
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
		setActiveDocument,
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
		// Set the active document for this conversation
		if (event.detail.document && event.detail.document.originalName) {
			setActiveDocument(event.detail.document.id, event.detail.document.originalName);
		}
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
				<div class="rounded-xl bg-card shadow-lg overflow-hidden h-full min-h-0 flex flex-col border">
					<ChatHeader
						error={$error}
						retryCountdown={0}
						{getTimeUntilRetry}
						on:toggleDocuments={toggleDocumentSidebar}
					/>
					
					<!-- Document Indicator -->
					{#if $activeDocument}
						<div class="px-4 py-2 bg-blue-50 border-b border-blue-200">
							<p class="text-sm text-blue-600">
								Using document: <span class="font-medium">{$activeDocument.originalName}</span>
							</p>
						</div>
					{/if}
					
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
		conversationId={$currentConversationId}
		on:close={() => showDocumentSidebar = false}
		on:documentUploaded={handleDocumentUploaded}
		on:documentDeleted={handleDocumentDeleted}
	/>
</div>