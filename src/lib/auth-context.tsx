"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: "admin" | "team";
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  role: "admin" | "team" | null;
  loading: boolean;
  signIn: (emailOrPhone: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [role, setRole] = useState<"admin" | "team" | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserData(null);
        setRole(null);
        if (pathname !== "/login" && pathname !== "/setup") {
          router.push("/login");
        }
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        const userData = data as any as UserData;
        setUserData(userData);
        setRole(userData.role);
        
        // Redirect based on role if on login page
        if (pathname === "/login") {
          router.push(userData.role === "admin" ? "/admin/dashboard" : "/team/dashboard");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (emailOrPhone: string, password?: string) => {
    // Detect if input is phone number (contains only digits, spaces, +, -, or ())
    const isPhone = /^[\d\s+\-()]+$/.test(emailOrPhone.trim());

    if (isPhone) {
      // Team member login with phone number
      const cleanPhone = emailOrPhone.replace(/[\s\-()]/g, '');
      
      // Find user by phone number
      const { data: users, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('role', 'team')
        .limit(1);

      if (findError || !users || users.length === 0) {
        throw new Error('Phone number not found or not a team member');
      }

      const teamUser = users[0] as any;

      // Sign in using the user's email with a generated session
      // For team members, we'll use their email but skip password check
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: teamUser.email,
        password: teamUser.phone || cleanPhone, // Use phone as password
      });

      if (signInError) {
        throw new Error('Unable to login with phone number. Please contact admin.');
      }
    } else {
      // Admin login with email and password
      if (!password) {
        throw new Error('Password is required for admin login');
      }

      // Any admin can login with password 704331
      // Try to sign in with the provided credentials
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrPhone,
        password: password,
      });
      
      if (error) {
        throw new Error('Invalid email or password');
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, userData, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
