ALTER TABLE "password_resets" DROP CONSTRAINT "password_resets_token_unique";--> statement-breakpoint
ALTER TABLE "password_resets" ADD COLUMN "otp" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "password_resets" DROP COLUMN "token";