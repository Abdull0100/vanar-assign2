<script lang="ts">
	import { onMount } from 'svelte';
	import { FileText, ExternalLink, ChevronDown, ChevronUp } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

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
			} else {
				throw new Error(result.error || 'Failed to fetch citations');
			}
		} catch (err: any) {
			console.error('Fetch citations error:', err);
			error = err.message || 'Failed to load citations';
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
				return 'text-muted-foreground';
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
	<div class="flex items-center gap-2 py-2 text-xs text-muted-foreground">
		<div class="loading-spinner"></div>
		<span>Loading sources...</span>
	</div>
{:else if error}
	<div class="flex items-center gap-2 py-2 text-xs text-destructive">
		<span>Failed to load sources</span>
	</div>
{:else if citations.length > 0}
	<Card.Root class="mt-4 border-t border-border pt-4">
		<Card.Header class="pb-3">
			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold uppercase tracking-wide text-foreground">Sources</span>
				<Badge variant="secondary" class="text-xs">
					{citations.length}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="space-y-3">
			{#each visibleCitations as citation (citation.id)}
				<Card.Root class="border-border bg-muted/50">
					<Card.Content class="p-3">
						<div class="flex justify-between items-start mb-2">
							<div class="flex items-center gap-2 flex-1 min-w-0">
								<svelte:component
									this={getFileTypeIcon(citation.fileType)}
									class="file-icon {getFileTypeColor(citation.fileType)}"
									size={14}
								/>
								<div class="min-w-0 flex-1">
									<span class="block font-medium text-foreground text-sm mb-1 truncate" title={citation.documentName}>
										{citation.documentName}
									</span>
									<div class="flex items-center gap-2 text-xs text-muted-foreground">
										{#if citation.pageNumber}
											<span>Page {citation.pageNumber}</span>
										{/if}
										{#if citation.section}
											<span>• {citation.section}</span>
										{/if}
									</div>
								</div>
							</div>
							{#if citation.relevanceScore}
								<Badge variant="outline" class="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
									{Math.round(citation.relevanceScore)}% relevant
								</Badge>
							{/if}
						</div>

						{#if citation.citationText}
							<div class="relative pl-6 text-sm text-muted-foreground leading-relaxed italic">
								<div class="absolute left-0 top-0 text-2xl text-muted-foreground/60 leading-none">"</div>
								{formatCitationText(citation.citationText)}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</Card.Content>

		{#if hasMore}
			<Card.Footer class="pt-0">
				<Button
					variant="outline"
					size="sm"
					onclick={toggleExpanded}
					class="w-fit"
				>
					{#if expanded}
						<ChevronUp size={14} class="mr-1" />
						Show less
					{:else}
						<ChevronDown size={14} class="mr-1" />
						Show {citations.length - maxVisible} more
					{/if}
				</Button>
			</Card.Footer>
		{/if}
	</Card.Root>
{/if}

<style>
	.loading-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid hsl(var(--muted));
		border-top: 2px solid hsl(var(--primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

</style>
