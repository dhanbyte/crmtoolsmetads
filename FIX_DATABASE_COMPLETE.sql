-- ================================================
-- COMPLETE DATABASE FIX
-- Run this in Supabase SQL Editor to fix all issues
-- ================================================

-- 1. Create global_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can read global settings" ON global_settings;
CREATE POLICY "Anyone can read global settings" ON global_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update global settings" ON global_settings;
CREATE POLICY "Admins can update global settings" ON global_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 2. Add activities table if missing
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note', 'status_change', 'creation')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies for activities
DROP POLICY IF EXISTS "Users can view all activities" ON activities;
CREATE POLICY "Users can view all activities" ON activities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert activities" ON activities;
CREATE POLICY "Users can insert activities" ON activities
  FOR INSERT WITH CHECK (true);

-- Indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- 3. Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS questions JSONB;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ad_campaign TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS platform_data JSONB;

-- 4. Insert default WhatsApp template if missing
INSERT INTO global_settings (key, value, updated_at)
VALUES (
  'whatsapp_template',
  '{"message": "Hello {name}, calling from CRM regarding your inquiry about {interest}. How can we help you today?"}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 5. Check database status
SELECT 'Database Fix Complete!' as status;

-- Check tables
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'global_settings', COUNT(*) FROM global_settings;

-- Check unassigned leads (pool)
SELECT 
  COUNT(*) FILTER (WHERE assigned_to IS NULL) as leads_in_pool,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned_leads,
  COUNT(*) as total_leads
FROM leads;