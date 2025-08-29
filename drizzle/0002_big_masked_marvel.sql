ALTER TABLE "chatMessages" ADD COLUMN "content" text;--> statement-breakpoint
UPDATE "chatMessages" SET "content" = '' WHERE "content" IS NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ALTER COLUMN "content" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "userMessage";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "previousMsgId";