# 🚨 Quick Fix Guide - Database Error

## Problem
Getting error: `column "email" does not exist`

This means your Supabase database has old/incomplete tables.

---

## ✅ Solution (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New Query"

### Step 2: Run the Fix Script
1. Open the file: **`FIX_DATABASE.sql`**
2. Copy **ALL** the content (entire file)
3. Paste in Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Wait for Success
You should see:
```
Database Setup Complete!
Total Leads Imported: 25
Pool Leads (Unassigned): 25
WhatsApp Template: {"message": "Hello {name}..."}
```

### Step 4: Refresh Your App
1. Go back to http://localhost:3000/admin/leads
2. Press **Ctrl+Shift+R** (hard refresh)
3. You should see **25 leads** now! 🎉

---

## ⚠️ What This Script Does

1. **Safely Drops** all existing tables (old schema)
2. **Recreates** all tables with correct columns:
   - users
   - leads (with interest, questions, follow_up_notes, etc.)
   - activities
   - global_settings

3. **Inserts** 25 mock leads automatically
4. **Sets up** WhatsApp template
5. **Configures** all permissions (RLS policies)

---

## 🎯 After Running Script

### Test These Features:

1. **Admin Leads Page** - Should show 25 leads
   ```
   http://localhost:3000/admin/leads
   ```

2. **Team Dashboard** - Should show 25 leads in pool
   ```
   http://localhost:3000/team/dashboard
   ```

3. **Admin Settings** - Should have WhatsApp template
   ```
   http://localhost:3000/admin/settings
   ```

---

## 🔐 Login Credentials

### Admin Account
```
Email:    admin@crmpro.com
Password: 704331
```

**Note:** If you can't login, go to:
```
http://localhost:3000/setup
```
Create admin account, then login.

---

## 🆘 Still Getting Errors?

### Error: "relation does not exist"
- Make sure you ran the ENTIRE `FIX_DATABASE.sql` file
- Check that no errors appeared in SQL Editor output

### Error: "permission denied"
- You might not be the database owner
- Try running with `GRANT ALL` privileges

### Error: "syntax error"
- Make sure you copied the entire file
- Don't modify the SQL before running

### App shows "No leads found"
- Hard refresh the page (Ctrl+Shift+R)
- Check in Supabase Table Editor → leads table
- Should have 25 rows

---

## 📊 Expected Results

After running the script:

| Table | Rows | Description |
|-------|------|-------------|
| users | 0-1 | Admin account (if created via /setup) |
| leads | 25 | Mock leads for testing |
| activities | 0 | Will populate as you use the app |
| global_settings | 1 | WhatsApp template |

---

## ✅ Next Steps

1. ✅ Run `FIX_DATABASE.sql`
2. ✅ Create admin account at `/setup`
3. ✅ Login with admin credentials
4. ✅ View leads at `/admin/leads`
5. ✅ Test team dashboard at `/team/dashboard`
6. ✅ Accept a lead from pool
7. ✅ Test WhatsApp button
8. ✅ Schedule a follow-up

---

## 💡 Pro Tips

- **Backup First**: If you have real data, export it before running this script
- **Fresh Start**: This script gives you a clean slate
- **Test Everything**: After running, test all features to ensure they work
- **Check Console**: Open browser DevTools (F12) to check for any errors

---

## 🎉 Success Checklist

- [ ] SQL script ran without errors
- [ ] 25 leads visible in admin leads page
- [ ] 25 leads visible in team pool tab
- [ ] WhatsApp template saved in settings
- [ ] Can login with admin credentials
- [ ] Can accept leads from pool
- [ ] WhatsApp button opens with correct message
- [ ] Follow-up scheduling works

If all checked, you're good to go! 🚀