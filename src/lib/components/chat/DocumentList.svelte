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
				documents = documents.filter(doc => doc.id !== docId);
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
				return 'text-green-600';
			case 'processing':
				return 'text-blue-600';
			case 'failed':
				return 'text-red-600';
			default:
				return 'text-gray-600';
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
	<div class="header">
		<h3 class="title">Your Documents</h3>
		<button class="refresh-btn" onclick={fetchDocuments} disabled={loading}>
			<RefreshCw class="icon" className={loading ? 'spinning' : ''} size={16} />
		</button>
	</div>

	{#if loading && documents.length === 0}
		<div class="loading-state">
			<RefreshCw class="spinning" size={24} />
			<p>Loading documents...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<AlertCircle size={24} class="error-icon" />
			<p>{error}</p>
			<button class="retry-btn" onclick={fetchDocuments}>Retry</button>
		</div>
	{:else if documents.length === 0}
		<div class="empty-state">
			<FileText size={32} class="empty-icon" />
			<p>No documents uploaded yet</p>
			<p class="empty-subtitle">Upload some documents to enhance your conversations</p>
		</div>
	{:else}
		<div class="documents-grid">
			{#each documents as doc (doc.id)}
				<div class="document-card" class:processing={doc.status === 'processing'}>
					<div class="card-header">
						<div class="file-info">
							<FileText class="file-icon" size={20} />
							<div class="file-details">
								<h4 class="file-name" title={doc.fileName}>{doc.fileName}</h4>
								<p class="file-meta">
									{formatFileSize(doc.fileSize)} • {doc.fileType.toUpperCase()}
								</p>
							</div>
						</div>
						<div class="status-indicator">
							<svelte:component
								this={getStatusIcon(doc.status)}
								class="status-icon {getStatusColor(doc.status)}"
								size={16}
							/>
							<span class="status-text">{getStatusText(doc.status)}</span>
						</div>
					</div>

					{#if doc.errorMessage}
						<div class="error-message">
							<AlertCircle size={14} />
							<span>{doc.errorMessage}</span>
						</div>
					{/if}

					<div class="card-footer">
						<p class="upload-date">Uploaded {formatDate(doc.createdAt)}</p>
						<div class="actions">
							{#if doc.status === 'completed'}
								<button 
									class="action-btn download-btn" 
									title="Download"
									onclick={() => downloadDocument(doc)}
								>
									<Download size={14} />
								</button>
							{/if}
							<button
								class="action-btn delete-btn"
								onclick={() => deleteDocument(doc.id)}
								disabled={deletingId === doc.id}
								title="Delete"
							>
								{#if deletingId === doc.id}
									<RefreshCw class="spinning" size={14} />
								{:else}
									<Trash2 size={14} />
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.document-list {
		width: 100%;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
		margin: 0;
	}

	.refresh-btn {
		padding: 0.5rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		background: #f3f4f6;
		color: #374151;
	}

	.refresh-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
		gap: 1rem;
	}

	.loading-state p,
	.error-state p,
	.empty-state p {
		color: #6b7280;
		margin: 0;
	}

	.empty-subtitle {
		font-size: 0.875rem;
		color: #9ca3af;
	}



	.retry-btn {
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.retry-btn:hover {
		background: #2563eb;
	}

	.documents-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.document-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		transition: all 0.2s ease;
	}

	.document-card:hover {
		border-color: #d1d5db;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.document-card.processing {
		opacity: 0.8;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}

	.file-info {
		display: flex;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}

	.file-details {
		min-width: 0;
		flex: 1;
	}

	.file-name {
		font-weight: 500;
		color: #374151;
		margin: 0 0 0.25rem 0;
		font-size: 0.875rem;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.file-meta {
		font-size: 0.75rem;
		color: #6b7280;
		margin: 0;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.status-text {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #dc2626;
		margin-bottom: 0.75rem;
	}

	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.upload-date {
		font-size: 0.75rem;
		color: #9ca3af;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-btn {
		padding: 0.375rem;
		background: none;
		border: none;
		color: #6b7280;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.action-btn:hover {
		background: #f3f4f6;
		color: #374151;
	}

	.delete-btn:hover {
		background: #fef2f2;
		color: #dc2626;
	}

	.download-btn:hover {
		background: #f0f9ff;
		color: #2563eb;
	}

	.action-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
