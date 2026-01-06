# 🔧 Database Fix Instructions

## Problem
Your team dashboard shows "No leads available in the pool right now" because:
1. **Missing `global_settings` table** - causing console errors
2. **Missing `activities` table** - may cause errors when logging activities
3. **Database might be empty** - no leads exist yet

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: **kgpqmrgrkftucbigxbsd**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix
1. Open the file `FIX_DATABASE_COMPLETE.sql`
2. Copy **ALL content** from that file
3. Paste into Supabase SQL Editor
4. Click **RUN** button

### Step 3: Verify Fix
After running the SQL, you should see output like:
```
Database Fix Complete!
users: 2 (or more)
leads: X
activities: X
global_settings: 1
leads_in_pool: X
assigned_leads: X
```

### Step 4: Add Test Leads (if needed)
If your database shows 0 leads, you need to add some:

**Option A: Use Admin Dashboard**
1. Go to http://localhost:3000/login
2. Login with admin phone: `9157499884`
3. Go to Admin → Leads
4. Click "Add Lead" or "Import CSV"

**Option B: Run Quick SQL**
```sql
-- Add 3 test leads to pool
INSERT INTO leads (name, email, phone, status, source, assigned_to)
VALUES 
  ('Rahul Sharma', 'rahul@example.com', '+91 9876543210', 'new', 'Website', NULL),
  ('Priya Patel', 'priya@example.com', '+91 9876543211', 'new', 'Facebook', NULL),
  ('Amit Kumar', 'amit@example.com', '+91 9876543212', 'new', 'Referral', NULL);
```

## What This Fixes

✅ Removes console errors  
✅ Creates missing database tables  
✅ Enables real-time subscriptions  
✅ Shows leads in pool instantly  
✅ Team can accept leads  
✅ Admin can assign leads  

## After Fix - Test Real-time

1. Open Team Dashboard in one browser: http://localhost:3000/team/dashboard
2. Open Admin Dashboard in another browser/tab: http://localhost:3000/admin/dashboard
3. From Admin, assign a lead to a team member
4. **Watch Team Dashboard update INSTANTLY** ✨
5. From Team Dashboard, accept a lead from pool
6. **Watch it disappear from pool INSTANTLY** ✨

## Still Not Working?

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Check Supabase logs** for any RLS policy errors
3. **Verify you're logged in** as a team member
4. **Check browser console** for any errors (F12)

## Real-time Features Now Active

- ✅ Pool leads update across all team members
- ✅ Accepted leads show instantly
- ✅ Assigned leads appear immediately
- ✅ Released leads go back to pool instantly
- ✅ No manual refresh needed!