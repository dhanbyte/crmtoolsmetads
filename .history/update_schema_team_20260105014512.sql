-- Migration to add fields for Team Dashboard features

-- 1. Add tracking columns to leads table
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
END $$;

-- 2. Create activities table for tracking history and daily stats
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note', 'status_change', 'creation')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily stats counting
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON leads(next_follow_up);

-- Enable RLS on activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activities" ON activities;
CREATE POLICY "Admins can view all activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 3. Add interest, questions and follow-up notes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'interest') THEN
        ALTER TABLE leads ADD COLUMN interest TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'questions') THEN
        ALTER TABLE leads ADD COLUMN questions JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'follow_up_notes') THEN
        ALTER TABLE leads ADD COLUMN follow_up_notes TEXT;
    END IF;
END $$;

-- 4. Create global_settings table
CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default whatsapp template
INSERT INTO global_settings (key, value)
VALUES ('whatsapp_template', '{"message": "Hello {name}, I noticed you are interested in {interest}. How can I help you today?"}')
ON CONFLICT (key) DO NOTHING;
