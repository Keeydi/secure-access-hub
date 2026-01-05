-- ============================================
-- COMPLETE DATABASE SETUP FOR SECURE ACCESS HUB
-- ============================================
-- Run this entire file in Supabase SQL Editor to set up your database
-- This includes all tables, indexes, functions, triggers, and RLS policies
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'StandardUser' CHECK (role IN ('Admin', 'StandardUser', 'RestrictedUser')),
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255) NULL,
  totp_enabled BOOLEAN DEFAULT FALSE,
  email_otp_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  refresh_token TEXT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  details JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OTP codes table (for MFA)
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'totp')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup codes table (for MFA recovery)
CREATE TABLE IF NOT EXISTS backup_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failed login attempts table (for rate limiting)
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification OTPs table (for registration)
CREATE TABLE IF NOT EXISTS email_verification_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES (for better performance)
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- OTP codes indexes
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_code ON otp_codes(code);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Backup codes indexes
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_code ON backup_codes(code);

-- Failed login attempts indexes
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);

-- Password reset tokens indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Email verification OTPs indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON email_verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_code ON email_verification_otps(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires_at ON email_verification_otps(expires_at);

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove expired email verification OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_email_verification_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_otps
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at for sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_otps ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES (Allow anon access for custom JWT auth)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Service role can manage sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon to manage sessions" ON sessions;
DROP POLICY IF EXISTS "Service role can manage audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anon to insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anon to read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role can manage otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow anon to manage otp codes" ON otp_codes;
DROP POLICY IF EXISTS "Service role can manage backup_codes" ON backup_codes;
DROP POLICY IF EXISTS "Allow anon to manage backup codes" ON backup_codes;
DROP POLICY IF EXISTS "Service role can manage failed_login_attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Allow anon to manage failed login attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Service role can manage password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow anon to manage password reset tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow anon to manage email verification OTPs" ON email_verification_otps;

-- Users table policies
CREATE POLICY "Allow anon to read users for auth" ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon to insert users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to update users" ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Sessions table policies
CREATE POLICY "Allow anon to manage sessions" ON sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Audit logs table policies
CREATE POLICY "Allow anon to insert audit logs" ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon to read audit logs" ON audit_logs
  FOR SELECT
  TO anon
  USING (true);

-- OTP codes table policies
CREATE POLICY "Allow anon to manage otp codes" ON otp_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Backup codes table policies
CREATE POLICY "Allow anon to manage backup codes" ON backup_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Failed login attempts table policies
CREATE POLICY "Allow anon to manage failed login attempts" ON failed_login_attempts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Password reset tokens table policies
CREATE POLICY "Allow anon to manage password reset tokens" ON password_reset_tokens
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Email verification OTPs table policies
CREATE POLICY "Allow anon to manage email verification OTPs" ON email_verification_otps
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now fully configured with:
-- ✅ All required tables
-- ✅ Performance indexes
-- ✅ Auto-update triggers
-- ✅ Row Level Security enabled
-- ✅ Policies allowing anon access for custom JWT authentication
--
-- Next steps:
-- 1. Verify tables in Table Editor
-- 2. Test your application
-- 3. Create an admin user using: npm run create-admin
-- ============================================

