<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FileText, Upload, X } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
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
		class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
		onclick={closeSidebar}
		onkeydown={(e) => e.key === 'Escape' && closeSidebar()}
		role="button"
		tabindex="0"
		aria-label="Close document sidebar"
	></div>

	<!-- Sidebar -->
	<aside
		class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
	>
		<!-- Header -->
		<div class="flex items-center justify-between border-b border-border p-4">
			<div class="flex items-center gap-2">
				<FileText class="h-5 w-5 text-primary" />
				<h2 class="text-lg font-semibold text-foreground">Document Management</h2>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={closeSidebar}
				class="h-8 w-8 p-0"
				aria-label="Close document sidebar"
			>
				<X class="h-4 w-4" />
			</Button>
		</div>

		<!-- Content -->
		<div class="flex-grow space-y-6 overflow-y-auto p-4">
			<!-- DocumentUpload will go here -->
			<Card.Root class="border-border bg-card shadow-sm">
				<Card.Header>
					<Card.Title class="text-lg font-semibold text-card-foreground">Upload Document</Card.Title>
				</Card.Header>
				<Card.Content>
					<DocumentUpload {conversationId} on:uploadSuccess={handleUploadSuccess} />
				</Card.Content>
			</Card.Root>

			<!-- DocumentList will go here -->
			<Card.Root class="border-border bg-card shadow-sm">
				<Card.Content class="p-4">
					<DocumentList {refreshTrigger} on:documentDeleted={handleDocumentDeleted} />
				</Card.Content>
			</Card.Root>
		</div>
	</aside>
{/if}

<style>
	/* Custom scrollbar for the sidebar content */
	:global(.sidebar-content::-webkit-scrollbar) {
		width: 6px;
	}

	:global(.sidebar-content::-webkit-scrollbar-track) {
		background: hsl(var(--muted));
		border-radius: 3px;
	}

	:global(.sidebar-content::-webkit-scrollbar-thumb) {
		background: hsl(var(--muted-foreground) / 0.6);
		border-radius: 3px;
	}

	:global(.sidebar-content::-webkit-scrollbar-thumb:hover) {
		background: hsl(var(--muted-foreground) / 0.8);
	}
</style>
