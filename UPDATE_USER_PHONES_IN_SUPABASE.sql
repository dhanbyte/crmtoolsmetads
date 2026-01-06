-- ================================================
-- Update Existing Users with Phone Numbers
-- Run this in Supabase SQL Editor
-- ================================================

-- Step 1: See all users without phone numbers
SELECT id, name, email, role, phone FROM users WHERE phone IS NULL;

-- Step 2: Update users with their phone numbers
-- Replace the phone numbers below with actual numbers

-- Example: Update first team user
-- UPDATE users SET phone = '9876543210' WHERE email = 'team1@crmpro.com';

-- Or update all users at once (customize phone numbers):
-- UPDATE users SET phone = 
--   CASE 
--     WHEN email = 'admin@crmpro.com' THEN '9157499884'
--     WHEN email = 'team1@crmpro.com' THEN '9876543210'
--     WHEN email = 'team2@crmpro.com' THEN '9876543211'
--     -- Add more users here
--     ELSE phone
--   END
-- WHERE phone IS NULL;

-- Step 3: Verify all users now have phone numbers
SELECT id, name, email, role, phone FROM users;