<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, Trash2, Download, RefreshCw, AlertCircle, Check } from '@lucide/svelte';
	import { createEventDispatcher } from 'svelte';

	export let refreshTrigger = 0;

	const dispatch = createEventDispatcher();

	interface Document {
		id: string;
		fileName: string;
		originalName: string;
		fileSize: number;
		fileType: string;
		status: 'processing' | 'completed' | 'failed';
		createdAt: string;
		updatedAt: string;
		errorMessage?: string;
	}

	let documents: Document[] = [];
	let loading = true;
	let error = '';
	let deletingId: string | null = null;

	async function fetchDocuments() {
		try {
			loading = true;
			error = '';

			const response = await fetch('/api/documents');
			const result = await response.json();

			if (result.success) {
				documents = result.documents;
			} else {
				throw new Error(result.error || 'Failed to fetch documents');
			}
		} catch (err: any) {
			console.error('Fetch documents error:', err);
			error = err.message || 'Failed to load documents';
		} finally {
			loading = false;
		}
	}

	async function deleteDocument(docId: string) {
		try {
			deletingId = docId;

			const response = await fetch(`/api/documents/${docId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (result.success) {
				documents = documents.filter((doc) => doc.id !== docId);
				dispatch('documentDeleted', { documentId: docId });
			} else {
				throw new Error(result.error || 'Failed to delete document');
			}
		} catch (err: any) {
			console.error('Delete document error:', err);
			error = err.message || 'Failed to delete document';
		} finally {
			deletingId = null;
		}
	}

	async function downloadDocument(doc: Document) {
		try {
			const response = await fetch(`/api/documents/${doc.id}/download`);

			if (!response.ok) {
				throw new Error('Failed to download document');
			}

			// Get the filename from the response headers or use the original name
			const contentDisposition = response.headers.get('content-disposition');
			let filename = doc.originalName;

			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename="(.+)"/);
				if (filenameMatch) {
					filename = filenameMatch[1];
				}
			}

			// Create blob and download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (err: any) {
			console.error('Download document error:', err);
			error = err.message || 'Failed to download document';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'completed':
				return Check;
			case 'processing':
				return RefreshCw;
			case 'failed':
				return AlertCircle;
			default:
				return FileText;
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'text-primary';
			case 'processing':
				return 'text-primary';
			case 'failed':
				return 'text-destructive';
			default:
				return 'text-muted-foreground';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'completed':
				return 'Ready';
			case 'processing':
				return 'Processing...';
			case 'failed':
				return 'Failed';
			default:
				return status;
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	onMount(() => {
		fetchDocuments();
	});

	$: if (refreshTrigger) {
		fetchDocuments();
	}
</script>

<div class="document-list">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-foreground">Your Documents</h3>
		<button
			title="Refresh documents"
			onclick={fetchDocuments}
			disabled={loading}
			class="border-border bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ease-in-out hover:scale-110 hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-95"
		>
			<RefreshCw class="h-4 w-4" className={loading ? 'spinning' : ''} size={16} />
		</button>
	</div>

	{#if loading && documents.length === 0}
		<p class="mt-4 text-center">Loading documents...</p>
	{:else if error}
		<div class="bg-destructive/10 mt-4 rounded-lg p-4 text-center text-destructive">
			<p>{error}</p>
			<button 
				onclick={fetchDocuments}
				class="mt-4 inline-flex items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] hover:border-secondary hover:bg-secondary hover:text-secondary-foreground active:scale-[0.98]"
			>
				Retry
			</button>
		</div>
	{:else if documents.length === 0}
		<div class="mt-4 py-8 text-center">
			<p class="font-semibold text-foreground">No documents uploaded yet</p>
			<p>Upload some documents to enhance your conversations</p>
		</div>
	{:else}
		<ul class="mt-4 space-y-3">
			{#each documents as doc (doc.id)}
				<li class="border-border bg-muted/50 rounded-lg border p-3">
					<div class="flex justify-between items-start mb-3">
						<div class="flex gap-3 flex-1 min-w-0">
							<FileText class="file-icon text-muted-foreground" size={20} />
							<div class="min-w-0 flex-1">
								<h4 class="file-name font-medium text-foreground mb-1 text-sm" title={doc.fileName}>
									{doc.originalName}
								</h4>
								<p class="file-meta text-xs text-muted-foreground">
									{formatFileSize(doc.fileSize)} • {doc.fileType.toUpperCase()}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-1.5 flex-shrink-0">
							<svelte:component
								this={getStatusIcon(doc.status)}
								class="status-icon {getStatusColor(doc.status)}"
								size={16}
							/>
							<span class="status-text text-xs font-medium">{getStatusText(doc.status)}</span>
						</div>
					</div>

					{#if doc.errorMessage}
						<div class="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive mb-3">
							<AlertCircle size={14} />
							<span>{doc.errorMessage}</span>
						</div>
					{/if}

					<div class="flex items-center justify-between border-t border-border pt-3">
						<p class="text-xs text-muted-foreground/70">Uploaded {formatDate(doc.createdAt)}</p>
						<div class="flex items-center space-x-2">
							{#if doc.status === 'completed'}
								<button 
									title="Download" 
									onclick={() => downloadDocument(doc)}
									class="border-border bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ease-in-out hover:scale-110 hover:border-accent hover:bg-accent hover:text-accent-foreground active:scale-95"
								>
									<Download size={14} />
								</button>
							{/if}
							<button 
								title="Delete" 
								onclick={() => deleteDocument(doc.id)}
								disabled={deletingId === doc.id} 
								class="border-border bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ease-in-out hover:scale-110 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if deletingId === doc.id}
									<RefreshCw class="spinning" size={14} />
								{:else}
									<Trash2 size={14} />
								{/if}
							</button>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.document-list {
		width: 100%;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}


	.file-name {
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
