# Custom Email Setup Guide

This guide explains how to set up custom email sending using SMTP (your own email server) instead of third-party APIs like Resend.

## Options Available

### 1. **SMTP (Custom Email Server)** - Recommended for Custom Setup
- Use your own email server (Gmail, Outlook, custom SMTP)
- Full control over email delivery
- No third-party API dependencies
- Free with most email providers

### 2. **Resend API** - Third-party Service
- Simple API-based email sending
- Requires Resend account and API key
- Good for quick setup

## Setting Up Custom SMTP (Recommended)

### Step 1: Choose Your Email Provider

**Option A: Gmail**
- SMTP Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)
- Requires: App-specific password (not your regular password)

**Option B: Outlook/Office 365**
- SMTP Host: `smtp.office365.com`
- Port: `587`
- Requires: Your email and password

**Option C: Custom SMTP Server**
- Use your own email server settings
- Contact your email provider for SMTP details

### Step 2: Get SMTP Credentials

#### For Gmail:
1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Go to "App passwords"
4. Generate a new app password for "Mail"
5. Use this app password (not your regular password)

#### For Outlook:
1. Use your regular email and password
2. Make sure "Less secure app access" is enabled (if needed)

### Step 3: Set Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=SecureAuth
```

**For Gmail with SSL:**
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=SecureAuth
```

**For Outlook:**
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM_EMAIL=your-email@outlook.com
SMTP_FROM_NAME=SecureAuth
```

### Step 4: Update Frontend Configuration

In your `.env` file (for local development):
```env
VITE_EMAIL_SERVICE=smtp
VITE_EMAIL_API_ENDPOINT=/api/send-email
```

For production (Vercel), the endpoint will automatically be `/api/send-email`.

### Step 5: Redeploy

After setting environment variables in Vercel:
1. Go to Deployments
2. Click the three dots on the latest deployment
3. Select "Redeploy"

## Testing Your Setup

1. Try registering a new user
2. Check if the OTP email is received
3. Check Vercel function logs for any errors

## Troubleshooting

### "SMTP authentication failed"
- **Gmail**: Make sure you're using an app-specific password, not your regular password
- **Outlook**: Check if "Less secure app access" is enabled
- Verify your credentials are correct

### "Could not connect to SMTP server"
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify your firewall/network allows SMTP connections
- Try different ports (587 for TLS, 465 for SSL)

### "Connection timeout"
- Check if your email provider blocks connections from Vercel
- Some providers require IP whitelisting
- Consider using a different email provider

## Security Best Practices

1. **Never commit credentials** - Always use environment variables
2. **Use app-specific passwords** - Don't use your main account password
3. **Enable 2FA** - Protect your email account
4. **Rotate passwords** - Change app passwords periodically
5. **Monitor usage** - Check email logs regularly

## Switching Between SMTP and Resend

To switch email services, just change the `EMAIL_SERVICE` environment variable:

- `EMAIL_SERVICE=smtp` → Uses custom SMTP
- `EMAIL_SERVICE=resend` → Uses Resend API

The function will automatically use the correct service based on this variable.

## Example: Complete Gmail Setup

```env
# Vercel Environment Variables
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourapp@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Your Gmail app password
SMTP_FROM_EMAIL=yourapp@gmail.com
SMTP_FROM_NAME=SecureAuth
```

```env
# Local .env file
VITE_EMAIL_SERVICE=smtp
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

## Need Help?

- Check Vercel function logs for detailed error messages
- Verify all environment variables are set correctly
- Test SMTP connection using a tool like `telnet` or email testing tools
- Contact your email provider's support for SMTP configuration help

