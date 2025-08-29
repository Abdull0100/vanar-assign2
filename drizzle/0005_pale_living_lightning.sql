DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chatMessages' AND column_name = 'aiResponse') THEN
        ALTER TABLE "chatMessages" ALTER COLUMN "aiResponse" SET NOT NULL;
    END IF;
END $$;