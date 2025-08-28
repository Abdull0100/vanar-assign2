-- Migration: Add message branching and versioning fields
-- This enables true message forking while preserving original messages

-- Add new fields to chatMessages table
ALTER TABLE "chatMessages" ADD COLUMN "parent_message_id" uuid REFERENCES "chatMessages"("id") ON DELETE SET NULL;
ALTER TABLE "chatMessages" ADD COLUMN "branch_id" uuid;
ALTER TABLE "chatMessages" ADD COLUMN "version_number" integer DEFAULT 1 NOT NULL;
ALTER TABLE "chatMessages" ADD COLUMN "is_forked" boolean DEFAULT false NOT NULL;
ALTER TABLE "chatMessages" ADD COLUMN "original_message_id" uuid REFERENCES "chatMessages"("id") ON DELETE SET NULL;

-- Backfill existing rows: set branch_id to id and version_number to 1
UPDATE "chatMessages" 
SET "branch_id" = "id", "version_number" = 1, "is_forked" = false 
WHERE "branch_id" IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "chatMessages_branch_id_idx" ON "chatMessages"("branch_id");
CREATE INDEX IF NOT EXISTS "chatMessages_parent_message_id_idx" ON "chatMessages"("parent_message_id");
CREATE INDEX IF NOT EXISTS "chatMessages_original_message_id_idx" ON "chatMessages"("original_message_id");
CREATE INDEX IF NOT EXISTS "chatMessages_version_number_idx" ON "chatMessages"("version_number");
