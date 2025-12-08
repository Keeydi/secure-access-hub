-- Create Admin Account
-- 
-- IMPORTANT: This SQL script requires a pre-hashed password.
-- For security, use the Node.js script instead: npm run create-admin
-- 
-- To use this SQL script:
-- 1. Generate a bcrypt hash for your password (use bcrypt online tool or Node.js)
-- 2. Replace 'YOUR_BCRYPT_HASH_HERE' with the actual hash
-- 3. Replace 'admin@secureauth.com' with your desired admin email
-- 4. Run this script in Supabase SQL Editor

-- Example: Creating admin account
-- Password: Admin123! (example - CHANGE THIS!)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy (example - GENERATE YOUR OWN!)

INSERT INTO users (
  email,
  password_hash,
  role,
  mfa_enabled,
  created_at,
  updated_at
) VALUES (
  'admin@secureauth.com',  -- Change this email
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Replace with your bcrypt hash
  'Admin',
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'Admin',
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Verify the admin was created
SELECT id, email, role, created_at 
FROM users 
WHERE email = 'admin@secureauth.com';




