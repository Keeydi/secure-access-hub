# SendGrid Email Service Setup

## ✅ No Domain Verification Required!

SendGrid allows sending emails to **any recipient** without domain verification (on free tier with some limitations).

## Quick Setup (5 minutes)

### Step 1: Create SendGrid Account
1. Go to: https://signup.sendgrid.com/
2. Sign up for a free account
3. Verify your email address

### Step 2: Create API Key
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"**
3. Name it (e.g., "SecureAuth Production")
4. Select **"Full Access"** or **"Restricted Access"** (with Mail Send permissions)
5. Click **"Create & View"**
6. **Copy the API key immediately** (you won't see it again!)

### Step 3: Set Up Sender Identity (Required for Production)

SendGrid requires you to verify a sender identity:

#### Option A: Single Sender Verification (Easiest - No Domain Needed)
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders/new
2. Enter your email address (e.g., `darnaylakarl@gmail.com`)
3. Fill in the required information
4. SendGrid will send a verification email
5. Click the verification link in your email
6. ✅ Done! You can now send from this email

#### Option B: Domain Authentication (Better for Production)
1. Go to: https://app.sendgrid.com/settings/sender_auth/domains/new
2. Enter your domain
3. Add DNS records to your domain
4. Wait for verification

### Step 4: Add Environment Variables to Vercel

```bash
# Add SendGrid API Key
vercel env add SENDGRID_API_KEY production
# Paste your API key when prompted

# Add From Email (use your verified sender)
vercel env add SENDGRID_FROM_EMAIL production
# Enter: darnaylakarl@gmail.com (or your verified email/domain)
```

### Step 5: Update Email Service Setting

```bash
vercel env add VITE_EMAIL_SERVICE production
# Enter: sendgrid
```

### Step 6: Remove Old Resend Variables (Optional)

```bash
vercel env rm RESEND_API_KEY production --yes
vercel env rm RESEND_FROM_EMAIL production --yes
vercel env rm RESEND_TEST_EMAIL production --yes
```

### Step 7: Redeploy

```bash
vercel --prod
```

## Free Tier Limits

- **100 emails/day** (free tier)
- **Unlimited** recipients (no domain verification needed!)
- Perfect for development and small applications

## Upgrade Options

If you need more:
- **Essentials Plan**: $19.95/month - 50,000 emails
- **Pro Plan**: $89.95/month - 100,000 emails

## Testing

1. Try registering a new account
2. Check your email inbox
3. You should receive the OTP code!

## Troubleshooting

### "Sender email not verified"
- Make sure you've verified your sender identity in SendGrid
- Use the exact email address you verified

### "API key invalid"
- Check that you copied the full API key
- Make sure the API key has "Mail Send" permissions

### "Rate limit exceeded"
- Free tier: 100 emails/day
- Wait 24 hours or upgrade your plan

## Benefits Over Resend

✅ **No domain verification required** for basic sending  
✅ **100 free emails/day** (vs Resend's test mode limitation)  
✅ **Can send to any email address** immediately  
✅ **Better for development and testing**

