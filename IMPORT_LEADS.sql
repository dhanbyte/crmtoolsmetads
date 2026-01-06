-- Import Mock Leads Data
-- Run this in Supabase SQL Editor after running update_schema_team.sql

-- Insert 25 mock leads into the pool (no assignment)
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
('Aditya Pandey', 'aditya.pandey@outlook.com', '+91 9955330099', 'new', 'LinkedIn', 'API Development', 'REST API services', NULL)
ON CONFLICT DO NOTHING;

-- Verify the import
SELECT COUNT(*) as total_leads FROM leads;
SELECT COUNT(*) as pool_leads FROM leads WHERE assigned_to IS NULL;

-- Check a sample
SELECT name, email, phone, interest, source FROM leads LIMIT 5;