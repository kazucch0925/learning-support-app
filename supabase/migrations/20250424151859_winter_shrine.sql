/*
  # Add insert policy for users table

  1. Changes
    - Add INSERT policy for users table to allow new user creation
    - This policy is required for the auth trigger to work properly

  2. Security
    - Only allows insertion of own user data
    - Maintains existing security model
*/

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);