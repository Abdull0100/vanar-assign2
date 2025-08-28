ALTER TABLE "chatMessages" ADD COLUMN "parent_message_id" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "version_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "is_forked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "original_message_id" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_parent_message_id_chatMessages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."chatMessages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_original_message_id_chatMessages_id_fk" FOREIGN KEY ("original_message_id") REFERENCES "public"."chatMessages"("id") ON DELETE set null ON UPDATE no action;