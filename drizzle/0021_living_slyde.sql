CREATE EXTENSION IF NOT EXISTS vector
-- Convert embedding column to vector type
ALTER TABLE "documentChunks" ALTER COLUMN "embedding" SET DATA TYPE vector(768);