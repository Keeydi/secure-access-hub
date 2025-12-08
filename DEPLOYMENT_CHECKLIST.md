# Vercel Deployment Checklist

Use this checklist to ensure your deployment is complete and working correctly.

## Pre-Deployment

- [ ] Code is committed and pushed to Git repository
- [ ] All tests pass locally (`npm run build` succeeds)
- [ ] Environment variables are documented
- [ ] Database schema is applied in Supabase
- [ ] Supabase project is configured and accessible

## Vercel Configuration

- [ ] Project imported in Vercel dashboard
- [ ] Build settings are correct:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables

- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- [ ] `VITE_JWT_SECRET` - Secure random JWT secret (32+ characters)
- [ ] `VITE_JWT_REFRESH_SECRET` - Secure random JWT refresh secret (32+ characters)

### Email Service Variables (Optional)

- [ ] `RESEND_API_KEY` - Your Resend API key (for email service)
- [ ] `RESEND_FROM_EMAIL` - Sender email address
- [ ] `VITE_EMAIL_SERVICE` - Set to `resend` or `mock`
- [ ] `VITE_EMAIL_API_ENDPOINT` - Set to `https://your-project.vercel.app/api/send-email`

## Post-Deployment

- [ ] Deployment completed successfully
- [ ] Application loads at deployed URL
- [ ] No console errors in browser
- [ ] User registration works
- [ ] User login works
- [ ] MFA setup works (TOTP)
- [ ] Email OTP works (if configured)
- [ ] Admin panel is accessible (for admin users)
- [ ] Dashboard displays correctly
- [ ] All routes work (no 404 errors on refresh)

## Supabase Configuration

- [ ] CORS settings updated with Vercel URL
- [ ] RLS policies are configured correctly
- [ ] Database tables are created
- [ ] Indexes are in place

## Security Checks

- [ ] JWT secrets are strong and unique
- [ ] Environment variables are not exposed in client code
- [ ] Supabase anon key is used (not service role key)
- [ ] CORS is properly configured
- [ ] Rate limiting is working

## Email Service (If Using)

- [ ] Resend API key is valid
- [ ] Email service endpoint is accessible
- [ ] Test email sending works
- [ ] Email templates render correctly

## Custom Domain (Optional)

- [ ] Domain added in Vercel dashboard
- [ ] DNS records configured correctly
- [ ] SSL certificate is active
- [ ] Domain redirects work correctly

## Monitoring

- [ ] Vercel analytics enabled (optional)
- [ ] Error tracking set up (optional)
- [ ] Logs are accessible in Vercel dashboard

## Troubleshooting

If something doesn't work:

1. **Check Vercel Build Logs**
   - Go to Deployments → Click on deployment → View logs
   - Look for build errors or warnings

2. **Check Browser Console**
   - Open browser DevTools
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Verify Environment Variables**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set
   - Make sure they're set for the correct environment (Production/Preview)

4. **Check Supabase**
   - Verify project is active
   - Check API keys are correct
   - Verify CORS settings include your Vercel URL

5. **Test API Endpoints**
   - Test email API: `POST https://your-project.vercel.app/api/send-email`
   - Check response and error messages

## Quick Test Commands

```bash
# Test build locally
npm run build

# Test production build
npm run preview

# Check environment variables (in Vercel)
# Go to Settings → Environment Variables
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)

