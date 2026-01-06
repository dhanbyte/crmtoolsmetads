import { supabase } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get("key");
    
    if (!key) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("global_settings")
      .select("value")
      .eq("key", key)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json({ data: data?.value || null });
  } catch (error: any) {
    console.error("Settings get error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();
    
    if (!key || !value) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("global_settings")
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings post error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
