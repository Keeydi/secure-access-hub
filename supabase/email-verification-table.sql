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

