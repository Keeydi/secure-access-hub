# Admin Account Creation

## Quick Start

To create an admin account, run:

```bash
npm run create-admin
```

This will prompt you for:
- **Email** (default: `admin@secureauth.com`)
- **Password** (will be validated and hashed automatically)

## Manual SQL Method

If you prefer to use SQL directly:

1. Generate a bcrypt hash for your password (use an online bcrypt generator or Node.js)
2. Open `supabase/create-admin.sql`
3. Replace the email and password hash
4. Run the SQL in Supabase SQL Editor

## Default Admin Credentials

After running the script, you can log in with:
- **Email**: (the email you provided)
- **Password**: (the password you provided)

## Security Notes

- The password is hashed using bcrypt (10 salt rounds)
- Never commit passwords or hashes to version control
- Change the default admin password in production
- Consider enabling MFA for admin accounts

## Troubleshooting

If you get an RLS (Row Level Security) error:
1. Run the RLS fix script: `supabase/schema-rls-fix.sql`
2. This allows the anon role to create users




