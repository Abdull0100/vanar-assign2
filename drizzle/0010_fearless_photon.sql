ALTER TABLE "chatMessages" ADD COLUMN "previousId" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "sender";