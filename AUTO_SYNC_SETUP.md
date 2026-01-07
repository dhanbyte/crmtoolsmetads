# Auto-Sync Setup Guide

## Overview
The CRM system now includes automatic hourly synchronization with Google Sheets. This guide explains how to set up and monitor the auto-sync functionality.

## Setup Instructions

### 1. Database Migration
Run the updated `supabase_schema.sql` file to create the `sync_logs` table:

```sql
-- This creates the sync_logs table and necessary indexes
-- Run this in your Supabase SQL Editor
```

### 2. Configure Cron Job

#### Option A: Vercel Cron Jobs (Recommended for Vercel deployments)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync-sheets",
    "schedule": "0 * * * *"
  }]
}
```

#### Option B: External Cron Service (e.g., cron-job.org)
1. Visit https://cron-job.org or similar service
2. Create a new cron job
3. URL: `https://your-domain.vercel.app/api/cron/sync-sheets`
4. Schedule: Every hour (0 * * * *)
5. HTTP Method: GET

#### Option C: Platform-specific Cron
- **Netlify**: Use Netlify Functions + scheduled functions
- **Railway**: Use Railway Cron
- **Self-hosted**: Use system crontab

### 3. Verify Setup
1. Navigate to Admin → Sync History
2. Click "Refresh" to view sync logs
3. Check that auto-syncs are running every hour

## Features

### Sync History Dashboard
- **Location**: Admin → Sync History
- **Features**:
  - View all sync logs with date/time filters
  - Today's statistics (syncs, imports, updates)
  - Success rate tracking
  - Manual sync trigger

### Manual vs Auto Sync
- **Manual**: Triggered by admin via "Sync Google Sheets" button
- **Auto**: Runs every hour via cron job
- Both types are logged and tracked separately

## Monitoring

### Daily Statistics
- Total syncs performed today
- Total leads imported today
- Total leads updated today
- Last sync timestamp

### Sync Log Details
Each log includes:
- Start and completion time
- Number of leads imported
- Number of leads updated
- Error count
- Sync type (manual/auto)
- Status (success/failed/partial)

## Troubleshooting

### Auto-sync not running
1. Verify cron job is configured correctly
2. Check environment variables are set
3. View logs in Vercel/hosting platform
4. Test manual sync first

### High error rates
1. Check Google Sheets permissions
2. Verify data format in sheets
3. Review error messages in sync logs

### Missing sync logs
1. Ensure database migration ran successfully
2. Check RLS policies for `sync_logs` table
3. Verify admin role permissions

## API Endpoints

### Manual Sync
```
POST /api/admin/sync-google-sheets
```

### Auto-Sync (Cron)
```
GET /api/cron/sync-sheets
```

## Environment Variables
Ensure these are set:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_SHEET_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Notes
- Auto-sync runs every hour at :00 minutes
- Sync logs are retained indefinitely (consider adding cleanup job)
- Failed syncs are retried on next scheduled run
- Manual syncs can be triggered anytime regardless of schedule