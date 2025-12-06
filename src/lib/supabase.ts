import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'Admin' | 'StandardUser' | 'RestrictedUser';
          mfa_enabled: boolean;
          mfa_secret: string | null;
          totp_enabled: boolean;
          email_otp_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: 'Admin' | 'StandardUser' | 'RestrictedUser';
          mfa_enabled?: boolean;
          mfa_secret?: string | null;
          totp_enabled?: boolean;
          email_otp_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'Admin' | 'StandardUser' | 'RestrictedUser';
          mfa_enabled?: boolean;
          mfa_secret?: string | null;
          totp_enabled?: boolean;
          email_otp_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          refresh_token: string | null;
          expires_at: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          refresh_token?: string | null;
          expires_at: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          refresh_token?: string | null;
          expires_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          ip_address: string | null;
          user_agent: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      otp_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          type: 'email' | 'totp';
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          type: 'email' | 'totp';
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code?: string;
          type?: 'email' | 'totp';
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
      };
      backup_codes: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          used?: boolean;
          created_at?: string;
        };
      };
      failed_login_attempts: {
        Row: {
          id: string;
          email: string;
          ip_address: string | null;
          attempted_at: string;
          success: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          ip_address?: string | null;
          attempted_at?: string;
          success?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          ip_address?: string | null;
          attempted_at?: string;
          success?: boolean;
        };
      };
    };
  };
}

