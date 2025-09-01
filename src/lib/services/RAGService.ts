import { db } from '$lib/db';
import { documents, documentChunks, citations, chatMessages } from '$lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import type { DocumentChunk, Citation, NewCitation } from '$lib/db/schema';

export interface RetrievedChunk {
	chunk: DocumentChunk;
	documentName: string;
	similarity: number;
}

export interface ChunkMetadata {
	pageNumber?: number;
	section?: string;
	[key: string]: any;
}

export interface RAGContext {
	retrievedChunks: RetrievedChunk[];
	query: string;
	totalChunks: number;
}

export class RAGService {
	/**
	 * Perform semantic search to retrieve relevant document chunks
	 */
	async retrieveRelevantChunks(
		query: string,
		userId: string,
		limit: number = 5,
		similarityThreshold: number = 0.7,
		conversationId?: string
	): Promise<RetrievedChunk[]> {
		try {
			// Generate embedding for the query
			const queryEmbedding = await this.generateEmbedding(query);

			// If conversationId is provided, search only within that conversation
			if (conversationId) {
				// Find documents for this specific conversation
				const conversationDocuments = await db.query.documents.findMany({
					where: and(
						eq(documents.userId, userId),
						eq(documents.conversationId, conversationId),
						eq(documents.status, 'completed')
					),
					columns: { id: true, originalName: true }
				});

				if (conversationDocuments.length === 0) {
					return []; // No documents in this conversation
				}

				const documentIds = conversationDocuments.map((doc) => doc.id);

				// Perform vector similarity search within conversation
				const similarChunks = await this.findSimilarChunks(
					queryEmbedding,
					documentIds,
					limit * 2, // Get more candidates for better selection
					conversationId
				);

				// Filter by similarity threshold and limit
				const relevantChunks = similarChunks
					.filter((result) => result.similarity >= similarityThreshold)
					.slice(0, limit);

				// Enrich with document names
				const enrichedChunks: RetrievedChunk[] = [];
				for (const result of relevantChunks) {
					const document = conversationDocuments.find((doc) => doc.id === result.chunk.documentId);
					if (document) {
						enrichedChunks.push({
							chunk: result.chunk,
							documentName: document.originalName,
							similarity: result.similarity
						});
					}
				}

				return enrichedChunks;
			}

			// Legacy behavior: search all user's documents
			const userDocuments = await db.query.documents.findMany({
				where: and(eq(documents.userId, userId), eq(documents.status, 'completed')),
				columns: { id: true, originalName: true }
			});

			if (userDocuments.length === 0) {
				return [];
			}

			const documentIds = userDocuments.map((doc) => doc.id);

			// Perform vector similarity search
			const similarChunks = await this.findSimilarChunks(
				queryEmbedding,
				documentIds,
				limit * 2 // Get more candidates for better selection
			);

			// Filter by similarity threshold and limit
			const relevantChunks = similarChunks
				.filter((result) => result.similarity >= similarityThreshold)
				.slice(0, limit);

			// Enrich with document names
			const enrichedChunks: RetrievedChunk[] = [];
			for (const result of relevantChunks) {
				const document = userDocuments.find((doc) => doc.id === result.chunk.documentId);
				if (document) {
					enrichedChunks.push({
						chunk: result.chunk,
						documentName: document.originalName,
						similarity: result.similarity
					});
				}
			}

			return enrichedChunks;
		} catch (error: any) {
			console.error('RAG retrieval error:', error);
			return [];
		}
	}

	/**
	 * Generate embedding for text using FastAPI embeddings service
	 */
	private async generateEmbedding(text: string): Promise<number[]> {
		try {
			const response = await fetch('http://localhost:8000/embed', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: text,
					user_id: 'system' // System user for general embeddings
				})
			});

			if (!response.ok) {
				throw new Error(`Embeddings API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			return result.embedding;
		} catch (error: any) {
			console.error('Error generating embedding:', error);
			// Fallback to mock embedding if API is unavailable
			console.warn('Falling back to mock embedding generation');
			return this.generateMockEmbedding(text);
		}
	}

	/**
	 * Generate batch embeddings for multiple texts
	 */
	private async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
		try {
			const response = await fetch('http://localhost:8000/embed/batch', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					texts: texts,
					user_id: 'system'
				})
			});

			if (!response.ok) {
				throw new Error(`Batch embeddings API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			return result.embeddings;
		} catch (error: any) {
			console.error('Error generating batch embeddings:', error);
			// Fallback to individual embeddings
			console.warn('Falling back to individual embedding generation');
			const embeddings: number[][] = [];
			for (const text of texts) {
				embeddings.push(await this.generateEmbedding(text));
			}
			return embeddings;
		}
	}

	/**
	 * Fallback mock embedding generation (768 dimensions for Gemini compatibility)
	 */
	private generateMockEmbedding(text: string): number[] {
		const words = text.toLowerCase().split(/\s+/);
		const embedding = new Array(768).fill(0); // Changed from 1536 to 768 for Gemini compatibility

		// Create a simple hash-based embedding
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			let hash = 0;
			for (let j = 0; j < word.length; j++) {
				hash = (hash << 5) - hash + word.charCodeAt(j);
				hash = hash & hash; // Convert to 32-bit integer
			}

			// Distribute hash across embedding dimensions
			for (let dim = 0; dim < 10; dim++) {
				const index = Math.abs((hash + dim * 12345) % 768); // Changed from 1536 to 768
				embedding[index] += (hash % 100) / 100 - 0.5; // Normalize to [-0.5, 0.5]
			}
		}

		// Normalize the embedding
		const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
		return embedding.map((val) => val / magnitude);
	}

	/**
	 * Find similar chunks using pgvector similarity search with optimized SQL
	 */
	private async findSimilarChunks(
		queryEmbedding: number[],
		documentIds: string[],
		limit: number,
		conversationId?: string
	): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
		try {
			// Use FastAPI embeddings service for vector search
			const response = await fetch('http://localhost:8000/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query_embedding: queryEmbedding,
					user_id:
						documentIds.length > 0 ? await this.getUserIdFromDocument(documentIds[0]) : 'system',
					conversation_id: conversationId || undefined,
					limit: limit,
					threshold: 0.6
				})
			});

			if (!response.ok) {
				throw new Error(`Vector search API error: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();

			// Convert API response to expected format
			const similarities = result.results.map((item: any) => ({
				chunk: {
					id: item.chunk_id,
					documentId: item.document_id,
					userId: item.user_id || 'system',
					content: item.content,
					chunkIndex: 0,
					totalChunks: 1,
					embedding: queryEmbedding, // We'll use the query embedding as placeholder
					metadata: item.metadata || {},
					createdAt: new Date()
				} as DocumentChunk,
				similarity: item.similarity
			}));

			return similarities;
		} catch (error) {
			console.error('Vector search error:', error);
			// Fallback to direct SQL vector search
			console.warn('Falling back to direct SQL vector search');
			return this.directVectorSearch(queryEmbedding, documentIds, limit);
		}
	}

	/**
	 * Direct SQL vector search using pgvector operators (fallback method)
	 */
	private async directVectorSearch(
		queryEmbedding: number[],
		documentIds: string[],
		limit: number
	): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
		try {
			// Convert embedding to PostgreSQL vector format
			const embeddingStr = `[${queryEmbedding.join(',')}]`;

			// Build SQL query with different vector operators for comparison
			const query = `
				SELECT
					dc.id,
					dc.content,
					dc."chunkIndex",
					dc."totalChunks",
					dc."documentId",
					dc."userId",
					dc.metadata,
					dc."createdAt",
					-- Cosine similarity: 1 - (cosine distance)
					1 - (dc.embedding <=> $1::vector) as cosine_similarity,
					-- Euclidean distance (L2)
					(dc.embedding <-> $1::vector) as euclidean_distance,
					-- Inner product (negative for similarity)
					-(dc.embedding <#> $1::vector) as inner_product_similarity
				FROM "documentChunks" dc
				WHERE dc."userId" = $2
				AND dc.embedding IS NOT NULL
				AND dc."documentId" = ANY($3)
				-- Filter by cosine similarity threshold
				AND 1 - (dc.embedding <=> $1::vector) >= 0.3
				ORDER BY dc.embedding <=> $1::vector
				LIMIT $4
			`;

			const userId = await this.getUserIdFromDocument(documentIds[0]);

			const result = await db.execute(sql`
				SELECT
					dc.id,
					dc.content,
					dc."chunkIndex",
					dc."totalChunks",
					dc."documentId",
					dc."userId",
					dc.metadata,
					dc."createdAt",
					1 - (dc.embedding <=> ${embeddingStr}::vector) as cosine_similarity,
					(dc.embedding <-> ${embeddingStr}::vector) as euclidean_distance,
					-(dc.embedding <#> ${embeddingStr}::vector) as inner_product_similarity
				FROM ${documentChunks} dc
				WHERE dc."userId" = ${userId}::uuid
				AND dc.embedding IS NOT NULL
				AND dc."documentId" = ANY(ARRAY[${documentIds.map((id) => `'${id}'::uuid`).join(',')}]::uuid[])
				AND 1 - (dc.embedding <=> ${embeddingStr}::vector) >= 0.3
				ORDER BY dc.embedding <=> ${embeddingStr}::vector
				LIMIT ${limit}
			`);

			return result.map((row) => ({
				chunk: {
					id: row.id as string,
					documentId: row.documentId as string,
					userId: row.userId as string,
					content: row.content as string,
					chunkIndex: row.chunkIndex as number,
					totalChunks: row.totalChunks as number,
					embedding: [], // We'll load this if needed
					metadata: row.metadata as any,
					createdAt: row.createdAt as Date
				} as DocumentChunk,
				similarity: parseFloat(row.cosine_similarity as string)
			}));
		} catch (error) {
			console.error('Direct vector search error:', error);
			// Final fallback to mock similarity search
			console.warn('Falling back to mock vector search');
			return this.fallbackSimilaritySearch(queryEmbedding, documentIds, limit);
		}
	}

	/**
	 * Get user ID from document ID
	 */
	private async getUserIdFromDocument(documentId: string): Promise<string> {
		try {
			const doc = await db.query.documents.findFirst({
				where: eq(documents.id, documentId),
				columns: { userId: true }
			});
			return doc?.userId || 'system';
		} catch (error) {
			console.error('Error getting user ID from document:', error);
			return 'system';
		}
	}

	/**
	 * Fallback similarity search using mock embeddings
	 */
	private async fallbackSimilaritySearch(
		queryEmbedding: number[],
		documentIds: string[],
		limit: number
	): Promise<Array<{ chunk: DocumentChunk; similarity: number }>> {
		try {
			// Get chunks for the specified documents
			const chunks = await db.query.documentChunks.findMany({
				where: sql`${documentChunks.documentId} IN ${documentIds}`,
				with: {
					document: true
				}
			});

			// Calculate cosine similarity for each chunk
			const similarities = chunks.map((chunk) => {
				const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding || []);
				return {
					chunk,
					similarity
				};
			});

			// Sort by similarity (descending) and return top results
			return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
		} catch (error) {
			console.error('Fallback similarity search error:', error);
			return [];
		}
	}

	/**
	 * Calculate cosine similarity between two vectors
	 */
	private cosineSimilarity(vecA: number[], vecB: number[]): number {
		if (vecA.length !== vecB.length) {
			return 0;
		}

		let dotProduct = 0;
		let magnitudeA = 0;
		let magnitudeB = 0;

		for (let i = 0; i < vecA.length; i++) {
			dotProduct += vecA[i] * vecB[i];
			magnitudeA += vecA[i] * vecA[i];
			magnitudeB += vecB[i] * vecB[i];
		}

		magnitudeA = Math.sqrt(magnitudeA);
		magnitudeB = Math.sqrt(magnitudeB);

		if (magnitudeA === 0 || magnitudeB === 0) {
			return 0;
		}

		return dotProduct / (magnitudeA * magnitudeB);
	}

	/**
	 * Create citations for a chat message based on retrieved chunks
	 */
	async createCitations(
		chatMessageId: string,
		retrievedChunks: RetrievedChunk[]
	): Promise<Citation[]> {
		try {
			console.log(
				`Creating citations for message ${chatMessageId} with ${retrievedChunks.length} chunks`
			);
			const citationRecords: NewCitation[] = [];

			for (const retrieved of retrievedChunks) {
				const metadata = retrieved.chunk.metadata as ChunkMetadata | null;

				citationRecords.push({
					chatMessageId,
					documentId: retrieved.chunk.documentId,
					chunkIds: [retrieved.chunk.id],
					relevanceScore: Math.round(retrieved.similarity * 100),
					citationText:
						retrieved.chunk.content.substring(0, 200) +
						(retrieved.chunk.content.length > 200 ? '...' : ''),
					pageNumber: metadata?.pageNumber || null,
					section: metadata?.section || null
				});
			}

			console.log(`Prepared ${citationRecords.length} citation records`);

			if (citationRecords.length > 0) {
				const insertedCitations = await db.insert(citations).values(citationRecords).returning();
				console.log(`Successfully inserted ${insertedCitations.length} citations`);
				return insertedCitations;
			}

			return [];
		} catch (error: any) {
			console.error('Citation creation error:', error);
			return [];
		}
	}

	/**
	 * Get citations for a chat message
	 */
	async getCitationsForMessage(chatMessageId: string): Promise<Citation[]> {
		try {
			return await db.query.citations.findMany({
				where: eq(citations.chatMessageId, chatMessageId),
				with: {
					document: true
				}
			});
		} catch (error: any) {
			console.error('Citation retrieval error:', error);
			return [];
		}
	}

	/**
	 * Build context string from retrieved chunks for AI prompt
	 */
	buildContextString(retrievedChunks: RetrievedChunk[]): string {
		if (retrievedChunks.length === 0) {
			return '';
		}

		let context = 'Relevant information from your documents:\n\n';

		for (let i = 0; i < retrievedChunks.length; i++) {
			const retrieved = retrievedChunks[i];
			context += `[${i + 1}] From "${retrieved.documentName}":\n`;
			context += `${retrieved.chunk.content}\n\n`;
		}

		return context;
	}

	/**
	 * Check if user has any processed documents (optionally scoped to conversation)
	 */
	async hasProcessedDocuments(userId: string, conversationId?: string): Promise<boolean> {
		try {
			const whereConditions = [eq(documents.userId, userId), eq(documents.status, 'completed')];

			// If conversationId is provided, scope to that conversation
			if (conversationId) {
				whereConditions.push(eq(documents.conversationId, conversationId));
			}

			const result = await db
				.select({ count: sql<number>`count(*)` })
				.from(documents)
				.where(and(...whereConditions));

			return result[0].count > 0;
		} catch (error) {
			console.error('Document check error:', error);
			return false;
		}
	}
}
