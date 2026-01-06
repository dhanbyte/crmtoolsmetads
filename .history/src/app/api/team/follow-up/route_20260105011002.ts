import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { leadId, userId, nextFollowUp, notes } = await req.json();

    if (!leadId || !userId) {
      return NextResponse.json(
        { error: 'leadId and userId are required' },
        { status: 400 }
      );
    }

    // Update lead follow-up
    const { error } = await supabase
      .from('leads')
      .update({
        next_follow_up: nextFollowUp,
        follow_up_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (error) throw error;

    // Log activity
    await supabase.from('activities').insert([
      {
        user_id: userId,
        lead_id: leadId,
        type: 'note',
        details: `Scheduled follow-up: ${notes}`,
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update follow-up error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update follow-up' },
      { status: 500 }
    );
  }
}
