<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileText, Upload, X } from '@lucide/svelte';
	import DocumentUpload from './DocumentUpload.svelte';
	import DocumentList from './DocumentList.svelte';

	export let isOpen = false;
	export let refreshTrigger = 0;
	export let conversationId: string | undefined = undefined;

	const dispatch = createEventDispatcher();

	function closeSidebar() {
		isOpen = false;
		dispatch('close');
	}

	function handleUploadSuccess(event: CustomEvent) {
		console.log('Document uploaded successfully:', event.detail);
		// Refresh the document list
		refreshTrigger += 1;
		dispatch('documentUploaded', event.detail);
	}

	function handleDocumentDeleted(event: CustomEvent) {
		console.log('Document deleted:', event.detail);
		dispatch('documentDeleted', event.detail);
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
		on:click={closeSidebar}
		on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
		role="button"
		tabindex="0"
		aria-label="Close document sidebar"
	></div>

	<!-- Sidebar -->
	<div
		class="fixed top-0 right-0 z-50 h-full w-96 transform bg-white shadow-xl transition-transform duration-200 ease-in-out"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-gray-200 p-4">
			<div class="flex items-center gap-2">
				<FileText class="h-5 w-5 text-blue-600" />
				<h2 class="text-lg font-semibold text-gray-900">Document Management</h2>
			</div>
			<button
				on:click={closeSidebar}
				class="rounded-md p-1 transition-colors hover:bg-gray-100"
				title="Close sidebar"
			>
				<X class="h-5 w-5 text-gray-500" />
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			<!-- Upload Section -->
			<div class="border-b border-gray-200 p-4">
				<h3 class="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
					<Upload class="h-4 w-4" />
					Upload Document
				</h3>
				<DocumentUpload {conversationId} on:uploadSuccess={handleUploadSuccess} />
			</div>

			<!-- Documents List Section -->
			<div class="p-4">
				<DocumentList {refreshTrigger} on:documentDeleted={handleDocumentDeleted} />
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for the sidebar content */
	:global(.sidebar-content::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.sidebar-content::-webkit-scrollbar-track) {
		background: #f1f1f1;
		border-radius: 3px;
	}

	:global(.sidebar-content::-webkit-scrollbar-thumb) {
		background: #c1c1c1;
		border-radius: 3px;
	}

	:global(.sidebar-content::-webkit-scrollbar-thumb:hover) {
		background: #a8a8a8;
	}
</style>
