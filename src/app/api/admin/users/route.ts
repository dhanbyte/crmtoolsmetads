import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/supabase";

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    console.log(`Starting deletion for user: ${id}`);

    // 1. Check if user exists in DB
    const { data: userRecord, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", id)
      .single();

    if (fetchError || !userRecord) {
      console.error("User not found in DB:", fetchError);
      // Even if not in DB, try to delete from Auth just in case
    }

    // 2. Delete from Auth first
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
       console.error("Auth delete error (continuing anyway):", authError);
    }

    // 3. MANUAL CLEANUP (Bypass FK constraints if CASCADE isn't set)
    
    // a. Delete activities for this user
    const { error: actError } = await (supabaseAdmin
      .from("activities")
      .delete() as any)
      .eq("user_id", id);
    if (actError) console.error("Error cleaning up activities:", actError);

    // b. Unassign leads from this user
    const { error: leadError } = await (supabaseAdmin
      .from("leads") as any)
      .update({ assigned_to: null })
      .eq("assigned_to", id);
    if (leadError) console.error("Error unassigning leads:", leadError);

    // 4. Delete from DB users table
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Database user delete error:", dbError);
      return NextResponse.json({ 
        error: `Database error: ${dbError.message}`,
        details: dbError 
      }, { status: 500 });
    }

    console.log(`Successfully deleted user ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Fatal User delete error:", error);
    return NextResponse.json({ 
      error: error.message || "An unexpected error occurred during deletion",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
