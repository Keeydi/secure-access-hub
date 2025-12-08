# Quick Email Setup Guide

## Option 1: Simple Backend Server (Recommended)

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Get Resend API Key

1. Go to https://resend.com and sign up (free tier available)
2. Navigate to **API Keys** in dashboard
3. Click **Create API Key**
4. Copy the key (starts with `re_`)

### Step 3: Create Server .env File

Create `server/.env`:

```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=SecureAuth <onboarding@resend.dev>
PORT=3001
```

**Note**: For testing, `onboarding@resend.dev` works. For production, verify your domain.

### Step 4: Start Email Server

```bash
cd server
npm start
```

You should see: `🚀 Email API server running on http://localhost:3001`

### Step 5: Update Frontend .env

Add to your main project `.env` file (in the root directory):

```env
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

### Step 6: Restart Frontend

Stop and restart your Vite dev server:

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 7: Test

1. Go to registration page
2. Fill out the form
3. Click "Send Verification Code"
4. Check your email inbox for the OTP code!

## Option 2: Supabase Edge Functions

See `EMAIL_SERVICE_SETUP.md` for detailed Supabase Edge Functions setup.

## Troubleshooting

### "Failed to send email"
- Make sure the email server is running (`cd server && npm start`)
- Check that `RESEND_API_KEY` is set correctly
- Verify the API endpoint URL in frontend `.env`

### "CORS error"
- Make sure your frontend URL is in the CORS origins in `server/index.js`
- Or update the CORS configuration

### "Invalid API key"
- Verify your Resend API key is correct
- Make sure there are no extra spaces in the `.env` file

## Production

For production:
1. Deploy the email server to a hosting service
2. Update `VITE_EMAIL_API_ENDPOINT` to your production URL
3. Use a verified domain email address
4. Keep your API keys secure!




