-- SMS MFA (sign-in): store verified PH mobile on user when SMS OTP MFA is enabled.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_phone_number VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS sms_otp_enabled BOOLEAN NOT NULL DEFAULT FALSE;
