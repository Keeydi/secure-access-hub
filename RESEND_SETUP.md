# Resend Email Service Setup - REQUIRED FOR SIGN-UPS

## ⚠️ IMPORTANT: Domain Verification Required

Your Resend account is currently in **test mode**, which **prevents sign-ups from working** because:
- ✅ You can only send emails to your verified email: `darnaylakarl@gmail.com`
- ❌ You **cannot** send OTP emails to users signing up with other email addresses

**This means users cannot complete registration!**

## Solution: Verify Your Domain (REQUIRED)

To enable sign-ups and send emails to **any recipient**, you **MUST** verify a domain in Resend:

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

## Quick Setup Steps (5-10 minutes)

1. **Get a domain** (if you don't have one):
   - Use a free domain from Freenom, or
   - Buy a cheap domain ($1-10/year from Namecheap, GoDaddy, etc.)

2. **Verify domain in Resend**:
   - Go to https://resend.com/domains
   - Click "Add Domain"
   - Add DNS records to your domain
   - Wait for verification (5-60 minutes)

3. **Update Vercel environment variable**:
   ```bash
   vercel env update RESEND_FROM_EMAIL production
   # Enter: noreply@yourdomain.com
   ```

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Alternative: Use a Different Email Service (If you don't have a domain)

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

