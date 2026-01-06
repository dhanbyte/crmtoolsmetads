-- ================================================
-- Add Phone Numbers to Existing Users
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: See all existing users
SELECT id, name, email, role, phone FROM users;

-- Step 2: Update the first admin user with phone number
UPDATE users 
SET phone = '9157499884' 
WHERE id = (
  SELECT id FROM users WHERE role = 'admin' LIMIT 1
);

-- Step 3: Verify the update worked
SELECT id, name, email, role, phone FROM users;