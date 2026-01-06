import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Database } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, name, role, phone } = await request.json();

    if (!email || !name || !role || !phone) {
      return NextResponse.json({ error: "Missing required fields (email, name, role, phone)" }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'team'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Phone number is required for login for ALL users (admin and team)
    // Password is always the phone number for universal phone login
    const finalPassword = phone;

    // 1. Check if user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("List users error:", listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const existingUser = users.find(u => u.email === email);
    let userId = existingUser?.id;

    if (existingUser) {
      // Update existing user - update password to phone number
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password: finalPassword,
        user_metadata: { name, role, phone }
      });

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    } else {
      // Create new user with phone as password
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
        console.error("Auth creation error:", authError);
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
    // Try with phone first
    let dbError = (await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email,
        name,
        role: role as 'admin' | 'team',
        status: 'Active',
        password_hash: "managed_by_supabase_auth",
        phone: phone || null,
      } as any)).error;

    // If phone column error, try without phone
    if (dbError && (dbError.message?.includes('phone') || dbError.code === '42703')) {
      console.log("Phone column not in cache, trying without phone...");
      dbError = (await supabaseAdmin
        .from("users")
        .upsert({
          id: userId,
          email,
          name,
          role: role as 'admin' | 'team',
          status: 'Active',
          password_hash: "managed_by_supabase_auth",
        } as any)).error;
      
      // If successful without phone, try to add phone separately
      if (!dbError) {
        console.log("User created, attempting to add phone separately...");
        try {
          await (supabaseAdmin.from("users") as any).update({ phone }).eq("id", userId);
        } catch (e) {
          console.log("Could not add phone, but user created successfully");
        }
      }
    }

    if (dbError) {
      console.error("Database error:", dbError);
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

