-- Migration: Add forking fields to chatMessages
-- Do not drop the table; only add columns needed for branching/versioning

ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "parentId" uuid;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "versionNumber" integer DEFAULT 1 NOT NULL;

-- previousId was added earlier in 0010_update_chat_schema.sql; keep as is


