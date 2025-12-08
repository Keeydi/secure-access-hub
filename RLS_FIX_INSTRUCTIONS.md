# Fix RLS (Row Level Security) Errors - Quick Guide

## Problem
You're getting 401/406 errors because Supabase RLS policies are blocking access. The original schema only has policies for the `users` table, but other tables have RLS enabled with no policies, blocking all access.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com/project/kkdggbgavwbffxvdgtzy
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Fix SQL
1. Open the file `supabase/schema-rls-fix.sql` in this project
2. Copy **ALL** the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
After running, you should see "Success. No rows returned" or similar.

### Step 4: Test
1. Restart your dev server (`npm run dev`)
2. Try registering a new user
3. Try logging in

## What This Does
- Drops the restrictive policies that check for `auth.uid()` (Supabase Auth)
- Creates new policies that allow the `anon` role (your frontend) to:
  - Read/insert/update users (for login/registration)
  - Manage sessions (create, read, update, delete)
  - Insert and read audit logs
  - Manage OTP codes, backup codes, failed login attempts, and password reset tokens

## Security Note
These policies allow the anon key to perform all operations. For production, you should:
1. Restrict policies based on your security requirements
2. Consider using Supabase Auth instead of custom JWT
3. Add additional validation in your application code

## Alternative: Disable RLS (Development Only)
If you want to quickly test without RLS, run this in SQL Editor:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE backup_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING: Only use this for development/testing. Never disable RLS in production!**

