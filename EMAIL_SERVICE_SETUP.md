# Email Service Setup Guide

## Overview
This guide explains how to set up a real email service for sending OTP codes.

## Current Implementation

The email service is configured to use a **backend API endpoint** for security. This keeps your API keys safe on the server.

## Option 1: Backend API Endpoint (Recommended)

### Step 1: Set Up Backend Server

Create a simple backend API (Node.js/Express example provided in `backend-api-example.js`):

```bash
# Install dependencies
npm install express resend cors

# Set environment variable
export RESEND_API_KEY=re_your_api_key_here

# Run server
node backend-api-example.js
```

### Step 2: Get Resend API Key

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Add it to your backend environment variables

### Step 3: Verify Your Domain

1. In Resend dashboard, go to Domains
2. Add and verify your domain
3. Update the `from` email in your backend to use your domain

### Step 4: Configure Frontend

Add to your `.env` file:

```env
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

For production, use your production API URL.

## Option 2: Supabase Edge Functions

### Step 1: Create Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Create function
supabase functions new send-email
```

### Step 2: Implement Function

```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  const { to, subject, html, text } = await req.json()
  
  const resend = new Resend(RESEND_API_KEY)
  
  const { data, error } = await resend.emails.send({
    from: 'SecureAuth <noreply@yourdomain.com>',
    to: [to],
    subject,
    html,
    text,
  })
  
  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ success: true, id: data?.id }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### Step 3: Deploy Function

```bash
supabase functions deploy send-email --project-ref your-project-ref
```

### Step 4: Set Secret

```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### Step 5: Configure Frontend

```env
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=https://your-project.supabase.co/functions/v1/send-email
```

## Option 3: Other Email Services

### SendGrid

Update `src/lib/email-otp.ts` to use SendGrid:

```typescript
case 'sendgrid':
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: email, subject, html: htmlBody, text: textBody }),
  });
  return response.ok;
```

### AWS SES

Similar approach - create backend endpoint that uses AWS SDK.

### SMTP (Nodemailer)

Create backend endpoint using Nodemailer with SMTP credentials.

## Environment Variables

Add to `.env`:

```env
# Email service configuration
VITE_EMAIL_SERVICE=resend  # or 'mock' for development
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email

# Backend only (never expose in frontend!)
RESEND_API_KEY=re_your_api_key_here
```

## Testing

1. **Development**: Use `mock` service (logs to console)
2. **Production**: Use `resend` with backend API

## Security Notes

⚠️ **IMPORTANT**: 
- Never expose email service API keys in frontend code
- Always use a backend API endpoint
- Keep API keys in environment variables
- Use HTTPS in production

## Quick Start (Development)

For now, the mock service will work. To test with real emails:

1. Set up backend API (Option 1 or 2)
2. Update `.env` with `VITE_EMAIL_SERVICE=resend`
3. Restart dev server
4. Test registration flow




