-- ================================================
-- FIX DATABASE - Safe Migration Script
-- This will reset and recreate everything correctly
-- ================================================

-- Step 1: Drop all existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS global_settings CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Drop all policies (if they exist)
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Only admins can insert users" ON users;
DROP POLICY IF EXISTS "Only admins can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update leads" ON leads;
DROP POLICY IF EXISTS "Only admins can delete leads" ON leads;
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON activities;
DROP POLICY IF EXISTS "Admins can view all activities" ON activities;
DROP POLICY IF EXISTS "Everyone can view settings" ON global_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON global_settings;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- Create Users Table
-- ================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'team')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Create Leads Table
-- ================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  source TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Team Dashboard columns
  next_follow_up TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  last_activity_type TEXT,
  interest TEXT,
  questions JSONB,
  follow_up_notes TEXT
);

-- ================================================
-- Create Activities Table
-- ================================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'whatsapp', 'note', 'status_change', 'creation')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Create Global Settings Table
-- ================================================
CREATE TABLE global_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- Create Indexes
-- ================================================
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at);

-- ================================================
-- Enable RLS
-- ================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies for Users
-- ================================================
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ================================================
-- RLS Policies for Leads
-- ================================================
CREATE POLICY "Users can view all leads" ON leads
  FOR SELECT USING (true);

CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update leads" ON leads
  FOR UPDATE USING (true);

CREATE POLICY "Only admins can delete leads" ON leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ================================================
-- RLS Policies for Activities
-- ================================================
CREATE POLICY "Users can view their own activities" ON activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ================================================
-- RLS Policies for Global Settings
-- ================================================
CREATE POLICY "Everyone can view settings" ON global_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON global_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- ================================================
-- Create Triggers
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Insert Default Data
-- ================================================

-- Insert WhatsApp template
INSERT INTO global_settings (key, value) VALUES 
('whatsapp_template', '{"message": "Hello {name}, I noticed you are interested in {interest}. How can I help you today?"}');

-- Insert 25 Mock Leads
INSERT INTO leads (name, email, phone, status, source, interest, notes, assigned_to) VALUES
('Rahul Sharma', 'rahul.sharma@gmail.com', '+91 9876543210', 'new', 'Website', 'Premium Package', 'Interested in enterprise plan', NULL),
('Priya Patel', 'priya.patel@yahoo.com', '+91 8765432109', 'new', 'Facebook', 'Digital Marketing Services', 'Wants pricing details', NULL),
('Amit Kumar', 'amit.kumar@outlook.com', '+91 7654321098', 'new', 'Referral', 'Web Development', 'Looking for custom website', NULL),
('Sneha Reddy', 'sneha.reddy@gmail.com', '+91 9988776655', 'new', 'LinkedIn', 'SEO Services', 'Needs immediate quote', NULL),
('Vikram Singh', 'vikram.singh@gmail.com', '+91 8877665544', 'new', 'Google Ads', 'Mobile App Development', 'Budget: 5-10 lakhs', NULL),
('Anjali Mehta', 'anjali.mehta@hotmail.com', '+91 7766554433', 'new', 'Instagram', 'Social Media Marketing', 'Startup company', NULL),
('Rajesh Gupta', 'rajesh.gupta@gmail.com', '+91 9955443322', 'new', 'WhatsApp', 'E-commerce Website', 'Shopify integration needed', NULL),
('Kavita Joshi', 'kavita.joshi@gmail.com', '+91 8844332211', 'new', 'Website', 'Branding Services', 'New business launch', NULL),
('Arjun Verma', 'arjun.verma@yahoo.com', '+91 7733221100', 'new', 'Facebook', 'Content Writing', 'Monthly retainer interest', NULL),
('Pooja Nair', 'pooja.nair@gmail.com', '+91 9922118877', 'new', 'Referral', 'Graphic Design', 'Logo design needed urgently', NULL),
('Suresh Iyer', 'suresh.iyer@outlook.com', '+91 8811776655', 'new', 'LinkedIn', 'Video Production', 'Corporate video project', NULL),
('Deepa Krishnan', 'deepa.krishnan@gmail.com', '+91 7700665544', 'new', 'Google Ads', 'Email Marketing', 'Newsletter campaign setup', NULL),
('Manish Agarwal', 'manish.agarwal@gmail.com', '+91 9988554433', 'new', 'Website', 'Consulting Services', 'Business growth strategy', NULL),
('Neha Kapoor', 'neha.kapoor@hotmail.com', '+91 8877443322', 'new', 'Instagram', 'Photography Services', 'Wedding photography', NULL),
('Sanjay Pillai', 'sanjay.pillai@gmail.com', '+91 7766332211', 'new', 'WhatsApp', 'UI/UX Design', 'Mobile app redesign', NULL),
('Ritika Bansal', 'ritika.bansal@yahoo.com', '+91 9955221100', 'new', 'Facebook', 'Cloud Services', 'AWS migration project', NULL),
('Karan Malhotra', 'karan.malhotra@gmail.com', '+91 8844119988', 'new', 'Referral', 'Cybersecurity', 'Security audit needed', NULL),
('Tanya Saxena', 'tanya.saxena@outlook.com', '+91 7733008877', 'new', 'LinkedIn', 'AI/ML Solutions', 'Chatbot development', NULL),
('Varun Chopra', 'varun.chopra@gmail.com', '+91 9922997766', 'new', 'Website', 'Blockchain Development', 'NFT marketplace', NULL),
('Simran Kaur', 'simran.kaur@gmail.com', '+91 8811886655', 'new', 'Google Ads', 'DevOps Services', 'CI/CD pipeline setup', NULL),
('Rohit Bhatia', 'rohit.bhatia@hotmail.com', '+91 7700775544', 'new', 'Instagram', 'Data Analytics', 'Dashboard creation', NULL),
('Meera Desai', 'meera.desai@gmail.com', '+91 9988663322', 'new', 'WhatsApp', 'CRM Development', 'Custom CRM solution', NULL),
('Nikhil Rao', 'nikhil.rao@yahoo.com', '+91 8877552211', 'new', 'Facebook', 'Payment Gateway', 'Integration services', NULL),
('Shreya Mishra', 'shreya.mishra@gmail.com', '+91 7766441100', 'new', 'Referral', 'Chatbot Development', 'WhatsApp bot needed', NULL),
('Aditya Pandey', 'aditya.pandey@outlook.com', '+91 9955330099', 'new', 'LinkedIn', 'API Development', 'REST API services', NULL);

-- ================================================
-- Verification
-- ================================================
SELECT 'Database Setup Complete!' as status;
SELECT 'Total Leads Imported' as metric, COUNT(*) as count FROM leads;
SELECT 'Pool Leads (Unassigned)' as metric, COUNT(*) as count FROM leads WHERE assigned_to IS NULL;
SELECT 'WhatsApp Template' as metric, value FROM global_settings WHERE key = 'whatsapp_template';