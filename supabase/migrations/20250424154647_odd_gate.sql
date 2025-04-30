/*
  # Clean up and consolidate RLS policies

  1. Changes
    - Drop duplicate policies
    - Create consolidated insert policy
    - Fix policy syntax
*/

-- Drop duplicate policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create a single, clear insert policy
CREATE POLICY "Enable insert for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create a policy for unauthenticated registration
CREATE POLICY "Enable insert for registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);