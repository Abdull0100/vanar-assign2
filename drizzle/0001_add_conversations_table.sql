-- Create conversations table
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

-- Add conversationId column to chatMessages table
ALTER TABLE "chatMessages" ADD COLUMN "conversationId" uuid;

-- Create foreign key constraints
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

-- Update existing chatMessages to have a default conversation
-- First, create a default conversation for each user who has messages
INSERT INTO "conversations" ("id", "userId", "title", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(),
    "userId",
    'Default Conversation',
    MIN("createdAt"),
    MAX("createdAt")
FROM "chatMessages"
GROUP BY "userId";

-- Update chatMessages to link to the default conversations
UPDATE "chatMessages" 
SET "conversationId" = (
    SELECT c."id" 
    FROM "conversations" c 
    WHERE c."userId" = "chatMessages"."userId"
    LIMIT 1
);

-- Make conversationId NOT NULL after populating it
ALTER TABLE "chatMessages" ALTER COLUMN "conversationId" SET NOT NULL;

-- Add foreign key constraint for chatMessages
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "conversations_userId_idx" ON "conversations"("userId");
CREATE INDEX IF NOT EXISTS "chatMessages_conversationId_idx" ON "chatMessages"("conversationId");
CREATE INDEX IF NOT EXISTS "chatMessages_userId_idx" ON "chatMessages"("userId");
