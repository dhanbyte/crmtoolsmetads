-- ================================================
-- SIMPLE MIGRATION: Just Add Phone Column
-- Run ONLY this in Supabase SQL Editor
-- ================================================

-- Add phone column to users table (safe to run multiple times)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'phone';

-- If the above query returns a row with "phone | text", you're all set!