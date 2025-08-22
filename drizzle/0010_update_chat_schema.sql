-- Migration: Update chat schema
-- Remove sender column, add previousId field
-- Each row now represents a complete Q&A pair: user context + AI response

-- Add previousId column for linking previous chats in same room
ALTER TABLE "chatMessages" ADD COLUMN "previousId" uuid;

-- Remove sender column (no longer needed since each row is a complete Q&A pair)
ALTER TABLE "chatMessages" DROP COLUMN "sender";

-- Note: aiResponse field remains as 'aiResponse' 
-- - When aiResponse is NULL: it's a user message waiting for AI response
-- - When aiResponse has content: it's a complete Q&A pair
