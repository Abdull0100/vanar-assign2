ALTER TABLE "conversations" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "isPublic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "roomType" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "maxParticipants" integer DEFAULT 1 NOT NULL;