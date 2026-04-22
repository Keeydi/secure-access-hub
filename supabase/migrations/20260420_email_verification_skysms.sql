-- SkySMS registration: store phone and delivery channel
ALTER TABLE email_verification_otps
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS otp_delivery VARCHAR(20) NOT NULL DEFAULT 'email';

-- Internal placeholder for SkySMS rows must fit (UUID without dashes, etc.)
ALTER TABLE email_verification_otps
  ALTER COLUMN code TYPE VARCHAR(40);

COMMENT ON COLUMN email_verification_otps.otp_delivery IS 'email = app-generated code in DB; skysms = OTP from SkySMS API';
COMMENT ON COLUMN email_verification_otps.phone_number IS 'E.164 mobile when otp_delivery is skysms';
