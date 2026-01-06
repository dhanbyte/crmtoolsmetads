# 🚀 Deployment Setup Guide

## Your App is Live! 
**URL:** https://crm-tool-ten.vercel.app/

---

## ⚠️ IMPORTANT: First Time Setup Required

Before you can login, you need to create the admin account:

### Step 1: Go to Setup Page
Visit: https://crm-tool-ten.vercel.app/setup

### Step 2: Create Admin Account
The form is pre-filled with:
- **Name:** Admin User
- **Email:** admin@crmpro.com
- **Password:** 704331
- **Role:** Admin

Click **"Create Admin Account"**

### Step 3: Login
After creating the account, you'll be redirected to the login page.

Login with:
- **Email:** admin@crmpro.com
- **Password:** 704331

---

## 📋 Database Migration Required

⚠️ **Before the app works fully, run this SQL in your Supabase Dashboard:**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
```

**How to run:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Paste the above SQL
4. Click "Run"

---

## 🔑 Login Methods

### Admin Login
- **Input:** Any email address
- **Password:** 704331 (same for all admins)
- Example: `yourname@example.com` + password `704331`

### Team Member Login
- **Input:** Phone number only
- **No password required**
- Example: Just type `1234567890` and click Sign In

---

## 👥 Creating Team Members

1. Login as admin
2. Go to **User Management**
3. Click **"Add New User"**
4. Select **"Team Member"** role
5. Fill in:
   - Name
   - Email (for system use)
   - **Phone Number** (they'll use this to login)
6. Click **"Create User"**

---

## ✅ Verification Checklist

- [ ] Admin account created via /setup page
- [ ] Database migration executed in Supabase
- [ ] Admin can login with email + password
- [ ] Team members can be created with phone numbers
- [ ] All features accessible (Dashboard, Leads, Users, Settings)

---

## 🐛 Troubleshooting

### "Invalid email or password"
**Solution:** Create admin account first at `/setup` page

### "Phone column does not exist" error
**Solution:** Run the database migration SQL in Supabase

### Can't login as team member
**Solution:** 
1. Make sure phone column exists in database
2. Check that team member has a phone number saved
3. Enter phone number without spaces or symbols

---

## 📞 Support

If you have any issues, check:
1. Supabase is properly connected (check .env variables)
2. Database migration is complete
3. Admin account has been created

**Repository:** https://github.com/dhanbyte/crm-tool.git

---

**Setup Date:** 2026-01-06  
**Status:** ✅ Deployed and Ready