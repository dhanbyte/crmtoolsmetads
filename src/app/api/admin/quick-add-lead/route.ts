import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { name, phone } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Only save essential fields to avoid schema cache errors
    const leadData = {
      name: name || `Lead ${phone.slice(-4)}`,
      phone: phone,
      email: `lead${phone.replace(/\+/g, '')}@temp.com`,
      source: "Quick Add",
      status: "new",
      assigned_to: null,
    };

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert([leadData] as any)
      .select()
      .single();

    if (error) {
      console.error("Quick add error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Quick add API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
