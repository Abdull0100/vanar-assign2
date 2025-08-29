-- Setup proper pgvector schema with indexes
-- This migration converts JSONB embeddings to proper vector type and adds indexes

-- Enable the vector extension (should already be enabled with pgvector image)
CREATE EXTENSION IF NOT EXISTS vector;

-- Convert documentChunks.embedding from jsonb to vector(768)
-- First, add a temporary column
ALTER TABLE "documentChunks" ADD COLUMN "embedding_vector" vector(768);

-- Migrate existing JSONB data to vector format
UPDATE "documentChunks"
SET "embedding_vector" = CASE
    WHEN "embedding" IS NOT NULL AND jsonb_typeof("embedding") = 'array'
    THEN ("embedding"::text)::vector
    ELSE NULL
END;

-- Drop the old jsonb column and rename the new one
ALTER TABLE "documentChunks" DROP COLUMN "embedding";
ALTER TABLE "documentChunks" RENAME COLUMN "embedding_vector" TO "embedding";

-- Create HNSW index for efficient vector similarity search
-- HNSW is recommended for high-dimensional vectors with good recall-performance balance
CREATE INDEX IF NOT EXISTS "idx_document_chunks_embedding" ON "documentChunks" USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Alternative: IVFFlat index (good for smaller datasets or exact search needs)
-- CREATE INDEX ON "documentChunks" USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

-- Create index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS "idx_document_chunks_user_id" ON "documentChunks" ("userId");

-- Create index on document_id for faster joins
CREATE INDEX IF NOT EXISTS "idx_document_chunks_document_id" ON "documentChunks" ("documentId");

-- Create composite index for user + document filtering
CREATE INDEX IF NOT EXISTS "idx_document_chunks_user_document" ON "documentChunks" ("userId", "documentId");

-- Add check constraint to ensure embedding dimensions are consistent
ALTER TABLE "documentChunks" ADD CONSTRAINT "embedding_dimensions_check"
CHECK (vector_dims(embedding) = 768);

-- Create partial index for non-null embeddings (optimization)
CREATE INDEX IF NOT EXISTS "idx_document_chunks_embedding_not_null"
ON "documentChunks" USING hnsw (embedding vector_cosine_ops)
WHERE embedding IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "documentChunks"."embedding" IS '768-dimensional vector embedding using Gemini embeddings';
COMMENT ON INDEX "documentChunks_embedding_idx" IS 'HNSW index for cosine similarity search on embeddings';
