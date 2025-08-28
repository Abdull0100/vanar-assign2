-- Add message_index field to chatMessages table
ALTER TABLE "chatMessages" ADD COLUMN "message_index" integer;

-- Create an index for better performance when querying by message_index
CREATE INDEX "chatMessages_message_index_idx" ON "chatMessages" ("message_index");

-- Update existing messages to have message_index based on their chronological order
WITH indexed_messages AS (
  SELECT 
    id,
    "conversationId",
    ROW_NUMBER() OVER (PARTITION BY "conversationId" ORDER BY "createdAt") as new_message_index
  FROM "chatMessages"
)
UPDATE "chatMessages" 
SET "message_index" = indexed_messages.new_message_index
FROM indexed_messages
WHERE "chatMessages".id = indexed_messages.id;
