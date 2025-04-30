/*
  # Fix RLS policies for teams table

  1. Changes
    - Drop existing team policies
    - Create new policies with proper permissions
    - Add policy for team deletion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "チームの作成は認証済みユーザーのみ可能" ON teams;
DROP POLICY IF EXISTS "認証済みユーザーはチーム一覧を閲覧可能" ON teams;
DROP POLICY IF EXISTS "チームメンバーはチーム情報を更新可能" ON teams;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for team admins"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );

CREATE POLICY "Enable delete for team admins"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = id
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'admin'
    )
  );