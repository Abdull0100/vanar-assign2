-- Migration: Update chatMessages table to new schema
-- This migration updates the chatMessages table to use the new role-based message structure

-- First, create a backup of the current table
CREATE TABLE IF NOT EXISTS "chatMessages_backup" AS SELECT * FROM "chatMessages";

-- Drop existing foreign key constraints
ALTER TABLE "chatMessages" DROP CONSTRAINT IF EXISTS "chatMessages_conversationId_conversations_id_fk";
ALTER TABLE "chatMessages" DROP CONSTRAINT IF EXISTS "chatMessages_userId_users_id_fk";

-- Add new columns
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "roomId" uuid;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "parentId" uuid;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "versionNumber" integer DEFAULT 1;

-- Migrate data from old schema to new schema
-- Set roomId to conversationId
UPDATE "chatMessages" SET "roomId" = "conversationId";

-- Set role based on existing data
-- If aiResponse is null, it's a user message
-- If aiResponse has content, it's an assistant message
UPDATE "chatMessages" SET "role" = CASE 
    WHEN "aiResponse" IS NULL THEN 'user'
    ELSE 'assistant'
END;

-- Set parentId to previousId for now (we'll need to restructure this properly)
UPDATE "chatMessages" SET "parentId" = "previousId";

-- Make new columns NOT NULL
ALTER TABLE "chatMessages" ALTER COLUMN "roomId" SET NOT NULL;
ALTER TABLE "chatMessages" ALTER COLUMN "role" SET NOT NULL;

-- Drop old columns
ALTER TABLE "chatMessages" DROP COLUMN IF EXISTS "conversationId";
ALTER TABLE "chatMessages" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "chatMessages" DROP COLUMN IF EXISTS "aiResponse";

-- Add new foreign key constraint for roomId
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_roomId_conversations_id_fk" 
    FOREIGN KEY ("roomId") REFERENCES "conversations"("id") ON DELETE CASCADE;

-- Add indexes for new structure
CREATE INDEX IF NOT EXISTS "idx_chatMessages_roomId" ON "chatMessages"("roomId");
CREATE INDEX IF NOT EXISTS "idx_chatMessages_role" ON "chatMessages"("role");
CREATE INDEX IF NOT EXISTS "idx_chatMessages_parentId" ON "chatMessages"("parentId");

-- Add check constraint for role values
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_role_check" 
    CHECK ("role" IN ('user', 'assistant', 'system'));

-- Update the table comment
COMMENT ON TABLE "chatMessages" IS 'Chat messages table - each row represents a message with role-based content';
COMMENT ON COLUMN "chatMessages"."role" IS 'user, assistant, or system';
COMMENT ON COLUMN "chatMessages"."content" IS 'Message body';
COMMENT ON COLUMN "chatMessages"."parentId" IS 'Direct previous message (conversation flow)';
COMMENT ON COLUMN "chatMessages"."previousId" IS 'For forking: original message you edited/regenerated from';
COMMENT ON COLUMN "chatMessages"."versionNumber" IS 'To track multiple forks/responses';
