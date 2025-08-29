-- Add conversation_id to documents and documentChunks tables for conversation-scoped RAG
-- This migration enables embeddings to be scoped per chat conversation

-- Add conversation_id column to documents table
ALTER TABLE "documents" ADD COLUMN "conversationId" uuid;

-- Add foreign key constraint to conversations table
ALTER TABLE "documents" ADD CONSTRAINT "documents_conversationId_conversations_id_fk" 
FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

-- Add conversation_id column to documentChunks table  
ALTER TABLE "documentChunks" ADD COLUMN "conversationId" uuid;

-- Add foreign key constraint to conversations table
ALTER TABLE "documentChunks" ADD CONSTRAINT "documentChunks_conversationId_conversations_id_fk"
FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE;

-- Create indexes for efficient conversation-scoped queries
CREATE INDEX IF NOT EXISTS "idx_documents_conversation_id" ON "documents" ("conversationId");
CREATE INDEX IF NOT EXISTS "idx_document_chunks_conversation_id" ON "documentChunks" ("conversationId");

-- Create composite index for conversation + user filtering on documentChunks
CREATE INDEX IF NOT EXISTS "idx_document_chunks_conversation_user" ON "documentChunks" ("conversationId", "userId");

-- Create composite index for conversation-scoped vector search
-- This will be used for efficient similarity search within a conversation
CREATE INDEX IF NOT EXISTS "idx_document_chunks_conversation_embedding" 
ON "documentChunks" USING hnsw (embedding vector_cosine_ops)
WHERE "conversationId" IS NOT NULL AND embedding IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "documents"."conversationId" IS 'Optional conversation ID to scope document to specific chat conversation';
COMMENT ON COLUMN "documentChunks"."conversationId" IS 'Optional conversation ID to scope embeddings to specific chat conversation';
COMMENT ON INDEX "idx_document_chunks_conversation_embedding" IS 'HNSW index for conversation-scoped vector similarity search';
