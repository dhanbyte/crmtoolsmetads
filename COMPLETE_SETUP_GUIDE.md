# 🚀 Complete Setup Guide - LEADS CRM

## 📋 Table of Contents
1. [Admin Credentials](#admin-credentials)
2. [Database Setup](#database-setup)
3. [Import Mock Data](#import-mock-data)
4. [First Login](#first-login)
5. [Testing the System](#testing-the-system)

---

## 🔐 Admin Credentials

### Default Login Details
```
Email:    admin@crmpro.com
Password: 704331
```

> **Note:** This is the default password. Change it after first login for production use!

---

## 🗄️ Database Setup

### Step 1: Run Schema Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on "SQL Editor" in the left sidebar

2. **Execute Main Schema** (if not done already)
   ```sql
   -- Copy and paste contents of supabase_schema.sql
   -- Click "Run" button
   ```

3. **Execute Team Features Migration**
   ```sql
   -- Copy and paste contents of update_schema_team.sql
   -- Click "Run" button
   ```

### What Gets Created:
- ✅ `users` table with role-based access
- ✅ `leads` table with new columns (interest, questions, follow_up_notes)
- ✅ `activities` table for tracking all interactions
- ✅ `global_settings` table for WhatsApp templates
- ✅ Row Level Security (RLS) policies
- ✅ Default WhatsApp template

---

## 📊 Import Mock Data

### Option 1: Using SQL (Recommended - Fastest)

1. **Open Supabase SQL Editor**

2. **Copy and Run** `IMPORT_LEADS.sql`
   - This will insert 25 mock leads
   - All leads will be in the pool (unassigned)
   - Each lead has realistic Indian names, phone numbers, and interests

3. **Verify Import**
   ```sql
   SELECT COUNT(*) as total_leads FROM leads;
   -- Should return: 25
   
   SELECT COUNT(*) as pool_leads FROM leads WHERE assigned_to IS NULL;
   -- Should return: 25
   ```

### Option 2: Using CSV Import

1. **Open Supabase Dashboard**
   - Go to "Table Editor"
   - Select "leads" table

2. **Click "Insert" → "Import from CSV"**

3. **Upload** `MOCK_LEADS_IMPORT.csv`
   - Map columns correctly
   - Click "Import"

### Option 3: Manual Entry
- Use the admin interface to add leads one by one
- Admin Dashboard → Leads → Add Lead

---

## 🎯 First Login

### Step 1: Create Admin Account

1. **Open Setup Page**
   ```
   http://localhost:3000/setup
   ```

2. **Form is Pre-filled** with default values:
   - Name: Admin User
   - Email: admin@crmpro.com
   - Password: 704331
   - Role: Admin

3. **Click "Create Admin Account"**
   - Wait for success message
   - You'll be redirected to login page

### Step 2: Login

1. **Open Login Page**
   ```
   http://localhost:3000/login
   ```

2. **Enter Credentials**
   - Email: admin@crmpro.com
   - Password: 704331

3. **Click "Sign In"**
   - You should be redirected to Admin Dashboard

---

## 🧪 Testing the System

### Test 1: View Pool Leads (Team Member)

1. **Create a Team Member Account**
   - Admin Dashboard → Users → Create User
   - Email: team@crmpro.com
   - Password: team123
   - Role: Team Member

2. **Login as Team Member**
   - Logout from admin
   - Login with team credentials

3. **Go to Team Dashboard**
   ```
   http://localhost:3000/team/dashboard
   ```

4. **Check Pool Tab**
   - You should see all 25 leads
   - Each lead should have an "Accept" button

### Test 2: Accept a Lead

1. **In Team Dashboard → Pool Tab**
   - Click "Accept" on any lead

2. **Verify**
   - Lead should move to "My Leads" tab
   - Lead should disappear from pool
   - Lead count should update

3. **Switch to Another Tab and Back**
   - Pool count should decrease
   - My Leads count should increase

### Test 3: WhatsApp Integration

1. **Go to Admin Settings**
   ```
   http://localhost:3000/admin/settings
   ```

2. **Edit WhatsApp Template**
   ```
   Hey {name}! 👋

   I saw you're interested in {interest}. 

   Let's discuss how we can help you!

   Best regards,
   CRM Team
   ```

3. **Save Template**

4. **Test as Team Member**
   - Go to My Leads tab
   - Click WhatsApp button on a lead
   - Verify message opens with correct replacements

### Test 4: Follow-up Scheduling

1. **In Team Dashboard → My Leads**
   - Click "Follow-up" button on a lead

2. **Fill in Details**
   - Next Follow-up Date: Tomorrow at 2 PM
   - Notes: "Interested in premium package - call back to discuss pricing"

3. **Save**

4. **Verify**
   - Follow-up should appear in "Urgent Follow-ups" section
   - Lead should show the follow-up date and notes

### Test 5: Activity Logging

1. **Click Call Button** on any lead
   - Should open phone dialer
   - Activity should be logged

2. **Check Activities Table** (in Supabase)
   ```sql
   SELECT * FROM activities ORDER BY created_at DESC LIMIT 10;
   ```
   - Should show the call activity

---

## ✅ Verification Checklist

After setup, verify these items:

### Database
- [ ] All tables created (users, leads, activities, global_settings)
- [ ] 25 mock leads imported
- [ ] All leads are in pool (assigned_to = NULL)
- [ ] WhatsApp template exists in global_settings

### Authentication
- [ ] Admin account created
- [ ] Can login with admin credentials
- [ ] Team member account created
- [ ] Can login with team credentials

### Admin Features
- [ ] Can view all leads
- [ ] Can access admin settings
- [ ] Can edit WhatsApp template
- [ ] Can create new users

### Team Features
- [ ] Pool tab shows unassigned leads
- [ ] Can accept leads from pool
- [ ] Accepted leads move to My Leads
- [ ] WhatsApp button generates correct message
- [ ] Follow-up scheduling works
- [ ] Urgent follow-ups display correctly

---

## 📊 Data Overview

### Mock Leads Summary
- **Total Leads:** 25
- **Status:** All "new"
- **Assignment:** All in pool (unassigned)
- **Sources:** Website, Facebook, LinkedIn, Google Ads, Instagram, WhatsApp, Referral
- **Interests:** Various services (Premium Package, Digital Marketing, Web Development, etc.)

### Sample Leads
| Name | Phone | Interest | Source |
|------|-------|----------|--------|
| Rahul Sharma | +91 9876543210 | Premium Package | Website |
| Priya Patel | +91 8765432109 | Digital Marketing Services | Facebook |
| Amit Kumar | +91 7654321098 | Web Development | Referral |

---

## 🔧 Troubleshooting

### Issue: "Admin already exists"
- **Solution:** Go directly to login page and use the credentials

### Issue: "Cannot read properties of null"
- **Solution:** Make sure database migrations are complete
- Check Supabase connection in `.env.local`

### Issue: "Pool is empty"
- **Solution:** Import the mock leads using IMPORT_LEADS.sql
- Verify: `SELECT COUNT(*) FROM leads WHERE assigned_to IS NULL;`

### Issue: "WhatsApp template not working"
- **Solution:** Check if global_settings table has the template
- Run: `SELECT * FROM global_settings WHERE key = 'whatsapp_template';`
- If empty, run the insert from update_schema_team.sql

### Issue: "Activities not logging"
- **Solution:** Check RLS policies on activities table
- Verify user is authenticated

---

## 🎉 Success!

If all tests pass, your LEADS CRM is fully set up and ready to use!

### Next Steps:
1. ✅ Customize WhatsApp templates for your business
2. ✅ Import your real leads data
3. ✅ Create team member accounts for your sales team
4. ✅ Start managing leads efficiently!

---

## 📞 Support Files

- `ADMIN_CREDENTIALS.md` - Login credentials reference
- `DATABASE_SETUP.md` - Detailed database setup
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `MOCK_LEADS_IMPORT.csv` - CSV file for manual import
- `IMPORT_LEADS.sql` - SQL script for quick import
- `update_schema_team.sql` - Database migration script

---

## 🔒 Security Reminder

**Before going to production:**
1. Change default admin password
2. Use strong passwords for all accounts
3. Review RLS policies
4. Enable 2FA if available
5. Use environment variables for sensitive data