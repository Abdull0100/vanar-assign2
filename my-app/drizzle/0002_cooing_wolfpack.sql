ALTER TABLE "password_resets" RENAME COLUMN "otp" TO "token";--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_token_unique" UNIQUE("token");