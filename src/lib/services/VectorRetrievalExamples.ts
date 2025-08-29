/**
 * Vector Retrieval Examples with pgvector SQL patterns
 * This file demonstrates different retrieval strategies and SQL queries
 */

export class VectorRetrievalExamples {
	/**
	 * Basic cosine similarity search with metadata filtering
	 */
	static basicSimilaritySearchSQL = `
		SELECT
			dc.id,
			dc.content,
			dc."documentId",
			d."originalName" as document_name,
			dc.metadata,
			-- Cosine similarity score
			1 - (dc.embedding <=> $1::vector) as similarity_score
		FROM "documentChunks" dc
		JOIN "documents" d ON dc."documentId" = d.id
		WHERE dc."userId" = $2
		AND dc.embedding IS NOT NULL
		AND d.status = 'completed'
		-- Filter by similarity threshold
		AND 1 - (dc.embedding <=> $1::vector) >= $3
		-- Order by similarity (ascending distance = descending similarity)
		ORDER BY dc.embedding <=> $1::vector
		LIMIT $4;
	`;

	/**
	 * Hybrid search: combine vector similarity with keyword matching
	 */
	static hybridSearchSQL = `
		SELECT
			dc.id,
			dc.content,
			dc."documentId",
			d."originalName" as document_name,
			dc.metadata,
			-- Cosine similarity score
			1 - (dc.embedding <=> $1::vector) as vector_similarity,
			-- Text similarity score (PostgreSQL full-text search)
			ts_rank_cd(to_tsvector('english', dc.content), plainto_tsquery('english', $5)) as text_similarity,
			-- Combined score (weighted average)
			(0.7 * (1 - (dc.embedding <=> $1::vector)) + 0.3 * ts_rank_cd(to_tsvector('english', dc.content), plainto_tsquery('english', $5))) as combined_score
		FROM "documentChunks" dc
		JOIN "documents" d ON dc."documentId" = d.id
		WHERE dc."userId" = $2
		AND dc.embedding IS NOT NULL
		AND d.status = 'completed'
		-- Vector similarity threshold
		AND 1 - (dc.embedding <=> $1::vector) >= $3
		-- Text similarity threshold
		AND ts_rank_cd(to_tsvector('english', dc.content), plainto_tsquery('english', $5)) >= $6
		ORDER BY combined_score DESC
		LIMIT $4;
	`;

	/**
	 * Multi-vector search: find chunks similar to multiple query vectors
	 */
	static multiVectorSearchSQL = `
		WITH query_vectors AS (
			-- Unnest multiple query embeddings
			SELECT unnest($1::vector[]) as query_embedding
		),
		similar_chunks AS (
			SELECT
				dc.id,
				dc.content,
				dc."documentId",
				d."originalName" as document_name,
				dc.metadata,
				qv.query_embedding,
				1 - (dc.embedding <=> qv.query_embedding) as similarity_score,
				ROW_NUMBER() OVER (
					PARTITION BY dc.id
					ORDER BY 1 - (dc.embedding <=> qv.query_embedding) DESC
				) as rank_within_chunk
			FROM "documentChunks" dc
			CROSS JOIN query_vectors qv
			JOIN "documents" d ON dc."documentId" = d.id
			WHERE dc."userId" = $2
			AND dc.embedding IS NOT NULL
			AND d.status = 'completed'
			AND 1 - (dc.embedding <=> qv.query_embedding) >= $3
		)
		SELECT
			id,
			content,
			"documentId",
			document_name,
			metadata,
			-- Best similarity score across all query vectors
			MAX(similarity_score) as max_similarity,
			-- Average similarity score
			AVG(similarity_score) as avg_similarity
		FROM similar_chunks
		WHERE rank_within_chunk = 1
		GROUP BY id, content, "documentId", document_name, metadata
		ORDER BY MAX(similarity_score) DESC
		LIMIT $4;
	`;

	/**
	 * Contextual retrieval: get chunks with surrounding context
	 */
	static contextualRetrievalSQL = `
		WITH similar_chunks AS (
			SELECT
				dc.id,
				dc."documentId",
				dc."chunkIndex",
				dc."totalChunks",
				1 - (dc.embedding <=> $1::vector) as similarity_score
			FROM "documentChunks" dc
			WHERE dc."userId" = $2
			AND dc.embedding IS NOT NULL
			AND 1 - (dc.embedding <=> $1::vector) >= $3
			ORDER BY dc.embedding <=> $1::vector
			LIMIT $4
		),
		context_chunks AS (
			SELECT DISTINCT
				dc.id,
				dc.content,
				dc."documentId",
				d."originalName" as document_name,
				dc."chunkIndex",
				dc."totalChunks",
				dc.metadata,
				sc.similarity_score
			FROM similar_chunks sc
			JOIN "documentChunks" dc ON sc."documentId" = dc."documentId"
			JOIN "documents" d ON dc."documentId" = d.id
			WHERE dc."userId" = $2
			-- Include surrounding chunks (±2 chunks for context)
			AND dc."chunkIndex" BETWEEN GREATEST(0, sc."chunkIndex" - 2)
								 AND LEAST(sc."totalChunks" - 1, sc."chunkIndex" + 2)
		)
		SELECT
			id,
			content,
			"documentId",
			document_name,
			"chunkIndex",
			"totalChunks",
			metadata,
			similarity_score,
			-- Mark if this is the main similar chunk or context
			CASE WHEN similarity_score IS NOT NULL THEN 'main' ELSE 'context' END as chunk_type
		FROM context_chunks
		ORDER BY "documentId", "chunkIndex";
	`;

	/**
	 * Filtered search: search within specific document types or date ranges
	 */
	static filteredSearchSQL = `
		SELECT
			dc.id,
			dc.content,
			dc."documentId",
			d."originalName" as document_name,
			d."fileType",
			d."createdAt" as document_created_at,
			dc.metadata,
			1 - (dc.embedding <=> $1::vector) as similarity_score
		FROM "documentChunks" dc
		JOIN "documents" d ON dc."documentId" = d.id
		WHERE dc."userId" = $2
		AND dc.embedding IS NOT NULL
		AND d.status = 'completed'
		-- Filter by document types
		AND d."fileType" = ANY($5)
		-- Filter by date range
		AND d."createdAt" >= $6
		AND d."createdAt" <= $7
		-- Filter by file size range
		AND d."fileSize" >= $8
		AND d."fileSize" <= $9
		-- Similarity threshold
		AND 1 - (dc.embedding <=> $1::vector) >= $3
		ORDER BY dc.embedding <=> $1::vector
		LIMIT $4;
	`;

	/**
	 * Analytics query: get retrieval statistics
	 */
	static retrievalAnalyticsSQL = `
		SELECT
			COUNT(*) as total_chunks_searched,
			COUNT(DISTINCT dc."documentId") as documents_searched,
			AVG(1 - (dc.embedding <=> $1::vector)) as avg_similarity,
			MIN(1 - (dc.embedding <=> $1::vector)) as min_similarity,
			MAX(1 - (dc.embedding <=> $1::vector)) as max_similarity,
			STDDEV(1 - (dc.embedding <=> $1::vector)) as similarity_stddev
		FROM "documentChunks" dc
		WHERE dc."userId" = $2
		AND dc.embedding IS NOT NULL;
	`;

	/**
	 * Index usage analysis: check if vector indexes are being used
	 */
	static indexAnalysisSQL = `
		-- Analyze index usage for vector operations
		EXPLAIN (ANALYZE, BUFFERS)
		SELECT
			dc.id,
			1 - (dc.embedding <=> $1::vector) as similarity_score
		FROM "documentChunks" dc
		WHERE dc."userId" = $2
		AND dc.embedding IS NOT NULL
		ORDER BY dc.embedding <=> $1::vector
		LIMIT $3;

		-- Check index statistics
		SELECT
			schemaname,
			tablename,
			indexname,
			idx_scan,
			idx_tup_read,
			idx_tup_fetch
		FROM pg_stat_user_indexes
		WHERE tablename = 'documentChunks'
		AND indexname LIKE '%embedding%';
	`;

	/**
	 * Performance monitoring: track query execution times
	 */
	static performanceMonitoringSQL = `
		-- Create a view for monitoring vector search performance
		CREATE OR REPLACE VIEW vector_search_performance AS
		WITH search_stats AS (
			SELECT
				'vector_search' as operation_type,
				COUNT(*) as operations_count,
				AVG(EXTRACT(epoch FROM (now() - dc."createdAt"))) as avg_age_days,
				pg_size_pretty(pg_total_relation_size('documentChunks')) as table_size
			FROM "documentChunks" dc
			WHERE dc.embedding IS NOT NULL
		)
		SELECT
			operation_type,
			operations_count,
			avg_age_days,
			table_size,
			-- Estimated performance metrics
			CASE
				WHEN operations_count > 10000 THEN 'High load - consider index optimization'
				WHEN operations_count > 1000 THEN 'Medium load - monitor performance'
				ELSE 'Low load - optimal performance expected'
			END as performance_recommendation
		FROM search_stats;
	`;
}

/**
 * Usage examples in TypeScript/Node.js
 */
export class RetrievalExamples {
	/**
	 * Basic similarity search example
	 */
	static async basicSimilaritySearch(
		queryEmbedding: number[],
		userId: string,
		limit: number = 10,
		similarityThreshold: number = 0.7
	) {
		const response = await fetch('http://localhost:8000/search', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query_embedding: queryEmbedding,
				user_id: userId,
				limit,
				threshold: similarityThreshold
			})
		});

		if (!response.ok) {
			throw new Error(`Vector search failed: ${response.statusText}`);
		}

		const result = await response.json();
		return result.results;
	}

	/**
	 * Hybrid search combining vector and keyword search
	 */
	static async hybridSearch(
		queryEmbedding: number[],
		queryText: string,
		userId: string,
		limit: number = 10,
		vectorWeight: number = 0.7,
		textWeight: number = 0.3
	) {
		// This would require a custom endpoint in the embeddings API
		const response = await fetch('http://localhost:8000/search/hybrid', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query_embedding: queryEmbedding,
				query_text: queryText,
				user_id: userId,
				limit,
				vector_weight: vectorWeight,
				text_weight: textWeight
			})
		});

		if (!response.ok) {
			throw new Error(`Hybrid search failed: ${response.statusText}`);
		}

		const result = await response.json();
		return result.results;
	}

	/**
	 * Contextual retrieval with surrounding chunks
	 */
	static async contextualRetrieval(
		queryEmbedding: number[],
		userId: string,
		contextWindow: number = 2
	) {
		const response = await fetch('http://localhost:8000/search/contextual', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query_embedding: queryEmbedding,
				user_id: userId,
				context_window: contextWindow
			})
		});

		if (!response.ok) {
			throw new Error(`Contextual retrieval failed: ${response.statusText}`);
		}

		const result = await response.json();
		return result.results;
	}
}
