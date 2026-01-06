import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { leadId, userId } = await req.json();

    if (!leadId || !userId) {
      return NextResponse.json(
        { error: 'leadId and userId are required' },
        { status: 400 }
      );
    }

    // Update lead assignment
    const { error } = await supabase
      .from('leads')
      .update({
        assigned_to: userId,
        status: 'contacted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .is('assigned_to', null);

    if (error) throw error;

    // Log activity
    await supabase.from('activities').insert([
      {
        user_id: userId,
        lead_id: leadId,
        type: 'status_change',
        details: 'Lead accepted and assigned',
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Accept lead error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept lead' },
      { status: 500 }
    );
  }
}
