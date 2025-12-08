# Resend Email Service Setup

## Current Status: Test Mode

Your Resend account is currently in **test mode**, which means:
- ✅ You can send emails to your verified email: `darnaylakarl@gmail.com`
- ❌ You **cannot** send emails to other recipients

## Error Message
```
You can only send testing emails to your own email address (darnaylakarl@gmail.com). 
To send emails to other recipients, please verify a domain at resend.com/domains, 
and change the `from` address to an email using this domain.
```

## Solution: Verify Your Domain

To send emails to **any recipient**, you need to verify a domain in Resend:

### Step 1: Go to Resend Domains
1. Visit: https://resend.com/domains
2. Click **"Add Domain"**

### Step 2: Add Your Domain
1. Enter your domain (e.g., `yourdomain.com`)
2. Resend will provide DNS records to add

### Step 3: Add DNS Records
Add these DNS records to your domain provider:
- **SPF Record** (TXT)
- **DKIM Records** (TXT)
- **DMARC Record** (TXT) - Optional but recommended

### Step 4: Verify Domain
1. Wait for DNS propagation (usually 5-60 minutes)
2. Resend will verify your domain automatically
3. Once verified, you can use emails like `noreply@yourdomain.com`

### Step 5: Update Environment Variables

After domain verification, update in Vercel:
```bash
vercel env update RESEND_FROM_EMAIL production
# Enter: noreply@yourdomain.com (or your verified domain email)
```

## Temporary Workaround (Current Implementation)

The code now includes a workaround:
- In test mode, emails are redirected to `darnaylakarl@gmail.com`
- The original recipient is shown in the email subject/body
- This allows you to test the system while setting up domain verification

## Alternative: Use a Different Email Service

If you don't want to verify a domain, consider:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very affordable, requires AWS account)
- **Postmark** (paid, but reliable)

## Quick Test

To test if emails are working:
1. Try registering with email: `darnaylakarl@gmail.com`
2. You should receive the OTP email
3. For other emails, check `darnaylakarl@gmail.com` (test mode redirect)

