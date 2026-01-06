import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // 1. Delete from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
       console.error("Auth delete error:", authError);
       // Ignore if user doesn't exist in auth but exists in DB
    }

    // 2. Delete from DB
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
