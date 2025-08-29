<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileText, Upload, X } from '@lucide/svelte';
	import DocumentUpload from './DocumentUpload.svelte';
	import DocumentList from './DocumentList.svelte';

	export let isOpen = false;
	export let refreshTrigger = 0;

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
		class="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
		on:click={closeSidebar}
		on:keydown={(e) => e.key === 'Escape' && closeSidebar()}
		role="button"
		tabindex="0"
		aria-label="Close document sidebar"
	></div>

	<!-- Sidebar -->
	<div class="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 transform transition-transform duration-200 ease-in-out">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200">
			<div class="flex items-center gap-2">
				<FileText class="w-5 h-5 text-blue-600" />
				<h2 class="text-lg font-semibold text-gray-900">Document Management</h2>
			</div>
			<button
				on:click={closeSidebar}
				class="p-1 hover:bg-gray-100 rounded-md transition-colors"
				title="Close sidebar"
			>
				<X class="w-5 h-5 text-gray-500" />
			</button>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto">
			<!-- Upload Section -->
			<div class="p-4 border-b border-gray-200">
				<h3 class="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
					<Upload class="w-4 h-4" />
					Upload Document
				</h3>
				<DocumentUpload
					on:uploadSuccess={handleUploadSuccess}
				/>
			</div>

			<!-- Documents List Section -->
			<div class="p-4">
				<DocumentList
					{refreshTrigger}
					on:documentDeleted={handleDocumentDeleted}
				/>
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
