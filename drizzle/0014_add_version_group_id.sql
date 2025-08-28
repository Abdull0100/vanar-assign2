-- Add new versioning columns to chatMessages table
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "versionGroupId" uuid;
ALTER TABLE "chatMessages" ADD COLUMN IF NOT EXISTS "parentId" uuid REFERENCES "chatMessages"("id") ON DELETE SET NULL;
--> statement-breakpoint
