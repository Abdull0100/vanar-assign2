import type { RetrievedChunk } from './RAGService';

export interface CitationInfo {
	chunkId: string;
	documentId: string;
	documentName: string;
	pageNumber?: number;
	section?: string;
	relevanceScore: number;
	excerpt: string;
}

export interface PromptContext {
	retrievedChunks: RetrievedChunk[];
	userQuery: string;
	conversationHistory?: Array<{
		role: 'user' | 'assistant';
		content: string;
	}>;
	systemInstructions?: string;
}

/**
 * RAG Prompt Templates for different use cases
 */
export class RAGPromptTemplates {

	/**
	 * Standard RAG prompt template with citations
	 */
	static standardRAGTemplate(context: PromptContext): string {
		const { retrievedChunks, userQuery, conversationHistory, systemInstructions } = context;

		const citations = this.formatCitations(retrievedChunks);
		const contextString = this.buildContextString(retrievedChunks);
		const historyString = this.formatConversationHistory(conversationHistory);

		return `${systemInstructions || this.defaultSystemInstructions()}

${historyString}

CONTEXT INFORMATION:
${contextString}

QUESTION: ${userQuery}

INSTRUCTIONS:
- Answer based primarily on the provided context information
- If the context doesn't contain enough information to fully answer, say so clearly
- When referencing information from documents, use citation numbers [1], [2], etc.
- Be specific and quote relevant passages when helpful
- If multiple sources conflict, acknowledge the differences
- Maintain conversation context from previous messages

CITATIONS:
${citations}

Please provide a comprehensive answer based on the above context:`;
	}

	/**
	 * Conversational RAG template that maintains chat history
	 */
	static conversationalRAGTemplate(context: PromptContext): string {
		const { retrievedChunks, userQuery, conversationHistory } = context;

		const citations = this.formatCitations(retrievedChunks);
		const contextString = this.buildContextString(retrievedChunks);
		const historyString = this.formatConversationHistory(conversationHistory);

		return `You are a helpful AI assistant with access to the user's documents. Use the following context and conversation history to provide accurate, helpful responses.

CONVERSATION HISTORY:
${historyString}

RELEVANT DOCUMENT CONTEXT:
${contextString}

CURRENT QUESTION: ${userQuery}

CITATIONS:
${citations}

Guidelines:
- Reference specific documents and sections using citation numbers [1], [2], etc.
- If the question cannot be answered from the provided context, clearly state this limitation
- Maintain consistency with previous responses in the conversation
- Be conversational but informative
- When appropriate, suggest related questions or topics from the documents

Response:`;
	}

	/**
	 * Analytical RAG template for deeper analysis tasks
	 */
	static analyticalRAGTemplate(context: PromptContext): string {
		const { retrievedChunks, userQuery } = context;

		const citations = this.formatCitations(retrievedChunks);
		const contextString = this.buildContextString(retrievedChunks);

		return `You are an analytical AI assistant specializing in document analysis. Your task is to provide deep, insightful analysis based on the provided document context.

DOCUMENT CONTEXT:
${contextString}

ANALYSIS REQUEST: ${userQuery}

CITATIONS:
${citations}

ANALYTICAL FRAMEWORK:
1. **Key Information Extraction**: Identify and summarize the most relevant information from the documents
2. **Pattern Recognition**: Look for patterns, trends, or connections across different documents
3. **Critical Analysis**: Evaluate the reliability, context, and implications of the information
4. **Synthesis**: Combine information from multiple sources to provide comprehensive insights
5. **Recommendations**: Where appropriate, suggest actions or further investigation

Please provide a thorough analytical response that:
- Breaks down complex information into digestible insights
- Highlights important relationships and dependencies
- Notes any gaps or areas requiring further clarification
- Supports all claims with specific citations [1], [2], etc.
- Maintains objectivity while being maximally informative

Analysis:`;
	}

	/**
	 * Summary RAG template for document summarization
	 */
	static summaryRAGTemplate(context: PromptContext): string {
		const { retrievedChunks, userQuery } = context;

		const citations = this.formatCitations(retrievedChunks);
		const contextString = this.buildContextString(retrievedChunks);

		return `You are a document summarization expert. Your task is to create comprehensive, well-structured summaries based on the provided document content.

SOURCE DOCUMENTS:
${contextString}

SUMMARIZATION REQUEST: ${userQuery}

CITATIONS:
${citations}

SUMMARIZATION GUIDELINES:
1. **Hierarchical Structure**: Organize information from general to specific
2. **Key Themes**: Identify and group related concepts and ideas
3. **Critical Information**: Highlight the most important facts, findings, or conclusions
4. **Logical Flow**: Ensure the summary follows a natural progression
5. **Conciseness**: Be comprehensive but avoid unnecessary repetition
6. **Source Attribution**: Always cite sources for specific claims or information

Please provide a well-structured summary that captures the essence of the source material while maintaining accuracy and proper attribution.

Summary:`;
	}

	/**
	 * Question Answering RAG template optimized for factual Q&A
	 */
	static questionAnsweringTemplate(context: PromptContext): string {
		const { retrievedChunks, userQuery } = context;

		const citations = this.formatCitations(retrievedChunks);
		const contextString = this.buildContextString(retrievedChunks);

		return `You are a precise question-answering AI with access to specific documents. Your goal is to provide accurate, evidence-based answers to questions.

DOCUMENT EVIDENCE:
${contextString}

QUESTION: ${userQuery}

CITATIONS:
${citations}

ANSWERING PROTOCOL:
1. **Direct Answer**: Start with a clear, direct answer to the question
2. **Evidence Support**: Immediately follow with supporting evidence from documents
3. **Citation Links**: Use citation numbers [1], [2], etc. for all factual claims
4. **Confidence Level**: Indicate if the answer is definitive, partial, or requires more context
5. **Source Quality**: Note the relevance and reliability of the supporting evidence
6. **Clarifications**: Address any ambiguities or potential misinterpretations

If the question cannot be fully answered from the provided documents, clearly state what information is available and what is missing.

Answer:`;
	}

	/**
	 * Build context string from retrieved chunks
	 */
	private static buildContextString(retrievedChunks: RetrievedChunk[]): string {
		if (retrievedChunks.length === 0) {
			return "No relevant documents found.";
		}

		let context = "";
		for (let i = 0; i < retrievedChunks.length; i++) {
			const chunk = retrievedChunks[i];
			context += `[${i + 1}] From "${chunk.documentName}" (Similarity: ${(chunk.similarity * 100).toFixed(1)}%):\n`;
			context += `${chunk.chunk.content}\n\n`;
		}

		return context.trim();
	}

	/**
	 * Format citations for display
	 */
	private static formatCitations(retrievedChunks: RetrievedChunk[]): string {
		if (retrievedChunks.length === 0) {
			return "No citations available.";
		}

		let citations = "";
		for (let i = 0; i < retrievedChunks.length; i++) {
			const chunk = retrievedChunks[i];
			const metadata = chunk.chunk.metadata as any;

			citations += `[${i + 1}] "${chunk.documentName}"\n`;
			citations += `   • Relevance: ${(chunk.similarity * 100).toFixed(1)}%\n`;
			citations += `   • Chunk: ${chunk.chunk.chunkIndex + 1} of ${chunk.chunk.totalChunks}\n`;

			if (metadata?.pageNumber) {
				citations += `   • Page: ${metadata.pageNumber}\n`;
			}

			if (metadata?.section) {
				citations += `   • Section: ${metadata.section}\n`;
			}

			citations += `   • Excerpt: "${chunk.chunk.content.substring(0, 150)}${chunk.chunk.content.length > 150 ? '...' : ''}"\n\n`;
		}

		return citations.trim();
	}

	/**
	 * Format conversation history
	 */
	private static formatConversationHistory(
		conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; }>
	): string {
		if (!conversationHistory || conversationHistory.length === 0) {
			return "";
		}

		let history = "PREVIOUS CONVERSATION:\n";
		for (const message of conversationHistory.slice(-5)) { // Last 5 messages for context
			history += `${message.role.toUpperCase()}: ${message.content}\n`;
		}

		return history;
	}

	/**
	 * Default system instructions
	 */
	private static defaultSystemInstructions(): string {
		return `You are a knowledgeable AI assistant with access to the user's documents. Your primary role is to help users understand and work with their document collection.

CORE PRINCIPLES:
- Always prioritize accuracy and truthfulness
- Be transparent about what you know and don't know
- Use document citations to support your answers
- Maintain user privacy and document security
- Provide helpful, actionable information`;
	}
}

/**
 * Citation formatting utilities
 */
export class CitationFormatter {

	/**
	 * Format citations in different styles
	 */
	static formatCitationAPA(citation: CitationInfo): string {
		const date = new Date().toISOString().split('T')[0];
		return `${citation.documentName}. (${date}). Retrieved from document database. (Relevance: ${(citation.relevanceScore * 100).toFixed(1)}%)`;
	}

	static formatCitationMLA(citation: CitationInfo): string {
		const excerpt = citation.excerpt.length > 100 ?
			citation.excerpt.substring(0, 100) + '...' :
			citation.excerpt;

		return `"${excerpt}" ${citation.documentName}. Relevance: ${(citation.relevanceScore * 100).toFixed(1)}%`;
	}

	static formatCitationChicago(citation: CitationInfo): string {
		let citationStr = `"${citation.documentName}," document database`;

		if (citation.pageNumber) {
			citationStr += `, ${citation.pageNumber}`;
		}

		citationStr += `. (Relevance: ${(citation.relevanceScore * 100).toFixed(1)}%)`;

		return citationStr;
	}

	/**
	 * Generate citation HTML for web display
	 */
	static generateCitationHTML(citations: CitationInfo[]): string {
		let html = '<div class="citations"><h3>Sources</h3><ol>';

		for (const citation of citations) {
			html += `
				<li class="citation-item">
					<strong>${citation.documentName}</strong>
					<span class="relevance-score">(Relevance: ${(citation.relevanceScore * 100).toFixed(1)}%)</span>
					${citation.pageNumber ? `<span class="page-number">Page ${citation.pageNumber}</span>` : ''}
					${citation.section ? `<span class="section">Section: ${citation.section}</span>` : ''}
					<blockquote class="excerpt">${citation.excerpt}</blockquote>
				</li>
			`;
		}

		html += '</ol></div>';
		return html;
	}

	/**
	 * Generate citation markdown for chat display
	 */
	static generateCitationMarkdown(citations: CitationInfo[]): string {
		let markdown = '## Sources\n\n';

		for (let i = 0; i < citations.length; i++) {
			const citation = citations[i];
			markdown += `**[${i + 1}] ${citation.documentName}**\n`;
			markdown += `* Relevance: ${(citation.relevanceScore * 100).toFixed(1)}%\n`;

			if (citation.pageNumber) {
				markdown += `* Page: ${citation.pageNumber}\n`;
			}

			if (citation.section) {
				markdown += `* Section: ${citation.section}\n`;
			}

			markdown += `* Excerpt: "${citation.excerpt}"\n\n`;
		}

		return markdown;
	}
}

/**
 * Template selection helper
 */
export class PromptTemplateSelector {

	/**
	 * Select appropriate template based on query type
	 */
	static selectTemplate(
		userQuery: string,
		context: Omit<PromptContext, 'userQuery'>
	): string {
		const query = userQuery.toLowerCase();

		// Analytical queries
		if (query.includes('analyze') || query.includes('compare') || query.includes('evaluate') ||
			query.includes('assessment') || query.includes('review')) {
			return RAGPromptTemplates.analyticalRAGTemplate({ ...context, userQuery });
		}

		// Summary queries
		if (query.includes('summarize') || query.includes('summary') || query.includes('overview') ||
			query.includes('key points') || query.includes('main ideas')) {
			return RAGPromptTemplates.summaryRAGTemplate({ ...context, userQuery });
		}

		// Question answering
		if (query.startsWith('what') || query.startsWith('how') || query.startsWith('why') ||
			query.startsWith('when') || query.startsWith('where') || query.startsWith('who') ||
			query.includes('?')) {
			return RAGPromptTemplates.questionAnsweringTemplate({ ...context, userQuery });
		}

		// Conversational context
		if (context.conversationHistory && context.conversationHistory.length > 0) {
			return RAGPromptTemplates.conversationalRAGTemplate({ ...context, userQuery });
		}

		// Default to standard RAG
		return RAGPromptTemplates.standardRAGTemplate({ ...context, userQuery });
	}
}
