# pgvector Documentation and Best Practices

## Overview

This document provides comprehensive guidance on using pgvector for vector similarity search in PostgreSQL, specifically for RAG (Retrieval Augmented Generation) applications.

## Table of Contents

1. [pgvector Operators](#pgvector-operators)
2. [Index Types and Recommendations](#index-types-and-recommendations)
3. [Performance Optimization](#performance-optimization)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [Official Documentation Links](#official-documentation-links)

## pgvector Operators

pgvector provides several operators for different types of vector similarity calculations:

### Distance Operators

| Operator | Description | Use Case | Formula |
|----------|-------------|----------|---------|
| `<->` | Euclidean (L2) distance | General similarity, good balance | `sqrt(Σ(v1_i - v2_i)²)` |
| `<=>` | Cosine distance | Text embeddings, normalized vectors | `1 - (v1·v2)/(‖v1‖‖v2‖)` |
| `<#>` | Inner product | Some ML models | `Σ(v1_i × v2_i)` |
| `<+>` | L1 (Manhattan) distance | Robust to outliers | `Σ|v1_i - v2_i|` |

### Key Notes:

- **Cosine distance (`<=>`)**: Most common for text embeddings. Returns values between 0 and 2, where 0 = identical, 2 = completely opposite
- **Euclidean distance (`<->`)**: Good general-purpose metric. Always positive, 0 = identical vectors
- **Inner product (`<#>`)**: Can be negative. Often used with normalized vectors
- **Cosine similarity** = `1 - cosine_distance` (values from -1 to 1)

### Practical Usage Examples

```sql
-- Find most similar chunks using cosine similarity
SELECT
    id,
    content,
    1 - (embedding <=> '[0.1, 0.2, 0.3]') as cosine_similarity
FROM documentChunks
ORDER BY embedding <=> '[0.1, 0.2, 0.3]'
LIMIT 10;

-- Find chunks within Euclidean distance threshold
SELECT
    id,
    content,
    (embedding <-> '[0.1, 0.2, 0.3]') as euclidean_distance
FROM documentChunks
WHERE (embedding <-> '[0.1, 0.2, 0.3]') < 0.5
ORDER BY embedding <-> '[0.1, 0.2, 0.3]';
```

## Index Types and Recommendations

### HNSW (Hierarchical Navigable Small World)

**Best for**: High-dimensional vectors, approximate nearest neighbor search

```sql
-- Create HNSW index (recommended for most use cases)
CREATE INDEX ON documentChunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Query with ef_search parameter for better recall
SET hnsw.ef_search = 100;
SELECT * FROM documentChunks ORDER BY embedding <=> query_embedding LIMIT 10;
```

**Parameters**:
- `m`: Number of connections per node (default: 16, range: 2-100)
- `ef_construction`: Size of dynamic candidate list (default: 64, higher = better recall, slower build)

**When to use**:
- Dimensionality > 100
- Need approximate results with high recall
- Real-time search requirements

### IVFFlat (Inverted File Flat)

**Best for**: Smaller datasets, exact search needs

```sql
-- Create IVFFlat index
CREATE INDEX ON documentChunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Query (automatically chooses optimal lists to search)
SELECT * FROM documentChunks ORDER BY embedding <=> query_embedding LIMIT 10;
```

**Parameters**:
- `lists`: Number of inverted lists (rule of thumb: `sqrt(rows)`)

**When to use**:
- Dataset size < 1M vectors
- Need exact nearest neighbors
- Can tolerate slower queries for perfect accuracy

### Index Selection Guide

| Dataset Size | Dimensionality | Recommended Index | Notes |
|--------------|----------------|-------------------|-------|
| < 10K | Any | No index | Sequential scan faster |
| 10K - 1M | < 100 | IVFFlat | Exact search, moderate performance |
| 10K - 1M | 100-1000 | HNSW | Approximate search, good performance |
| > 1M | Any | HNSW | Best for large-scale search |

### Composite Indexes

```sql
-- Index for filtered search (user + vector)
CREATE INDEX ON documentChunks USING hnsw (embedding vector_cosine_ops)
WHERE userId IS NOT NULL;

-- Partial index for non-null embeddings only
CREATE INDEX ON documentChunks USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
```

## Performance Optimization

### Query Optimization

1. **Use appropriate similarity thresholds**:
```sql
-- Add threshold filter for better performance
SELECT * FROM documentChunks
WHERE 1 - (embedding <=> query_embedding) >= 0.7
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

2. **Pre-filter by metadata**:
```sql
-- Filter by user and document type before vector search
SELECT * FROM documentChunks dc
JOIN documents d ON dc.documentId = d.id
WHERE dc.userId = $1
  AND d.fileType = 'pdf'
  AND 1 - (dc.embedding <=> $2) >= 0.6
ORDER BY dc.embedding <=> $2
LIMIT 10;
```

3. **Batch processing**:
```sql
-- Use UNNEST for multiple queries
SELECT *
FROM documentChunks dc
CROSS JOIN UNNEST($1::vector[]) WITH ORDINALITY as q(query_embedding, query_id)
ORDER BY dc.embedding <=> q.query_embedding
LIMIT 10;
```

### Index Maintenance

1. **Monitor index performance**:
```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'documentChunks';
```

2. **Rebuild indexes periodically**:
```sql
-- Rebuild HNSW index (can be done online)
REINDEX INDEX CONCURRENTLY documentChunks_embedding_idx;
```

3. **Vacuum and analyze**:
```sql
-- Maintain table statistics
VACUUM ANALYZE documentChunks;
```

### Memory and Configuration

```sql
-- Increase work memory for complex queries
SET work_mem = '64MB';

-- Increase maintenance work memory for index building
SET maintenance_work_mem = '256MB';

-- For HNSW, increase shared buffers
-- postgresql.conf: shared_buffers = 256MB
```

## Best Practices

### Schema Design

1. **Use appropriate vector dimensions**:
```sql
-- For Gemini embeddings (768 dimensions)
ALTER TABLE documentChunks
ADD CONSTRAINT embedding_dimensions_check
CHECK (vector_dims(embedding) = 768);
```

2. **Store metadata separately**:
```sql
-- Use JSONB for flexible metadata
ALTER TABLE documentChunks ADD COLUMN metadata jsonb;

-- Index specific metadata fields
CREATE INDEX ON documentChunks ((metadata->>'pageNumber'));
CREATE INDEX ON documentChunks ((metadata->>'section'));
```

3. **Partition large tables**:
```sql
-- Partition by user for better performance
CREATE TABLE documentChunks_y2024m01 PARTITION OF documentChunks
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Data Management

1. **Normalize embeddings when using cosine similarity**:
```sql
-- Ensure embeddings are normalized
UPDATE documentChunks
SET embedding = embedding / vector_norm(embedding)
WHERE vector_norm(embedding) > 0;
```

2. **Handle null embeddings**:
```sql
-- Create partial indexes
CREATE INDEX ON documentChunks USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;
```

3. **Implement data validation**:
```sql
-- Validate embedding dimensions on insert
CREATE OR REPLACE FUNCTION validate_embedding()
RETURNS trigger AS $$
BEGIN
    IF vector_dims(NEW.embedding) != 768 THEN
        RAISE EXCEPTION 'Embedding must be 768 dimensions, got %', vector_dims(NEW.embedding);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_embedding_trigger
BEFORE INSERT ON documentChunks
FOR EACH ROW EXECUTE FUNCTION validate_embedding();
```

### Application Integration

1. **Connection pooling**:
```typescript
// Use connection pooling for better performance
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

2. **Prepared statements**:
```typescript
// Use prepared statements for repeated queries
const query = {
  text: 'SELECT * FROM documentChunks WHERE userId = $1 ORDER BY embedding <=> $2 LIMIT $3',
  values: [userId, queryEmbedding, limit],
};
```

3. **Caching strategies**:
```typescript
// Cache frequently accessed embeddings
const embeddingCache = new Map<string, number[]>();

// Cache user document counts
const userStatsCache = new Map<string, { count: number, lastUpdated: Date }>();
```

## Troubleshooting

### Common Issues

1. **Slow queries**:
   - Check if indexes are being used: `EXPLAIN ANALYZE`
   - Increase `hnsw.ef_search` for better recall
   - Consider rebuilding indexes

2. **Memory issues**:
   - Reduce `m` and `ef_construction` for HNSW
   - Increase PostgreSQL memory settings
   - Use smaller batch sizes for bulk operations

3. **Index build failures**:
   - Ensure sufficient maintenance memory
   - Check for null values in vector column
   - Validate vector dimensions consistency

4. **Inconsistent results**:
   - Verify embedding normalization
   - Check for data corruption
   - Validate similarity calculations

### Monitoring Queries

```sql
-- Monitor vector search performance
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE query LIKE '%embedding%'
ORDER BY total_time DESC;

-- Check for unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND tablename = 'documentChunks';
```

### Debugging Commands

```sql
-- Validate vector data
SELECT
    id,
    vector_dims(embedding) as dimensions,
    vector_norm(embedding) as norm
FROM documentChunks
WHERE embedding IS NOT NULL
LIMIT 10;

-- Check index validity
SELECT
    indexname,
    indisvalid,
    indisready
FROM pg_index i
JOIN pg_class c ON i.indexrelid = c.oid
WHERE c.relname LIKE '%documentChunks%';
```

## Official Documentation Links

- [pgvector GitHub Repository](https://github.com/pgvector/pgvector)
- [pgvector Documentation](https://github.com/pgvector/pgvector/blob/master/README.md)
- [PostgreSQL Vector Extension](https://www.postgresql.org/docs/current/vector.html)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)
- [IVFADC Algorithm Paper](https://lear.inrialpes.fr/pubs/2011/JDS11/jegou_searching_with_quantization.pdf)

## Migration Guide

### From JSONB to Vector Type

```sql
-- Backup existing data
CREATE TABLE documentChunks_backup AS
SELECT * FROM documentChunks;

-- Add new vector column
ALTER TABLE documentChunks ADD COLUMN embedding_vector vector(768);

-- Migrate data (assuming JSONB contains arrays)
UPDATE documentChunks
SET embedding_vector = embedding::text::vector
WHERE embedding IS NOT NULL;

-- Drop old column and rename new one
ALTER TABLE documentChunks DROP COLUMN embedding;
ALTER TABLE documentChunks RENAME COLUMN embedding_vector TO embedding;

-- Create indexes
CREATE INDEX ON documentChunks USING hnsw (embedding vector_cosine_ops);
```

### Performance Benchmarking

```sql
-- Benchmark different index types
EXPLAIN (ANALYZE, TIMING)
SELECT id FROM documentChunks
ORDER BY embedding <=> '[random_vector]'
LIMIT 10;

-- Compare with different operators
EXPLAIN (ANALYZE, TIMING)
SELECT id FROM documentChunks
ORDER BY embedding <-> '[random_vector]'
LIMIT 10;
```

---

## Quick Reference

### Most Common Patterns

```sql
-- Basic similarity search
SELECT *, 1 - (embedding <=> $1) as similarity
FROM documentChunks
WHERE userId = $2
ORDER BY embedding <=> $1
LIMIT 10;

-- Filtered search
SELECT dc.*, d.fileName
FROM documentChunks dc
JOIN documents d ON dc.documentId = d.id
WHERE dc.userId = $1
  AND d.fileType = $2
  AND 1 - (dc.embedding <=> $3) >= 0.7
ORDER BY dc.embedding <=> $3;

-- Aggregation queries
SELECT
    COUNT(*) as total_chunks,
    AVG(1 - (embedding <=> $1)) as avg_similarity,
    MAX(1 - (embedding <=> $1)) as max_similarity
FROM documentChunks
WHERE userId = $2;
```

### Configuration Recommendations

```sql
-- postgresql.conf recommendations for pgvector
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 256MB
work_mem = 64MB
```

This comprehensive guide should help you effectively implement and optimize pgvector for your RAG application. Remember to monitor performance and adjust parameters based on your specific use case and data characteristics.
