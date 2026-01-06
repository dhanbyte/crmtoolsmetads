import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = 'force-dynamic';

// This route creates a default admin user for easy setup
export async function POST() {
  try {
    const adminEmail = "admin@crmpro.com";
    const adminPhone = "9157499884";
    const adminPassword = adminPhone; // Phone is the password
    const adminName = "Admin User";

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingUsers) {
      // Update existing admin with phone
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        (existingUsers as any).id,
        { password: adminPassword }
      );

      if (updateAuthError) {
        console.error("Update auth error:", updateAuthError);
      }

      const { error: updateDbError } = await (supabaseAdmin
        .from('users') as any)
        .update({ phone: adminPhone })
        .eq('id', (existingUsers as any).id);

      if (updateDbError) {
        console.error("Update DB error:", updateDbError);
        return NextResponse.json({ error: updateDbError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Admin user updated with phone number",
        email: adminEmail,
        phone: adminPhone
      });
    }

    // Create new admin user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: adminName,
        role: 'admin',
        phone: adminPhone,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create admin user" }, { status: 500 });
    }

    // Create admin user in database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'admin',
        status: 'Active',
        password_hash: 'managed_by_supabase_auth',
        phone: adminPhone,
      } as any);

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Default admin user created successfully!",
      email: adminEmail,
      phone: adminPhone,
      instructions: "Login with phone: 9157499884"
    });

  } catch (error: any) {
    console.error("Setup admin error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}