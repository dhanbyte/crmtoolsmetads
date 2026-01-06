import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .is('assigned_to', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Fetch pool leads error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pool leads' },
      { status: 500 }
    );
  }
}
