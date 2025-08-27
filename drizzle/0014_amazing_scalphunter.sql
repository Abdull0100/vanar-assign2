ALTER TABLE "chatMessages" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "childrenIds" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "rootMessageId" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "activePath" jsonb DEFAULT '[]'::jsonb;