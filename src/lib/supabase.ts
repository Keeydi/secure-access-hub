import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if values are missing or are placeholders
const isPlaceholderUrl = supabaseUrl.includes('your-project-id') || supabaseUrl.includes('your_supabase_url');
const isPlaceholderKey = supabaseAnonKey.includes('your-anon-key') || supabaseAnonKey.includes('your_anon_key');

if (!supabaseUrl || !supabaseAnonKey || isPlaceholderUrl || isPlaceholderKey) {
  const errorMessage = `
⚠️ Supabase configuration is missing or contains placeholder values!

Please update your .env file in the root of your project with your actual Supabase credentials:
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key

To get your Supabase credentials:
1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key
5. Replace the placeholder values in your .env file
6. Restart your dev server (npm run dev)

Current values detected:
- VITE_SUPABASE_URL: ${supabaseUrl || '(empty)'}
- VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '(empty)'}
  `.trim();
  
  console.error(errorMessage);
  
  // Throw a more helpful error
  throw new Error(
    'Supabase environment variables are not set or contain placeholder values. Please update your .env file with actual Supabase credentials and restart your dev server.'
  );
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

