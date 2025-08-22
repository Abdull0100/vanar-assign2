CREATE TABLE "aiFeedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"conversationId" uuid NOT NULL,
	"rating" integer NOT NULL,
	"feedbackType" text,
	"comment" text,
	"responseQuality" text,
	"accuracy" text,
	"relevance" text,
	"helpfulness" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aiModels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"version" text,
	"capabilities" jsonb,
	"maxTokens" integer,
	"costPerToken" numeric(10, 6),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aiModels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "aiPrompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"variables" jsonb,
	"isActive" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"usageCount" integer DEFAULT 0,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aiPrompts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "aiUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"conversationId" uuid,
	"messageId" uuid,
	"aiModelId" uuid,
	"modelName" text NOT NULL,
	"requestType" text NOT NULL,
	"tokensUsed" integer NOT NULL,
	"processingTime" numeric(10, 3),
	"cost" numeric(10, 6),
	"status" text DEFAULT 'success',
	"errorMessage" text,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "messageType" text DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "aiModel" text;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "tokens" integer;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "processingTime" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "confidence" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "sentiment" text;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "entities" jsonb;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "topics" jsonb;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "wordCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "hasCode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "hasLinks" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "hasImages" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "chatMessages" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "aiModel" text DEFAULT 'gemini-1.5-flash';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "conversationType" text DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "sentiment" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "complexity" text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "language" text DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "wordCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "messageCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "lastActivity" timestamp;--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "totalAiTokens" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "totalAiCost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "aiUsageCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "averageResponseTime" numeric(10, 3);--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "preferredAiModel" text;--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "conversationTypes" jsonb;--> statement-breakpoint
ALTER TABLE "userStats" ADD COLUMN "feedbackScore" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "aiFeedback" ADD CONSTRAINT "aiFeedback_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiFeedback" ADD CONSTRAINT "aiFeedback_messageId_chatMessages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chatMessages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiFeedback" ADD CONSTRAINT "aiFeedback_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiPrompts" ADD CONSTRAINT "aiPrompts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiUsage" ADD CONSTRAINT "aiUsage_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiUsage" ADD CONSTRAINT "aiUsage_conversationId_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiUsage" ADD CONSTRAINT "aiUsage_messageId_chatMessages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."chatMessages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiUsage" ADD CONSTRAINT "aiUsage_aiModelId_aiModels_id_fk" FOREIGN KEY ("aiModelId") REFERENCES "public"."aiModels"("id") ON DELETE set null ON UPDATE no action;