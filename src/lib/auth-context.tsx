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
  signIn: (phoneNumber: string) => Promise<void>;
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

  const signIn = async (phoneNumber: string) => {
    try {
      // Clean phone number - remove spaces, dashes, parentheses
      const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
      
      // Validate phone number format
      if (!/^\d+$/.test(cleanPhone)) {
        throw new Error('Please enter a valid phone number');
      }

      // 🔥 HARDCODED PHONE-TO-EMAIL MAPPING
      // Since phone column doesn't exist in database, we map phones to emails here
      const phoneToEmailMap: Record<string, { email: string; password: string }> = {
        '9157499884': { email: 'admin@crmpro.com', password: '704331' },
        // Add more users here as needed
        // '9876543210': { email: 'team1@crmpro.com', password: '9876543210' },
      };

      // Check hardcoded mapping first
      if (phoneToEmailMap[cleanPhone]) {
        const credentials = phoneToEmailMap[cleanPhone];
        console.log('Using hardcoded credentials for phone:', cleanPhone);
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (!signInError) {
          return; // Success!
        }
        
        // Try with phone as password too
        const { error: signInError2 } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: cleanPhone,
        });

        if (!signInError2) {
          return; // Success!
        }
      }

      // Fallback: Try to find ALL users and match by attempting login
      console.log('Trying to find user in database...');
      const { data: allUsers } = await supabase
        .from('users')
        .select('*');

      if (allUsers && allUsers.length > 0) {
        // Try logging in with each user using phone as password
        for (const user of allUsers) {
          const { error } = await supabase.auth.signInWithPassword({
            email: (user as any).email,
            password: cleanPhone,
          });

          if (!error) {
            console.log('Login successful with user:', (user as any).email);
            return; // Success!
          }
        }
      }

      throw new Error('Phone number not found. Please contact admin to add your phone number.');

    } catch (error: any) {
      console.error('Detailed Login error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      if (error.message === 'Failed to fetch') {
        throw new Error('Connection failed. Please check if Supabase is reachable and your internet connection is active.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local state
      setUser(null);
      setUserData(null);
      setRole(null);
      
      // Force redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even if error
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
