import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CSVLead {
  name: string;
  email: string;
  phone: string;
  source?: string;
  city?: string;
  interest?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string; // 'preview' or 'import'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Required columns
    const requiredColumns = ['name', 'phone'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const leads: CSVLead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const lead: any = {};
      
      headers.forEach((header, index) => {
        lead[header] = values[index] || '';
      });

      // Skip if name or phone is empty
      if (!lead.name || !lead.phone) {
        continue;
      }

      leads.push({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone,
        source: lead.source || 'CSV Upload',
        city: lead.city || '',
        interest: lead.interest || '',
        notes: lead.notes || '',
      });
    }

    if (leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid leads found in CSV' },
        { status: 400 }
      );
    }

    // Check for duplicates
    const phones = leads.map(l => l.phone);
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('phone, name, email')
      .in('phone', phones);

    const existingPhones = new Set((existingLeads || []).map((l: any) => l.phone));
    
    const newLeads = leads.filter(l => !existingPhones.has(l.phone));
    const duplicateLeads = leads.filter(l => existingPhones.has(l.phone));

    // If preview, return stats
    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        data: {
          total: leads.length,
          new: newLeads.length,
          duplicates: duplicateLeads.length,
          newLeads: newLeads.slice(0, 10), // Show first 10 for preview
          duplicateLeads: duplicateLeads.slice(0, 10), // Show first 10 for preview
        }
      });
    }

    // If import, insert new leads
    if (action === 'import') {
      if (newLeads.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No new leads to import (all are duplicates)',
          data: { imported: 0, skipped: duplicateLeads.length }
        });
      }

      const { data, error } = await supabase
        .from('leads')
        .insert(newLeads.map(lead => ({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: 'new' as const,
          source: lead.source,
          city: lead.city,
          interest: lead.interest,
          notes: lead.notes,
          assigned_to: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })));

      if (error) {
        console.error('Import error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${newLeads.length} leads, skipped ${duplicateLeads.length} duplicates`,
        data: {
          imported: newLeads.length,
          skipped: duplicateLeads.length,
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process CSV' },
      { status: 500 }
    );
  }
}