/*
  # Initial Schema Setup for Learning Support App

  1. New Tables
    - `users`
      - Extends Supabase auth.users
      - Stores user-specific data like points and streak
    - `goals`
      - Individual learning goals
      - Tracks progress and streaks
    - `learning_sessions`
      - Records of completed learning sessions
    - `team_goals`
      - Group learning objectives
    - `team_members`
      - Tracks team participation
    - `badges`
      - Available achievement badges
    - `user_badges`
      - Tracks earned badges
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
*/

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  avatar_url TEXT,
  streak_days INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_minutes_per_day INTEGER NOT NULL DEFAULT 10,
  current_minutes_per_day INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL,
  streak_days INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Learning sessions table
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions"
  ON learning_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Team goals table
CREATE TABLE team_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_completion_date TIMESTAMPTZ NOT NULL,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read team goals"
  ON team_goals
  FOR SELECT
  TO authenticated
  USING (true);

-- Team members table
CREATE TABLE team_members (
  team_goal_id UUID REFERENCES team_goals(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (team_goal_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can read"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- User badges table
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) NOT NULL,
  badge_id UUID REFERENCES badges(id) NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_goals_updated_at
  BEFORE UPDATE ON team_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();