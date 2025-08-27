ALTER TABLE "chatMessages" DROP COLUMN "role";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "parentId";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "childrenIds";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "rootMessageId";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "activePath";