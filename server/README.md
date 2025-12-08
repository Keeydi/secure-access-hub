# Email API Server

Simple backend server for sending emails via Resend.

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Get Resend API Key

1. Sign up at https://resend.com (free tier available)
2. Go to API Keys section
3. Create a new API key
4. Copy the key (starts with `re_`)

### 3. Configure

Create a `.env` file in the `server` directory:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=SecureAuth <onboarding@resend.dev>
PORT=3001
```

**Note**: For testing, you can use `onboarding@resend.dev` as the sender. For production, verify your domain in Resend.

### 4. Start Server

```bash
npm start
```

The server will run on `http://localhost:3001`

### 5. Update Frontend .env

Add to your main project `.env` file:

```env
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=http://localhost:3001/api/send-email
```

### 6. Restart Frontend

Restart your Vite dev server to pick up the new environment variables.

## Testing

1. Start the email server: `cd server && npm start`
2. Start your frontend: `npm run dev`
3. Try registering a new user
4. Check the email inbox for the verification code

## Production Deployment

Deploy this server to:
- Vercel (serverless functions)
- Railway
- Render
- AWS Lambda
- Any Node.js hosting

Update `VITE_EMAIL_API_ENDPOINT` to your production URL.

## Alternative: Supabase Edge Functions

See `EMAIL_SERVICE_SETUP.md` for Supabase Edge Functions setup.





