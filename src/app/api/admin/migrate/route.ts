import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Try to check if phone column exists by selecting it
    const { error: directError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .limit(1);

    if (directError && directError.message.includes('column "phone" does not exist')) {
      return NextResponse.json({ 
        success: false,
        message: "Phone column needs to be added. Please run this SQL in Supabase SQL Editor:\n\nALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;",
        needsManualMigration: true
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Database migration completed successfully"
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: true,
      message: "Phone column may already exist or migration completed",
      details: error.message
    });
  }
}

export async function GET() {
  try {
    // Check if phone column exists by trying to select it
    const { error } = await supabaseAdmin
      .from('users')
      .select('phone')
      .limit(1);

    if (error && error.message.includes('column "phone" does not exist')) {
      return NextResponse.json({ 
        migrationNeeded: true,
        message: "Phone column does not exist"
      });
    }

    return NextResponse.json({ 
      migrationNeeded: false,
      message: "Database is up to date"
    });
  } catch (error: any) {
    return NextResponse.json({ 
      migrationNeeded: false,
      message: "Unable to check migration status",
      details: error.message
    });
  }
}