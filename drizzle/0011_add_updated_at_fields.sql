-- Migration: Add updatedAt fields to conversations and chatMessages tables
-- This migration adds the missing updatedAt timestamp fields to match the specified structure

-- Add updatedAt column to conversations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "conversations" ADD COLUMN "updatedAt" timestamp DEFAULT NOW();
    END IF;
END $$;

-- Add updatedAt column to chatMessages table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chatMessages' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE "chatMessages" ADD COLUMN "updatedAt" timestamp DEFAULT NOW();
    END IF;
END $$;

-- Update existing records to have updatedAt timestamps
UPDATE "conversations" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
UPDATE "chatMessages" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Add triggers to automatically update updatedAt on row updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for conversations table
DROP TRIGGER IF EXISTS update_conversations_updated_at ON "conversations";
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON "conversations"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for chatMessages table
DROP TRIGGER IF EXISTS update_chatMessages_updated_at ON "chatMessages";
CREATE TRIGGER update_chatMessages_updated_at
    BEFORE UPDATE ON "chatMessages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
