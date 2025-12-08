# Vercel Deployment Guide

This guide will help you deploy Secure Access Hub to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A GitHub/GitLab/Bitbucket account (for connecting your repository)
3. Your Supabase project set up and configured
4. (Optional) Resend API key for email service

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to your Git repository
2. Ensure `.env` is in `.gitignore` (it should be already)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect Vite configuration
5. Configure the following:

   **Framework Preset:** Vite
   
   **Build Command:** `npm run build`
   
   **Output Directory:** `dist`
   
   **Install Command:** `npm install`

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

### Required Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_JWT_SECRET=your_jwt_secret_key
VITE_JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
```

### Optional Variables (for Email Service)

```
VITE_EMAIL_SERVICE=resend
VITE_EMAIL_API_ENDPOINT=https://your-email-api.vercel.app/api/send-email
```

### Generating JWT Secrets

You can generate secure random secrets using:

```bash
# Generate a random secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get two different secrets for `VITE_JWT_SECRET` and `VITE_JWT_REFRESH_SECRET`.

## Step 4: Deploy Email Service (Optional)

The email service in the `server/` folder needs to be deployed separately. You have two options:

### Option A: Deploy as Vercel Serverless Function

1. Create a new Vercel project for the email service
2. Or add it to the same project as an API route

Create `api/send-email.js` in your project root:

```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'SecureAuth <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

Then add to Vercel environment variables:
- `RESEND_API_KEY=your_resend_api_key`
- `RESEND_FROM_EMAIL=SecureAuth <onboarding@resend.dev>`

### Option B: Deploy to Separate Service

Deploy the `server/` folder to:
- Railway
- Render
- Heroku
- AWS Lambda
- Any Node.js hosting

Then update `VITE_EMAIL_API_ENDPOINT` to point to your deployed service.

## Step 5: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update your Supabase CORS settings if needed

## Step 6: Update Supabase CORS Settings

1. Go to your Supabase dashboard
2. Navigate to **Settings** → **API**
3. Add your Vercel deployment URL to **Allowed Origins**:
   - `https://your-project.vercel.app`
   - `https://your-custom-domain.com` (if applicable)

## Step 7: Verify Deployment

1. Visit your deployed URL
2. Test user registration
3. Test login functionality
4. Verify MFA setup works
5. Check that email service is working (if configured)

## Troubleshooting

### Build Errors

- **Error: Module not found**: Make sure all dependencies are in `package.json`
- **Error: Environment variables**: Ensure all required variables are set in Vercel
- **Error: Build timeout**: Check for large files or slow build processes

### Runtime Errors

- **CORS errors**: Update Supabase CORS settings with your Vercel URL
- **Environment variables not working**: Make sure variables start with `VITE_` for Vite
- **API errors**: Check that Supabase URL and keys are correct

### Common Issues

1. **404 on refresh**: This is handled by the `rewrites` in `vercel.json`
2. **Assets not loading**: Check that build output is `dist`
3. **Email not sending**: Verify email service is deployed and `VITE_EMAIL_API_ENDPOINT` is correct

## Post-Deployment Checklist

- [ ] All environment variables are set
- [ ] Supabase CORS is configured
- [ ] Email service is deployed (if using)
- [ ] Custom domain is configured (if using)
- [ ] SSL certificate is active (automatic with Vercel)
- [ ] All features are tested
- [ ] Database migrations are applied
- [ ] Admin account is created

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Supabase CORS Configuration](https://supabase.com/docs/guides/api/api-cors)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure Supabase project is accessible

