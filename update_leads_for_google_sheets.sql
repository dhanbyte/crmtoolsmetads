-- ================================================
-- Google Sheets Integration - Database Updates
-- Run this in Supabase SQL Editor
-- ================================================

-- Add new columns to leads table for Google Sheets integration
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS ad_campaign TEXT,
ADD COLUMN IF NOT EXISTS platform_data JSONB,
ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;

-- Create index for faster lookups on external_id
CREATE INDEX IF NOT EXISTS idx_leads_external_id ON leads(external_id);

-- Create index for follow_up_date (for Team Followups page)
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON leads(follow_up_date);

-- Add constraint to prevent duplicate external_ids
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_external_id'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT unique_external_id UNIQUE (external_id);
    END IF;
END $$;

-- Update existing leads to have follow_up_date = next_follow_up if not set
UPDATE leads 
SET follow_up_date = next_follow_up 
WHERE follow_up_date IS NULL AND next_follow_up IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database schema updated successfully for Google Sheets integration!';
END $$;