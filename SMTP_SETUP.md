# SMTP Email Service Setup

This guide will help you configure the custom SMTP email service for Secure Access Hub.

## Overview

The system now uses a custom SMTP-based email service that works with **any SMTP provider**:
- Gmail
- Outlook/Office 365
- Yahoo Mail
- Custom SMTP servers
- Any email service that supports SMTP

## Step 1: Choose Your SMTP Provider

### Option A: Gmail (Free, Easy Setup)

1. **Enable 2-Step Verification** on your Google account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password

**Gmail SMTP Settings:**
- Host: `smtp.gmail.com`
- Port: `587`
- Secure: `false` (uses STARTTLS)
- User: Your Gmail address
- Password: App password (16 characters)

### Option B: Outlook/Office 365

1. Use your Microsoft account email
2. Enable "Less secure app access" or use App Password

**Outlook SMTP Settings:**
- Host: `smtp.office365.com`
- Port: `587`
- Secure: `false` (uses STARTTLS)
- User: Your Outlook email
- Password: Your password or app password

### Option C: Custom SMTP Server

Use your own SMTP server or email hosting provider. Common settings:
- Port `587` for STARTTLS (recommended)
- Port `465` for SSL
- Port `25` for unencrypted (not recommended)

## Step 2: Configure Environment Variables in Vercel

Go to your Vercel project dashboard:
**Settings** → **Environment Variables** → **Add New**

### Required Variables

```bash
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Secure Access Hub
```

### Variable Descriptions

- **SMTP_HOST**: Your SMTP server hostname
  - Gmail: `smtp.gmail.com`
  - Outlook: `smtp.office365.com`
  - Custom: Your provider's SMTP hostname

- **SMTP_PORT**: SMTP server port
  - `587` for STARTTLS (recommended)
  - `465` for SSL
  - `25` for unencrypted (not recommended)

- **SMTP_SECURE**: Use SSL
  - `true` for port 465
  - `false` for port 587 (uses STARTTLS)

- **SMTP_USER**: SMTP username (usually your email address)

- **SMTP_PASS**: SMTP password
  - For Gmail: Use App Password (16 characters)
  - For Outlook: Use your password or app password
  - For custom: Use your SMTP password

- **SMTP_FROM_EMAIL**: Sender email address (usually same as SMTP_USER)

- **SMTP_FROM_NAME**: Display name for sender (optional, defaults to "Secure Access Hub")

### Frontend Variable

```bash
VITE_EMAIL_SERVICE=smtp
```

## Step 3: Add Variables via Vercel CLI (Alternative)

```bash
# SMTP Configuration
vercel env add SMTP_HOST production
# Enter: smtp.gmail.com (or your SMTP host)

vercel env add SMTP_PORT production
# Enter: 587

vercel env add SMTP_SECURE production
# Enter: false

vercel env add SMTP_USER production
# Enter: your-email@gmail.com

vercel env add SMTP_PASS production
# Enter: your-app-password (will be hidden)

vercel env add SMTP_FROM_EMAIL production
# Enter: your-email@gmail.com

vercel env add SMTP_FROM_NAME production
# Enter: Secure Access Hub (optional)

# Frontend Configuration
vercel env add VITE_EMAIL_SERVICE production
# Enter: smtp
```

## Step 4: Redeploy

After adding all environment variables, redeploy your application:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## Step 5: Test Email Sending

1. Go to your deployed application
2. Try registering a new user
3. Check the email inbox for the verification code
4. If emails don't arrive, check Vercel function logs

## Troubleshooting

### Error: "SMTP authentication failed"

**Solution:**
- For Gmail: Make sure you're using an **App Password**, not your regular password
- For Outlook: Enable "Less secure app access" or use App Password
- Double-check your `SMTP_USER` and `SMTP_PASS` values

### Error: "Could not connect to SMTP server"

**Solution:**
- Verify `SMTP_HOST` is correct
- Check `SMTP_PORT` matches your provider's requirements
- Ensure your firewall/network allows SMTP connections

### Emails Not Arriving

**Check:**
1. Vercel function logs for errors
2. Spam/junk folder
3. SMTP credentials are correct
4. `SMTP_FROM_EMAIL` matches your SMTP account

### Gmail App Password Not Working

**Steps:**
1. Make sure 2-Step Verification is enabled
2. Generate a new App Password
3. Use the 16-character password (no spaces)
4. Wait a few minutes after generating (can take time to activate)

## Common SMTP Providers

### Gmail
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Outlook/Office 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo Mail
```
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Zoho Mail
```
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_SECURE=false
```

## Security Notes

1. **Never commit** SMTP credentials to Git
2. **Use App Passwords** instead of main passwords when possible
3. **Rotate passwords** regularly
4. **Monitor** email sending for suspicious activity
5. **Use environment variables** in Vercel (never hardcode)

## Production Recommendations

1. **Use a dedicated email account** for sending (not your personal email)
2. **Set up SPF/DKIM records** if using a custom domain
3. **Monitor email deliverability** and reputation
4. **Consider rate limiting** to prevent abuse
5. **Use a transactional email service** (SendGrid, Mailgun, etc.) for high volume

## Support

If you encounter issues:
1. Check Vercel function logs: `vercel logs`
2. Verify all environment variables are set correctly
3. Test SMTP connection with a tool like `telnet` or `openssl`
4. Contact your email provider's support for SMTP-specific issues

