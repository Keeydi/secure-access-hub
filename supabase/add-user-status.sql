-- Add is_active column to users table for user deactivation
-- This allows soft-deleting users without removing them from the database

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing users to be active by default
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;




