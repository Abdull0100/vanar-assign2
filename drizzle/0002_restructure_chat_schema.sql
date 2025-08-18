-- Restructure chat schema to match new requirements
-- This migration completely restructures the chat system

-- First, create new tables with the new structure
CREATE TABLE IF NOT EXISTS "conversations_new" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "roomName" text NOT NULL,
    "createdAt" timestamp DEFAULT now() NOT NULL,
    "updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chatMessages_new" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" uuid NOT NULL REFERENCES "conversations_new"("id") ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "content" text NOT NULL,
    "sender" text NOT NULL,
    "aiResponse" text,
    "createdAt" timestamp DEFAULT now() NOT NULL
);

-- Migrate existing data
-- Convert conversations table
INSERT INTO "conversations_new" ("id", "userId", "roomName", "createdAt", "updatedAt")
SELECT 
    "id",
    "userId", 
    COALESCE("title", 'Chat Room') as "roomName",
    "createdAt",
    "updatedAt"
FROM "conversations";

-- Convert chat messages to new structure
-- Each user message becomes a separate message with sender='user'
INSERT INTO "chatMessages_new" ("id", "conversationId", "userId", "content", "sender", "aiResponse", "createdAt")
SELECT 
    gen_random_uuid() as "id",
    "conversationId",
    "userId",
    "message" as "content",
    'user' as "sender",
    CASE 
        WHEN "response" != '' AND "response" IS NOT NULL THEN "response"
        ELSE NULL
    END as "aiResponse",
    "createdAt"
FROM "chatMessages"
WHERE "message" != '' AND "message" IS NOT NULL;

-- Drop old tables
DROP TABLE IF EXISTS "chatMessages";
DROP TABLE IF EXISTS "conversations";

-- Rename new tables to original names
ALTER TABLE "conversations_new" RENAME TO "conversations";
ALTER TABLE "chatMessages_new" RENAME TO "chatMessages";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_chatMessages_conversationId" ON "chatMessages"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_chatMessages_userId" ON "chatMessages"("userId");
CREATE INDEX IF NOT EXISTS "idx_conversations_userId" ON "conversations"("userId");
