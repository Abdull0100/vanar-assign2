ALTER TABLE "chatMessages" ADD COLUMN "attachedDocumentId" uuid;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "attachedDocumentName" text;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD CONSTRAINT "chatMessages_attachedDocumentId_documents_id_fk" FOREIGN KEY ("attachedDocumentId") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;