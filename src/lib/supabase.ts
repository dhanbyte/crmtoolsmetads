import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'team';
  status?: 'Active' | 'Inactive';
  password_hash: string;
  phone?: string | null;
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
  notes?: string | null;
  created_at: string;
  updated_at: string;
  next_follow_up?: string | null;
  last_contacted_at?: string | null;
  last_activity_type?: string | null;
  interest?: string | null;
  questions?: any | null;
  follow_up_notes?: string | null;
  city?: string | null;
  follow_up_date?: string | null;
  external_id?: string | null;
  ad_campaign?: string | null;
  platform_data?: any | null;
}

export interface Activity {
  id: string;
  user_id: string;
  lead_id: string | null;
  type: 'call' | 'whatsapp' | 'note' | 'status_change' | 'creation';
  details: string | null;
  created_at: string;
}

export interface GlobalSetting {
  key: string;
  value: any;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  sync_started_at: string;
  sync_completed_at: string | null;
  imported_count: number;
  updated_count: number;
  error_count: number;
  total_processed: number;
  status: 'running' | 'success' | 'failed' | 'partial';
  error_message: string | null;
  sync_type: 'manual' | 'auto';
  created_at: string;
}

// Database schema types
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
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Activity, 'id' | 'created_at'>>;
      };
      global_settings: {
        Row: GlobalSetting;
        Insert: Omit<GlobalSetting, 'updated_at'> & { updated_at?: string };
        Update: Partial<GlobalSetting>;
      };
      sync_logs: {
        Row: SyncLog;
        Insert: Omit<SyncLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          sync_completed_at?: string | null;
        };
        Update: Partial<Omit<SyncLog, 'id' | 'created_at'>>;
      };
    };
  };
};

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);