# Email Verification Setup Guide

## Overview
Registration now requires email verification via OTP before the account is created in the database.

## New Registration Flow

1. **User fills registration form** (email, password, confirm password)
2. **OTP code is sent to email** (stored temporarily with hashed password)
3. **User enters 6-digit OTP code**
4. **Account is created** only after OTP verification
5. **Success toast shown** and redirect to login page

## Database Setup

### Step 1: Create Email Verification OTP Table

Run this SQL in your Supabase SQL Editor:

1. Go to: https://app.supabase.com/project/kkdggbgavwbffxvdgtzy/sql/new
2. Open the file `supabase/email-verification-table.sql`
3. Copy all the SQL
4. Paste and run it in Supabase SQL Editor

This creates:
- `email_verification_otps` table to store OTP codes temporarily
- RLS policies to allow anon access
- Indexes for performance
- Cleanup function for expired OTPs

### Step 2: Verify RLS Policies

Make sure you've also run `supabase/schema-rls-fix.sql` to allow the anon key to:
- Read/write to `email_verification_otps` table
- Create users after verification

## How It Works

### Step 1: Send OTP
- User submits registration form
- Password is hashed
- OTP code is generated (6 digits)
- OTP + password hash stored in `email_verification_otps` table
- Email sent with OTP code
- User sees verification screen

### Step 2: Verify OTP
- User enters 6-digit code
- Code is verified against database
- If valid and not expired:
  - Password hash is retrieved
  - User account is created
  - OTP is marked as used
  - Success toast shown
  - Redirect to login page

## Security Features

- ✅ OTP expires after 2 minutes
- ✅ OTP can only be used once
- ✅ Password hash stored securely (bcrypt)
- ✅ Account only created after email verification
- ✅ Prevents duplicate registrations

## Resend Code

Users can click "Didn't receive code? Resend" to get a new OTP code. The old code will be invalidated.

## Development vs Production

### Development (Current)
- Uses mock email service (logs to console)
- OTP code visible in browser console
- For testing: Check console for OTP code

### Production
Update `src/lib/email-otp.ts` to use a real email service:
- SendGrid
- AWS SES
- SMTP
- Mailgun

## Troubleshooting

### OTP Not Received
- Check browser console (development mode)
- Verify email service is configured (production)
- Check spam folder

### "Invalid or expired code"
- Code may have expired (2 minutes)
- Code may have been used already
- Try resending code

### Database Errors
- Make sure `email_verification_otps` table exists
- Verify RLS policies are set correctly
- Check Supabase logs for errors

