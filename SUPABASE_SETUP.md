# Supabase Setup Guide

This guide will help you set up Supabase as the database and backend for this application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `secure-access-hub` (or your preferred name)
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
4. Wait for the project to be created (takes a few minutes)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, go to the SQL Editor
2. Click "New Query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" to execute the SQL
5. Verify that all tables were created successfully

## Step 3: Get Your API Keys

1. In your Supabase project dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 4: Configure Environment Variables

1. Create a `.env` file in the root of your project
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://kkdggbgavwbffxvdgtzy.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. **Get your anon key:**
   - Go to your Supabase dashboard: https://app.supabase.com/project/kkdggbgavwbffxvdgtzy
   - Navigate to Settings → API
   - Copy the **anon/public** key
   - Paste it in your `.env` file

**⚠️ Important:** 
- Never commit your `.env` file to version control (it's already in `.gitignore`)
- The PostgreSQL connection string you have is for direct database access (useful for migrations/admin)
- For the frontend app, we use the Supabase client with URL + anon key

## Step 5: Configure Row Level Security (RLS)

The schema includes RLS policies, but you may need to adjust them based on your security requirements:

1. Go to Authentication → Policies in your Supabase dashboard
2. Review and adjust the RLS policies as needed
3. For development, you might want to temporarily disable RLS or use the service role key

## Step 6: Test the Connection

1. Start your development server: `npm run dev`
2. Try registering a new user
3. Check your Supabase dashboard → Table Editor → `users` table to verify data is being stored

## Important Notes

### Service Role Key

- The **anon key** is used in the frontend (safe to expose)
- The **service role key** should NEVER be exposed in the frontend
- For production, consider using Supabase Edge Functions or a backend API for sensitive operations

### Row Level Security (RLS)

The current RLS policies allow:
- Users to read/update their own data
- Service role to manage all data

For production, you should:
1. Review and tighten RLS policies
2. Use Supabase Auth if possible for better security
3. Consider using Edge Functions for sensitive operations

### Database Functions

The schema includes:
- Automatic `updated_at` timestamp updates
- Indexes for better query performance
- Foreign key constraints for data integrity

## Troubleshooting

### Connection Issues

- Verify your `.env` file has the correct values
- Check that your Supabase project is active
- Ensure the anon key has the correct permissions

### RLS Policy Errors

- If you get permission errors, check your RLS policies
- For development, you can temporarily disable RLS on specific tables
- Make sure you're using the correct API key (anon vs service role)

### Schema Errors

- Make sure you ran the entire `schema.sql` file
- Check for any syntax errors in the SQL
- Verify all extensions are enabled (uuid-ossp)

## Next Steps

After setting up Supabase:

1. ✅ Database schema is ready
2. ✅ API service layer is implemented
3. ⏭️ Next: Implement password encryption (bcrypt) - Item 3
4. ⏭️ Next: Implement JWT token generation - Item 4
5. ⏭️ Next: Implement real TOTP/Email OTP - Items 5-6

See `IMPLEMENTATION_PRIORITIES.md` for the full implementation roadmap.

