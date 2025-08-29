ALTER TABLE "documentChunks" ADD COLUMN "conversationId" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "conversationId" uuid;--> statement-breakpoint
ALTER TABLE "documentChunks" ADD CONSTRAINT "documentChunks_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;