-- ================================================
-- Add phone column to users table
-- Run this in Supabase SQL Editor
-- ================================================

-- Add phone column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
    RAISE NOTICE 'Phone column added to users table';
  ELSE
    RAISE NOTICE 'Phone column already exists';
  END IF;
END $$;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;