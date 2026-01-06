import { google } from 'googleapis';
import { supabase } from './supabase';

interface GoogleSheetLead {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  is_organic?: string;
  platform?: string;
  product_interest?: string;
  dropshipping_experience?: string;
  phone: string;
  full_name: string;
  email?: string;
  inbox_url?: string;
  lead_status?: string;
}

interface ParsedLead {
  external_id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  interest?: string;
  questions?: any;
  ad_campaign?: string;
  platform_data?: any;
  created_at?: string;
}

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || '';

    if (!serviceAccountEmail || !privateKey || !this.spreadsheetId) {
      throw new Error('Missing Google Sheets credentials in environment variables');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async fetchLeadsFromSheet(): Promise<GoogleSheetLead[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:S', // A to S columns
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return [];
      }

      // First row is headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Map rows to objects
      return dataRows.map((row: any[]) => {
        const lead: any = {};
        headers.forEach((header: string, index: number) => {
          const key = this.normalizeHeaderKey(header);
          lead[key] = row[index] || '';
        });
        return lead as GoogleSheetLead;
      });
    } catch (error: any) {
      console.error('Error fetching from Google Sheets:', error);
      throw new Error(`Failed to fetch leads from Google Sheets: ${error.message}`);
    }
  }

  private normalizeHeaderKey(header: string): string {
    const keyMap: { [key: string]: string } = {
      'id': 'id',
      'created_time': 'created_time',
      'ad_id': 'ad_id',
      'ad_name': 'ad_name',
      'adset_id': 'adset_id',
      'adset_name': 'adset_name',
      'campaign_id': 'campaign_id',
      'campaign_name': 'campaign_name',
      'form_id': 'form_id',
      'form_name': 'form_name',
      'is_organic': 'is_organic',
      'platform': 'platform',
      'aap_product_kahan_sell_karna_chahte_ho?': 'product_interest',
      'dropshipping_experience_kitna_hai?': 'dropshipping_experience',
      'phone': 'phone',
      'full name': 'full_name',
      'email': 'email',
      'inbox_url': 'inbox_url',
      'lead_status': 'lead_status',
    };

    const normalized = keyMap[header.toLowerCase()] || header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return normalized;
  }

  parseLeadForCRM(sheetLead: GoogleSheetLead): ParsedLead {
    // Map lead_status from sheet to CRM status
    const statusMap: { [key: string]: ParsedLead['status'] } = {
      'new': 'new',
      'contacted': 'contacted',
      'qualified': 'qualified',
      'converted': 'converted',
      'lost': 'lost',
      '': 'new', // Default to new if empty
    };

    const status = statusMap[sheetLead.lead_status?.toLowerCase() || ''] || 'new';

    // Build campaign info
    const adCampaign = [sheetLead.campaign_name, sheetLead.ad_name]
      .filter(Boolean)
      .join(' - ') || undefined;

    // Build questions JSON
    const questions: any = {};
    if (sheetLead.product_interest) {
      questions.product_interest = sheetLead.product_interest;
    }
    if (sheetLead.dropshipping_experience) {
      questions.dropshipping_experience = sheetLead.dropshipping_experience;
    }

    // Build platform data
    const platformData: any = {};
    if (sheetLead.ad_id) platformData.ad_id = sheetLead.ad_id;
    if (sheetLead.adset_id) platformData.adset_id = sheetLead.adset_id;
    if (sheetLead.campaign_id) platformData.campaign_id = sheetLead.campaign_id;
    if (sheetLead.form_id) platformData.form_id = sheetLead.form_id;
    if (sheetLead.inbox_url) platformData.inbox_url = sheetLead.inbox_url;
    if (sheetLead.is_organic) platformData.is_organic = sheetLead.is_organic;

    return {
      external_id: sheetLead.id,
      name: sheetLead.full_name || 'Unknown',
      email: sheetLead.email || '',
      phone: sheetLead.phone || '',
      status,
      source: sheetLead.platform || 'Google Sheets Import',
      interest: sheetLead.product_interest || undefined,
      questions: Object.keys(questions).length > 0 ? questions : undefined,
      ad_campaign: adCampaign,
      platform_data: Object.keys(platformData).length > 0 ? platformData : undefined,
      created_at: sheetLead.created_time || undefined,
    };
  }

  async syncLeadsToDatabase(): Promise<{ imported: number; updated: number; errors: number }> {
    const sheetLeads = await this.fetchLeadsFromSheet();
    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const sheetLead of sheetLeads) {
      try {
        // Skip if missing required fields
        if (!sheetLead.phone || !sheetLead.full_name) {
          console.warn(`Skipping lead ${sheetLead.id}: missing required fields`);
          errors++;
          continue;
        }

        const parsedLead = this.parseLeadForCRM(sheetLead);

        // Check if lead already exists by external_id
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('external_id', parsedLead.external_id)
          .single();

        if (existingLead) {
          // Update existing lead
          const { error } = await supabase
            .from('leads')
            .update({
              name: parsedLead.name,
              email: parsedLead.email,
              phone: parsedLead.phone,
              status: parsedLead.status,
              interest: parsedLead.interest,
              questions: parsedLead.questions,
              ad_campaign: parsedLead.ad_campaign,
              platform_data: parsedLead.platform_data,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', (existingLead as any).id);

          if (error) {
            console.error(`Error updating lead ${parsedLead.external_id}:`, error);
            errors++;
          } else {
            updated++;
          }
        } else {
          // Insert new lead
          const { error } = await supabase
            .from('leads')
            .insert({
              ...parsedLead,
              assigned_to: null,
              notes: null,
              created_at: parsedLead.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as any);

          if (error) {
            console.error(`Error inserting lead ${parsedLead.external_id}:`, error);
            errors++;
          } else {
            imported++;
          }
        }
      } catch (error) {
        console.error(`Error processing lead ${sheetLead.id}:`, error);
        errors++;
      }
    }

    return { imported, updated, errors };
  }
}