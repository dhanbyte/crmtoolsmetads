# Database Setup Instructions

## Step 1: Run Schema Migration

The database schema has been updated to support the new lead management features. You need to run the migration SQL file to add the required columns and tables.

### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `update_schema_team.sql`
4. Paste and run the SQL script

### Using Supabase CLI:
```bash
supabase db push
```

Or execute the migration directly:
```bash
psql <your-database-connection-string> -f update_schema_team.sql
```

## What Gets Added

### New Columns in `leads` table:
- `interest` (TEXT) - Stores what the lead is interested in
- `questions` (JSONB) - Stores any questions from the lead
- `follow_up_notes` (TEXT) - Notes for follow-up scheduling
- `next_follow_up` (TIMESTAMPTZ) - When to follow up next
- `last_contacted_at` (TIMESTAMPTZ) - Last contact timestamp
- `last_activity_type` (TEXT) - Type of last activity

### New Tables:
- `activities` - Tracks all user activities (calls, WhatsApp, notes, etc.)
- `global_settings` - Stores global configuration (WhatsApp templates, etc.)

### Default Data:
- A default WhatsApp message template is inserted: 
  ```
  "Hello {name}, I noticed you are interested in {interest}. How can I help you today?"
  ```

## Step 2: Verify Setup

After running the migration, verify:

1. **Check columns exist:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'leads';
   ```

2. **Check tables created:**
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('activities', 'global_settings');
   ```

3. **Check default template:**
   ```sql
   SELECT * FROM global_settings WHERE key = 'whatsapp_template';
   ```

## Features Enabled After Setup

✅ Lead Pool - Unassigned leads visible to all team members  
✅ Lead Assignment - Team members can accept leads from the pool  
✅ WhatsApp Integration - Dynamic messages with placeholders  
✅ Follow-up Scheduling - Set follow-up dates and notes  
✅ Activity Tracking - Log calls, messages, and status changes  
✅ Interest & Questions - Capture lead interests and questions  
✅ Admin Settings - Configure WhatsApp message templates  

## Troubleshooting

**Error: relation "global_settings" does not exist**
- Run the migration script again
- Make sure you're connected to the correct database

**Error: column already exists**
- This is safe to ignore - the migration uses `IF NOT EXISTS` checks

**RLS Policies Issues**
- The migration creates RLS policies for team members and admins
- Team members can only see their own activities
- Admins can see all activities

## Next Steps

1. ✅ Fix duplicate code (DONE)
2. ✅ Run database migration (YOU ARE HERE)
3. Test the lead acceptance flow
4. Configure WhatsApp template in Admin Settings
5. Start using the enhanced lead management system!