/*
  # Update auth settings

  1. Changes
    - Disable email confirmation requirement
*/

-- Disable email confirmation requirement
ALTER TABLE auth.users
ALTER COLUMN confirmed_at
SET DEFAULT NOW();

-- Update existing users to be confirmed
UPDATE auth.users
SET confirmed_at = NOW()
WHERE confirmed_at IS NULL;