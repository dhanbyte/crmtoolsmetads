import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'team';
  status?: 'Active' | 'Inactive'; // Made optional as it might not be in auth.users metadata, but in users table
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  next_follow_up?: string | null;
  last_contacted_at?: string | null;
  last_activity_type?: string | null;
  interest?: string | null;
  questions?: any | null;
  follow_up_notes?: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  lead_id: string | null;
  type: 'call' | 'whatsapp' | 'note' | 'status_change' | 'creation';
  details: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          assigned_to?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
    };
  };
};

