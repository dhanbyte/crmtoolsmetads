import { supabase } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { leadId, userId, nextFollowUp, notes } = await req.json();
    
    if (!leadId || !userId || !nextFollowUp) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("leads")
      .update({
        next_follow_up: nextFollowUp,
        follow_up_notes: notes || "",
        updated_at: new Date().toISOString()
      })
      .eq("id", leadId);

    if (error) throw error;

    // Log activity
    await supabase.from("activities").insert([{
      user_id: userId,
      lead_id: leadId,
      type: "note",
      details: `Scheduled follow-up: ${notes}`
    }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Follow-up error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
