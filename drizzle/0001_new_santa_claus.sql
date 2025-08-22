ALTER TABLE "chatMessages" ADD COLUMN "userMessage" text;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "previousMsgId" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "content";