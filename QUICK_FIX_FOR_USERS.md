# 🔧 User Phone Login Not Working - Quick Fix

## Problem
Existing users don't have phone numbers in database, so phone login fails.

## Solution Options

### Option 1: Update Existing Users with Phone Numbers (RECOMMENDED)

Run this in **Supabase SQL Editor**:

```sql
-- See which users need phone numbers
SELECT id, name, email, role, phone FROM users WHERE phone IS NULL;

-- Add phone numbers to specific users
-- Replace with actual phone numbers for your team
UPDATE users SET phone = '9876543210' WHERE email = 'user1@example.com';
UPDATE users SET phone = '9876543211' WHERE email = 'user2@example.com';

-- Verify
SELECT id, name, email, role, phone FROM users;
```

### Option 2: Create New Users with Phone Numbers

Go to: **Admin Dashboard → Users → Add New User**

Fill in:
- Name: Test Team Member
- Email: test@example.com
- Phone: **9876543210** (REQUIRED)
- Role: Team

Then login with: `9876543210`

---

## Testing

After adding phone numbers:

1. **Admin Login**: `9157499884` ✅ (Already working)
2. **Team Login**: Use the phone number you assigned to that user

---

## Current Status

✅ Admin phone login works (9157499884)  
✅ Lead count now shows on Leads page  
⚠️ Team users need phone numbers added to database  

Run the SQL above to fix team login!