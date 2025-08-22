-- Add rolling summary fields to conversations
ALTER TABLE "conversations"
ADD COLUMN IF NOT EXISTS "summary" text,
ADD COLUMN IF NOT EXISTS "summaryUpdatedAt" timestamp;


