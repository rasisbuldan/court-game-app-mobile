-- Add display_name, username, and avatar_url columns to profiles table
-- Migration: 20251028_add_profile_fields.sql

-- Add email column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add created_at and updated_at if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- Note: We skip the unique constraint on username since it may fail if there are NULL values
-- You can add it later manually if needed:
-- ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Set default username from email for existing users (extract part before @)
-- This will only work if email column has data
UPDATE profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Note: display_name and avatar_url remain NULL until user sets them
