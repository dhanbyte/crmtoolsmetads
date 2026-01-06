-- ================================================
-- Fix Trigger and Add Phone to Users
-- Run EACH command ONE AT A TIME in Supabase SQL Editor
-- ================================================

-- Step 1: Temporarily disable the trigger
ALTER TABLE users DISABLE TRIGGER update_users_updated_at;

-- Step 2: See all users
SELECT id, name, email, role, phone FROM users;

-- Step 3: Add phone to admin
UPDATE users 
SET phone = '9157499884' 
WHERE role = 'admin';

-- Step 4: Verify
SELECT id, name, email, role, phone FROM users;

-- Step 5: Re-enable the trigger
ALTER TABLE users ENABLE TRIGGER update_users_updated_at;