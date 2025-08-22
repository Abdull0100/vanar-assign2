DROP TABLE "aiFeedback" CASCADE;--> statement-breakpoint
DROP TABLE "aiModels" CASCADE;--> statement-breakpoint
DROP TABLE "aiPrompts" CASCADE;--> statement-breakpoint
DROP TABLE "aiUsage" CASCADE;--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "messageType";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "aiModel";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "tokens";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "processingTime";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "confidence";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "sentiment";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "entities";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "topics";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "wordCount";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "hasCode";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "hasLinks";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "hasImages";--> statement-breakpoint
ALTER TABLE "chatMessages" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "aiModel";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "conversationType";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "sentiment";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "complexity";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "language";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "wordCount";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "messageCount";--> statement-breakpoint
ALTER TABLE "conversations" DROP COLUMN "lastActivity";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "totalAiTokens";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "totalAiCost";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "aiUsageCount";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "averageResponseTime";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "preferredAiModel";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "conversationTypes";--> statement-breakpoint
ALTER TABLE "userStats" DROP COLUMN "feedbackScore";