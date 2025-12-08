# Mailgun Email Service Setup

## ✅ Best Option - No Domain Verification for Sandbox!

Mailgun provides a **sandbox domain** that works immediately without any domain verification!

## Quick Setup (5 minutes)

### Step 1: Create Mailgun Account
1. Go to: https://signup.mailgun.com/new/signup
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your Sandbox Domain (No Verification Needed!)
1. After signup, go to: https://app.mailgun.com/app/sending/domains
2. You'll see a **sandbox domain** like: `sandbox1234567890abcdef.mailgun.org`
3. **Copy this domain** - you'll use it as `MAILGUN_DOMAIN`
4. ✅ **This works immediately!** No DNS setup needed for sandbox

### Step 3: Get API Key
1. Go to: https://app.mailgun.com/app/account/security/api_keys
2. Click **"Create API Key"**
3. Name it (e.g., "SecureAuth Production")
4. **Copy the Private API key** (starts with something like `key-...`)

### Step 4: Add Environment Variables to Vercel

```bash
# Add Mailgun API Key
vercel env add MAILGUN_API_KEY production
# Paste your API key (starts with key-...)

# Add Mailgun Domain (your sandbox domain)
vercel env add MAILGUN_DOMAIN production
# Enter: sandbox1234567890abcdef.mailgun.org (your sandbox domain)

# Add From Email (use your sandbox domain)
vercel env add MAILGUN_FROM_EMAIL production
# Enter: noreply@sandbox1234567890abcdef.mailgun.org (use your sandbox domain)

# Set email service to mailgun
vercel env add VITE_EMAIL_SERVICE production
# Enter: mailgun
```

### Step 5: Remove Old Email Service Variables (Optional)

```bash
vercel env rm SENDGRID_API_KEY production --yes
vercel env rm SENDGRID_FROM_EMAIL production --yes
vercel env rm RESEND_API_KEY production --yes
vercel env rm RESEND_FROM_EMAIL production --yes
```

### Step 6: Redeploy

```bash
vercel --prod
```

## Free Tier Limits

- **5,000 emails/month** (free tier)
- **100 emails/day** limit
- **Sandbox domain works immediately** - no verification needed!
- **Can send to any email address** (sandbox has some restrictions, see below)

## Sandbox Domain Restrictions

The sandbox domain can send to:
- ✅ **Any email address** (no domain verification needed!)
- ⚠️ **Authorized recipients only** - You need to authorize recipient emails first

### Authorize Recipients (Quick Setup)

1. Go to: https://app.mailgun.com/app/sending/domains
2. Click on your sandbox domain
3. Go to **"Authorized Recipients"** tab
4. Click **"Add Recipient"**
5. Add email addresses you want to send to (e.g., test emails)
6. Verify them via email

**OR** - For production, verify your own domain (see below)

## Verify Your Own Domain (Optional - For Production)

If you want to send to unlimited recipients without authorization:

1. Go to: https://app.mailgun.com/app/sending/domains
2. Click **"Add New Domain"**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records to your domain
5. Wait for verification (5-60 minutes)
6. Update `MAILGUN_DOMAIN` to your verified domain
7. Update `MAILGUN_FROM_EMAIL` to `noreply@yourdomain.com`

## Testing

1. Try registering a new account
2. Check your email inbox
3. You should receive the OTP code!

## Troubleshooting

### "Forbidden" error
- Make sure you're using the **Private API key** (not Public)
- Check that `MAILGUN_DOMAIN` matches your sandbox domain exactly

### "Recipient not authorized"
- Add the recipient email in Mailgun dashboard under "Authorized Recipients"
- Or verify your own domain to send to anyone

### "Domain not found"
- Double-check your `MAILGUN_DOMAIN` value
- Make sure it matches exactly (including `.mailgun.org`)

## Benefits Over SendGrid/Resend

✅ **5,000 emails/month** (vs SendGrid's 100/day)  
✅ **Sandbox works immediately** - no sender verification needed  
✅ **More generous free tier**  
✅ **Better for development and testing**

## Upgrade Options

If you need more:
- **Foundation Plan**: $35/month - 50,000 emails
- **Growth Plan**: $80/month - 100,000 emails

