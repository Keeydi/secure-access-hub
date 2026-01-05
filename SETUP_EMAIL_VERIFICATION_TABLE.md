# Setup Email Verification Table

The `email_verification_otps` table is required for user registration with email verification.

## Quick Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **secretaccess**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase/email-verification-table.sql`
6. Click **Run** (or press Ctrl+Enter)

## Alternative: Copy SQL Here

```sql
-- Email Verification OTP Table
-- This table stores OTP codes for email verification during registration
-- (before the user account is created)

CREATE TABLE IF NOT EXISTS email_verification_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Store hashed password temporarily
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_email ON email_verification_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_code ON email_verification_otps(code);
CREATE INDEX IF NOT EXISTS idx_email_verification_otps_expires_at ON email_verification_otps(expires_at);

-- Enable RLS
ALTER TABLE email_verification_otps ENABLE ROW LEVEL SECURITY;

-- Allow anon role to manage email verification OTPs
CREATE POLICY "Allow anon to manage email verification OTPs" ON email_verification_otps
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Cleanup function to remove expired OTPs (optional - can be run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_email_verification_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_otps
  WHERE expires_at < NOW() OR used = true;
END;
$$ LANGUAGE plpgsql;
```

## Verify Setup

After running the SQL, verify the table was created:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see `email_verification_otps` in the list of tables
3. The table should have these columns:
   - id (UUID)
   - email (VARCHAR)
   - code (VARCHAR)
   - password_hash (VARCHAR)
   - expires_at (TIMESTAMP)
   - used (BOOLEAN)
   - created_at (TIMESTAMP)

## What This Table Does

This table stores temporary OTP codes during user registration:
- User enters email and password
- System generates OTP and stores it here (with hashed password)
- User receives OTP via email
- User enters OTP to verify email
- System creates user account using stored password hash
- OTP is marked as used

This allows email verification **before** creating the user account.

