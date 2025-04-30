/*
  # Add learning sessions table

  1. New Tables
    - `learning_sessions`
      - Records completed learning sessions
      - Tracks duration and notes
      - Links to goals and users

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON learning_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);