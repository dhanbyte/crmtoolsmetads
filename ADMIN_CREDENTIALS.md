# 🔐 Login System Guide

## Two Login Methods

### 1. Admin Login (Any Email + Password)
```
Email:    Any email address
Password: 704331 (same for all admins)
```

### 2. Team Member Login (Phone Number Only)
```
Phone:    Enter your 10-digit phone number
Password: Not required (auto-login)
```

## How to Login

1. **Start the Development Server** (if not running)
   ```bash
   npm run dev
   ```

2. **Open Login Page**
   - URL: http://localhost:3000/login
   
3. **For Admin:**
   - Enter **any email address** (e.g., `admin@crmpro.com`, `john@example.com`)
   - Enter Password: `704331`
   - Click "Sign In"
   - ⚠️ Password is the same for all admins

4. **For Team Members:**
   - Enter Phone Number (e.g., `1234567890`)
   - Password field will be hidden
   - Click "Sign In"

---

## Database Migration Required

**IMPORTANT:** Before using the new login system, run this SQL in Supabase SQL Editor:

```sql
-- Add phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
```

Or run the complete migration file: `add_phone_to_users.sql`

---

## First Time Setup

If this is your first time, you may need to create the admin account:

1. **Go to Setup Page**
   - URL: http://localhost:3000/setup

2. **The Form is Pre-filled** with:
   - Name: Admin User
   - Email: admin@crmpro.com
   - Password: 704331
   - Role: Admin

3. **Click "Create Admin Account"**

4. **You'll be redirected to Login**
   - Use email and password to login

---

## After Login

### Admin Dashboard Access
- URL: http://localhost:3000/admin/dashboard
- Here you can:
  - View all leads
  - Manage users
  - View messages
  - Configure settings

### Admin Settings (WhatsApp Template)
- URL: http://localhost:3000/admin/settings
- Configure the WhatsApp message template
- Use placeholders: `{name}` and `{interest}`

---

## Creating Team Member Accounts

You can create team member accounts from:
- Admin Dashboard → Users → Create User

**Team Member Setup:**
1. Go to Admin Dashboard → Users
2. Click "Add New User"
3. Select "Team Member" role
4. Enter:
   - Name: Team Member Name
   - Email: team@crmpro.com
   - Phone: 1234567890 (10-digit number)
5. Click "Create User"

**Team Member Login:**
- They will login using only their phone number
- No password needed
- Example: Enter `1234567890` on login page

---

## Importing Mock Leads

### Option 1: Manual Import via Supabase Dashboard

1. **Run Database Migrations First**
   ```sql
   -- Execute update_schema_team.sql in Supabase SQL Editor
   ```

2. **Go to Supabase Dashboard**
   - Navigate to Table Editor
   - Select "leads" table
   - Click "Insert" → "Import data from CSV"

3. **Upload the CSV File**
   - Use `MOCK_LEADS_IMPORT.csv` file
   - Map columns correctly
   - Click "Import"

### Option 2: SQL Insert Script

Alternatively, you can run this SQL in Supabase:

```sql
-- See IMPORT_LEADS.sql file
```

---

## Quick Access Links

| Page | URL | Access |
|------|-----|--------|
| Login | http://localhost:3000/login | Everyone |
| Setup | http://localhost:3000/setup | First time only |
| Admin Dashboard | http://localhost:3000/admin/dashboard | Admin only |
| Admin Settings | http://localhost:3000/admin/settings | Admin only |
| Admin Leads | http://localhost:3000/admin/leads | Admin only |
| Admin Users | http://localhost:3000/admin/users | Admin only |
| Team Dashboard | http://localhost:3000/team/dashboard | Team members |
| Team Leads | http://localhost:3000/team/leads | Team members |

---

## Troubleshooting

### "Invalid email or password"
- Make sure you created the admin account via /setup page
- Check that you're using the correct credentials
- Verify Supabase is running and connected

### "Cannot read properties of null"
- Database might not be initialized
- Run the schema migrations first
- Check Supabase connection in .env.local

### "User not found"
- Go to /setup page and create the admin account
- Check the users table in Supabase

---

## How It Works

### Smart Login Detection
The login page automatically detects:
- **Email format** (contains @) → Shows password field for admin
- **Phone format** (only digits) → Hides password field for team

### Authentication Flow
- **Admin**: Any email + password "704331" grants admin access
- **Team**: Finds user by phone number, auto-authenticates

## Security Notes

**⚠️ IMPORTANT:** 
1. The admin password `704331` works with **ANY email address**
2. Anyone with password "704331" can login as admin
3. Team members authenticate via phone number lookup only
4. Change admin password for production use!
5. Each team member must have a unique phone number

## Troubleshooting

### "Phone column does not exist" error
- Run the migration SQL: `add_phone_to_users.sql`
- Or manually add: `ALTER TABLE users ADD COLUMN phone TEXT;`

### "Phone number not found"
- Make sure phone number is saved when creating team member
- Check users table in Supabase to verify phone column has data
- Ensure you're entering the exact phone number

### Admin password not working
- Password must be exactly: `704331`
- Check that user role is set to 'admin' in database