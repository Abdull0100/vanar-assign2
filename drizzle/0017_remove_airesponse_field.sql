-- Migration: Remove deprecated aiResponse field from chatMessages table
-- This migration removes the aiResponse field as the system now uses role-based messages

-- Drop the aiResponse column
ALTER TABLE "chatMessages" DROP COLUMN IF EXISTS "aiResponse";
