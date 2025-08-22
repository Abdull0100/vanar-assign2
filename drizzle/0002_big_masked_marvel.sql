ALTER TABLE "chatMessages" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "userMessage";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "previousMsgId";