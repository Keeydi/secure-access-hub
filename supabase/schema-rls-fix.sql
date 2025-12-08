-- RLS Policy Fixes for Custom Authentication
-- Run this SQL in your Supabase SQL Editor to fix 401/406 errors
-- This allows the anon key to perform necessary operations for custom JWT authentication

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Allow anon role to read users (needed for login/registration)
CREATE POLICY "Allow anon to read users for auth" ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon role to insert users (for registration)
CREATE POLICY "Allow anon to insert users" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon role to update users (for MFA setup, etc.)
CREATE POLICY "Allow anon to update users" ON users
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SESSIONS TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage sessions" ON sessions;
DROP POLICY IF EXISTS "Allow anon to manage sessions" ON sessions;

-- Allow anon role to manage sessions (create, read, update, delete)
CREATE POLICY "Allow anon to manage sessions" ON sessions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anon to insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Allow anon to read audit logs" ON audit_logs;

-- Allow anon role to insert audit logs
CREATE POLICY "Allow anon to insert audit logs" ON audit_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon role to read audit logs
CREATE POLICY "Allow anon to read audit logs" ON audit_logs
  FOR SELECT
  TO anon
  USING (true);

-- ============================================
-- OTP CODES TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "Allow anon to manage otp codes" ON otp_codes;

-- Allow anon role to manage OTP codes
CREATE POLICY "Allow anon to manage otp codes" ON otp_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- BACKUP CODES TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage backup_codes" ON backup_codes;
DROP POLICY IF EXISTS "Allow anon to manage backup codes" ON backup_codes;

-- Allow anon role to manage backup codes
CREATE POLICY "Allow anon to manage backup codes" ON backup_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FAILED LOGIN ATTEMPTS TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage failed_login_attempts" ON failed_login_attempts;
DROP POLICY IF EXISTS "Allow anon to manage failed login attempts" ON failed_login_attempts;

-- Allow anon role to manage failed login attempts
CREATE POLICY "Allow anon to manage failed login attempts" ON failed_login_attempts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PASSWORD RESET TOKENS TABLE POLICIES
-- ============================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role can manage password_reset_tokens" ON password_reset_tokens;
DROP POLICY IF EXISTS "Allow anon to manage password reset tokens" ON password_reset_tokens;

-- Allow anon role to manage password reset tokens
CREATE POLICY "Allow anon to manage password reset tokens" ON password_reset_tokens
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify policies were created (optional - you can run this to check)
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
