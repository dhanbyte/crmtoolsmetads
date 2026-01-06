-- Run this in Supabase SQL Editor to check leads

-- Check how many unassigned leads (available in pool)
SELECT COUNT(*) as unassigned_count 
FROM leads 
WHERE assigned_to IS NULL;

-- See all unassigned leads
SELECT id, name, email, phone, status, source, assigned_to 
FROM leads 
WHERE assigned_to IS NULL;

-- See all leads with assignment status
SELECT 
  id, 
  name, 
  phone, 
  status, 
  CASE 
    WHEN assigned_to IS NULL THEN 'Unassigned (In Pool)' 
    ELSE 'Assigned'
  END as assignment_status,
  assigned_to
FROM leads 
ORDER BY assigned_to NULLS FIRST;