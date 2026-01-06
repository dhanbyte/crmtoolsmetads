-- ================================================
-- Unassign All Leads to Make Them Available in Pool
-- Run this in Supabase SQL Editor
-- ================================================

-- Check current status
SELECT 
  COUNT(*) FILTER (WHERE assigned_to IS NULL) as unassigned_in_pool,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned,
  COUNT(*) as total
FROM leads;

-- Unassign ALL leads so they go to pool
UPDATE leads SET assigned_to = NULL;

-- Verify all leads are now in pool
SELECT 
  COUNT(*) as total_in_pool
FROM leads 
WHERE assigned_to IS NULL;

-- See all leads
SELECT id, name, phone, status, assigned_to FROM leads LIMIT 10;