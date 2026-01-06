import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password, name, role, phone } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'team'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // For team members, phone is required and password defaults to phone
    if (role === 'team' && !phone) {
      return NextResponse.json({ error: "Phone number is required for team members" }, { status: 400 });
    }

    // Set password: admin uses provided password, team uses phone number
    const finalPassword = role === 'admin' ? (password || '704331') : phone;

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const existingUser = users.find(u => u.email === email);
    let userId = existingUser?.id;

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: finalPassword,
        user_metadata: { name, role, phone }
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: {
          name,
          role,
          phone,
        },
      });

      if (authError) {
        console.error("Auth error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      if (!authData.user) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
      }
      userId = authData.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID missing" }, { status: 500 });
    }

    // 2. Create or Update user record in database
    const { error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email,
        name,
        role: role as 'admin' | 'team',
        status: 'Active',
        password_hash: "managed_by_supabase_auth",
        phone: phone || null,
      } as any);

    if (dbError) {
      console.error("Database error:", dbError);
      // If it was a new user, we might want to rollback, but let's keep it simple
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      id: userId,
      email: email 
    });
  } catch (error: any) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

