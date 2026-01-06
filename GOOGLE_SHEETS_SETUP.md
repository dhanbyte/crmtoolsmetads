# Google Sheets Integration Setup Guide

This guide will help you set up automatic lead import from Google Sheets into your CRM.

## Prerequisites

- Google Cloud account
- Access to your Google Sheet with leads
- Admin access to your CRM

---

## Step 1: Run Database Migration

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `update_leads_for_google_sheets.sql`
3. Click "Run" to execute the migration
4. Verify success message appears

---

## Step 2: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it: "LEADS-CRM-Integration"
4. Click "Create"

---

## Step 3: Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

---

## Step 4: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in details:
   - Name: `leads-sync`
   - Description: "Service account for CRM lead sync"
4. Click "Create and Continue"
5. Skip optional steps, click "Done"

---

## Step 5: Generate Service Account Key

1. In "Credentials", click on your newly created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - a JSON file will be downloaded

---

## Step 6: Extract Credentials from JSON

Open the downloaded JSON file. You'll need two values:

```json
{
  "client_email": "leads-sync@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n..."
}
```

---

## Step 7: Share Google Sheet with Service Account

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1T6CbN3YoNm-aU2PiJkiBoiPGkNQ8Yc9wQp_wvzDBfC0/edit
2. Click "Share" button
3. Paste the `client_email` from JSON file
4. Set permission to "Viewer"
5. Uncheck "Notify people"
6. Click "Share"

---

## Step 8: Add Environment Variables

Add these to your `.env.local` file:

```env
# Google Sheets Integration
GOOGLE_SHEET_ID=1T6CbN3YoNm-aU2PiJkiBoiPGkNQ8Yc9wQp_wvzDBfC0
GOOGLE_SERVICE_ACCOUNT_EMAIL=leads-sync@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nMulti\nLine\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- Keep the quotes around `GOOGLE_PRIVATE_KEY`
- Keep the `\n` characters in the private key
- Don't add extra spaces or line breaks

---

## Step 9: Install Required Package

```bash
npm install googleapis
```

---

## Step 10: Restart Your Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Step 11: Test the Integration

1. Login to your CRM as Admin
2. Go to "All Leads" page
3. You should see a blue "Sync Google Sheets" button
4. Click it to test the sync
5. Check if leads are imported successfully

---

## Column Mapping

Your Google Sheet columns map to CRM fields as follows:

| Google Sheet Column | CRM Field | Notes |
|-------------------|-----------|-------|
| id | external_id | Unique identifier |
| created_time | created_at | Lead creation date |
| phone | phone | Contact number |
| full name | name | Lead name |
| email | email | Email address |
| platform | source | Lead source (Facebook/Instagram) |
| lead_status | status | new/contacted/qualified/converted/lost |
| ad_name | ad_campaign | Campaign information |
| aap_product_kahan_sell_karna_chahte_ho? | interest | Product interest |
| dropshipping_experience_kitna_hai? | questions (JSON) | Experience level |

---

## Troubleshooting

### "Missing Google Sheets credentials" error
- Verify all three environment variables are set correctly
- Check for extra spaces or quotes in `.env.local`
- Restart the dev server after adding variables

### "Permission denied" error
- Make sure you shared the Google Sheet with the service account email
- Verify the service account has "Viewer" permission
- Check the Google Sheet ID is correct

### "Private key invalid" error
- Ensure the private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep all `\n` characters in the key
- Make sure the entire key is wrapped in double quotes

### No sync button appears
- Check browser console for errors
- Verify environment variables are set
- Restart the development server

---

## Manual Sync Schedule (Optional)

If you want to auto-sync every few minutes, you can use a cron job or scheduled task.

### Using Vercel Cron (Production)
Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/admin/sync-google-sheets",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This will sync every 5 minutes in production.

---

## Security Best Practices

1. ✅ Never commit `.env.local` to Git
2. ✅ Keep service account keys secure
3. ✅ Use "Viewer" permission only (not "Editor")
4. ✅ Rotate keys periodically
5. ✅ Monitor sync logs for errors

---

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase logs
3. Verify all environment variables are correct
4. Ensure database migration ran successfully

---

## Success Checklist

- [ ] Database migration completed
- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] Service account key downloaded
- [ ] Google Sheet shared with service account
- [ ] Environment variables added to `.env.local`
- [ ] `googleapis` package installed
- [ ] Development server restarted
- [ ] Sync button appears in CRM
- [ ] Test sync completed successfully

---

Congratulations! Your Google Sheets integration is now set up. 🎉