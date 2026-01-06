-- Run this in Supabase SQL Editor to see all users

SELECT id, name, email, role, status 
FROM users 
ORDER BY role, name;