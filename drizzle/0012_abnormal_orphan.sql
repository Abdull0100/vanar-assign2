ALTER TABLE "chatMessages" DROP CONSTRAINT "chatMessages_conversationId_conversations_id_fk";
--> statement-breakpoint
ALTER TABLE "chatMessages" DROP CONSTRAINT "chatMessages_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "roomId" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "parentId" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "versionNumber" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_roomId_conversations_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "conversationId";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "userId";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "aiResponse";