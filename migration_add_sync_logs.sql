-- Migration: Add Sync Logs Table
-- Run this in Supabase SQL Editor

-- Create sync_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  imported_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_processed INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed', 'partial')),
  error_message TEXT,
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'auto')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note', 'status_change', 'creation', 'assignment')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create global_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS global_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(sync_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Create indexes for activities
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist before creating new ones
DROP POLICY IF EXISTS "Only admins can view sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Only admins can insert sync logs" ON sync_logs;
DROP POLICY IF EXISTS "Users can view all activities" ON activities;
DROP POLICY IF EXISTS "Users can insert activities" ON activities;
DROP POLICY IF EXISTS "Users can view global settings" ON global_settings;
DROP POLICY IF EXISTS "Only admins can update global settings" ON global_settings;

-- RLS Policies for sync_logs (admin only)
CREATE POLICY "Only admins can view sync logs" ON sync_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert sync logs" ON sync_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- RLS Policies for activities
CREATE POLICY "Users can view all activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Users can insert activities" ON activities
  FOR INSERT WITH CHECK (true);

-- RLS Policies for global_settings
CREATE POLICY "Users can view global settings" ON global_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update global settings" ON global_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add additional fields to leads table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'next_follow_up') THEN
        ALTER TABLE leads ADD COLUMN next_follow_up TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_contacted_at') THEN
        ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_activity_type') THEN
        ALTER TABLE leads ADD COLUMN last_activity_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'interest') THEN
        ALTER TABLE leads ADD COLUMN interest TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'questions') THEN
        ALTER TABLE leads ADD COLUMN questions JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'follow_up_notes') THEN
        ALTER TABLE leads ADD COLUMN follow_up_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'city') THEN
        ALTER TABLE leads ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'external_id') THEN
        ALTER TABLE leads ADD COLUMN external_id TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'ad_campaign') THEN
        ALTER TABLE leads ADD COLUMN ad_campaign TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'platform_data') THEN
        ALTER TABLE leads ADD COLUMN platform_data JSONB;
    END IF;
END $$;

-- Success message
SELECT 'Migration completed successfully!' as message;