# 🚨 CRITICAL: Database Migration Required

## ⚠️ Error: "Could not find the 'phone' column of 'users'"

This error occurs because the `phone` column doesn't exist in your Supabase database yet.

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **kgpqmrgrkftucbigxbsd**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run This SQL Command

```sql
-- Add phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

### Step 3: Verify in Table Editor
1. Go to **Table Editor** → **users** table
2. You should now see the `phone` column

## What This Fixes

✅ **User Creation**: Admins can now create users without errors  
✅ **Phone Login**: Both admin and team can login with phone numbers  
✅ **Admin Login**: Phone `9157499884` works for admin access  
✅ **Team Login**: Any team member's phone number works  

## New Login System

After migration:
- **Everyone logs in with PHONE NUMBER only** (no password needed in UI)
- System automatically detects if you're admin or team
- Redirects to appropriate dashboard

### Example:
- Admin phone: `9157499884` → Admin Dashboard
- Team phone: `9876543210` → Team Dashboard

## Troubleshooting

If you still see errors after running the SQL:
1. Refresh your browser completely (Ctrl+Shift+R)
2. Check Supabase Table Editor to confirm `phone` column exists
3. Try creating a new user from Admin → Users

## Need Help?

The migration is required only ONCE. After running the SQL command above, everything will work perfectly.