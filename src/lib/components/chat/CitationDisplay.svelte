<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, ExternalLink, ChevronDown, ChevronUp } from '@lucide/svelte';

	export let messageId: string;

	interface Citation {
		id: string;
		documentId: string;
		documentName: string;
		fileType: string;
		chunkIds: string[];
		relevanceScore: number;
		citationText: string;
		pageNumber?: number;
		section?: string;
		createdAt: string;
	}

	let citations: Citation[] = [];
	let loading = true;
	let error = '';
	let expanded = false;
	let maxVisible = 3;

	async function fetchCitations() {
		try {
			loading = true;
			error = '';

			const response = await fetch(`/api/chat/${messageId}/citations`);
			const result = await response.json();

			if (result.success) {
				citations = result.citations;
				// If no citations returned, don't show any UI
				if (citations.length === 0) {
					loading = false;
					return;
				}
			} else {
				// If the API returns an error (like message not found), silently handle it
				// This is expected for messages without citations
				citations = [];
				loading = false;
				return;
			}
		} catch (err: any) {
			// Silently handle fetch errors for messages without citations
			// This prevents console spam for normal chat messages
			citations = [];
			error = '';
		} finally {
			loading = false;
		}
	}

	function toggleExpanded() {
		expanded = !expanded;
	}

	function getFileTypeIcon(fileType: string) {
		// You can add more specific icons for different file types
		return FileText;
	}

	function getFileTypeColor(fileType: string) {
		switch (fileType.toLowerCase()) {
			case 'pdf':
				return 'text-red-600';
			case 'docx':
				return 'text-blue-600';
			case 'txt':
				return 'text-green-600';
			default:
				return 'text-gray-600';
		}
	}

	function formatCitationText(text: string): string {
		// Truncate long citation text
		if (text.length > 150) {
			return text.substring(0, 150) + '...';
		}
		return text;
	}

	onMount(() => {
		fetchCitations();
	});

	$: visibleCitations = expanded ? citations : citations.slice(0, maxVisible);
	$: hasMore = citations.length > maxVisible;
</script>

{#if loading}
	<div class="citation-loading">
		<div class="loading-spinner"></div>
		<span>Loading sources...</span>
	</div>
{:else if error}
	<div class="citation-error">
		<span>Failed to load sources</span>
	</div>
{:else if citations.length > 0}
	<div class="citation-container">
		<div class="citation-header">
			<span class="citation-label">Sources</span>
			<span class="citation-count">({citations.length})</span>
		</div>

		<div class="citation-list">
			{#each visibleCitations as citation (citation.id)}
				<div class="citation-item">
					<div class="citation-main">
						<div class="document-info">
							<svelte:component
								this={getFileTypeIcon(citation.fileType)}
								class="file-icon {getFileTypeColor(citation.fileType)}"
								size={14}
							/>
							<div class="document-details">
								<span class="document-name" title={citation.documentName}>
									{citation.documentName}
								</span>
								{#if citation.pageNumber}
									<span class="page-info">Page {citation.pageNumber}</span>
								{/if}
								{#if citation.section}
									<span class="section-info">• {citation.section}</span>
								{/if}
							</div>
						</div>
						<div class="citation-meta">
							{#if citation.relevanceScore}
								<span class="relevance-score">
									{Math.round(citation.relevanceScore)}% relevant
								</span>
							{/if}
						</div>
					</div>

					{#if citation.citationText}
						<div class="citation-text">
							"{formatCitationText(citation.citationText)}"
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if hasMore}
			<button class="expand-btn" onclick={toggleExpanded}>
				{#if expanded}
					<ChevronUp size={14} />
					Show less
				{:else}
					<ChevronDown size={14} />
					Show {citations.length - maxVisible} more
				{/if}
			</button>
		{/if}
	</div>
{/if}

<style>
	.citation-loading,
	.citation-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.loading-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid #e5e7eb;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.citation-container {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	.citation-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.citation-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #374151;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.citation-count {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.citation-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.citation-item {
		padding: 0.75rem;
		background: #f9fafb;
		border: 1px solid #f3f4f6;
		border-radius: 6px;
		font-size: 0.875rem;
	}

	.citation-main {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.document-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
	}



	.document-details {
		min-width: 0;
		flex: 1;
	}

	.document-name {
		display: block;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.125rem;
		word-break: break-word;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.page-info,
	.section-info {
		display: inline-block;
		font-size: 0.75rem;
		color: #6b7280;
		margin-right: 0.5rem;
	}

	.citation-meta {
		flex-shrink: 0;
		margin-left: 1rem;
	}

	.relevance-score {
		font-size: 0.75rem;
		color: #059669;
		font-weight: 500;
		white-space: nowrap;
	}

	.citation-text {
		font-size: 0.8125rem;
		color: #4b5563;
		line-height: 1.4;
		font-style: italic;
		padding-left: 1.75rem;
		position: relative;
	}

	.citation-text::before {
		content: '"';
		position: absolute;
		left: 0;
		top: 0;
		font-size: 1.5rem;
		line-height: 1;
		color: #9ca3af;
	}

	.expand-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem;
		margin-top: 0.5rem;
		background: none;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		color: #6b7280;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		width: fit-content;
	}

	.expand-btn:hover {
		background: #f9fafb;
		border-color: #9ca3af;
		color: #374151;
	}
</style>
