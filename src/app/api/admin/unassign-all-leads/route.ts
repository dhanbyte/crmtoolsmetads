import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

// Unassign all leads to make them available in pool
export async function POST() {
  try {
    // Unassign all leads
    const { error } = await (supabaseAdmin
      .from("leads") as any)
      .update({ assigned_to: null })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (error) {
      console.error("Error unassigning leads:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count unassigned leads
    const { count } = await supabaseAdmin
      .from("leads")
      .select("*", { count: 'exact', head: true })
      .is('assigned_to', null);

    return NextResponse.json({ 
      success: true, 
      message: `All leads unassigned successfully! ${count} leads now available in pool.`,
      count 
    });

  } catch (error: any) {
    console.error("Unassign all leads error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}