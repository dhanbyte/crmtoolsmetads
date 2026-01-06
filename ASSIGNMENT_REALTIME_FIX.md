# Assignment Real-time Update Issue

## Problem
- ✅ "Unassign All → Pool" button works (all leads unassigned)
- ❌ When assigning lead from Admin → Leads, assignment doesn't show
- ❌ When team accepts from pool, assignment doesn't show
- **Need manual refresh to see changes**

## Root Cause
Real-time subscription in `getAllLeads()` is working but UI might not be re-rendering on `assigned_to` field updates.

## Quick Fix (Manual Refresh)
For now, **refresh the page** (F5 or Ctrl+R) after:
- Assigning a lead
- Team member accepting a lead  
- Unassigning a lead

## Permanent Fix Needed
The Supabase real-time subscription should automatically trigger UI updates. Check:
1. RLS policies allow real-time events for UPDATE on `assigned_to` column
2. Real-time subscription in `leads-service.ts` is catching UPDATE events
3. React state updates properly when subscription fires

## Current Status
✅ Database updates work correctly  
✅ Manual refresh shows correct data  
❌ Auto real-time update not working for assignments  

## Workaround
Add a "Refresh" button on the Leads page that reloads data without full page refresh.