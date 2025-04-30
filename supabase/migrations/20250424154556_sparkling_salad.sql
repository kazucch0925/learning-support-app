/*
  # Fix RLS policies for user creation

  1. Changes
    - Add enable_row_level_security to users table
    - Add policy for unauthenticated users to insert into users table
    - Add policy for authenticated users to insert into users table
*/

-- Enable RLS for users table (in case it's not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow unauthenticated users to insert into users table
CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to insert their own data
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);