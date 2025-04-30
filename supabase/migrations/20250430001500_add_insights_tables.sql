/*
  # Add prediction insights and support content tables

  1. New Tables
    - `prediction_insights`
      - Stores learning pattern predictions and risk insights
      - Tracks user engagement with insights
    - `support_contents`
      - Stores support materials for each prediction
      - Tracks view status of content

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Prediction Insights Table
CREATE TABLE IF NOT EXISTS prediction_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  goal_id UUID REFERENCES goals(id) NOT NULL,
  prediction_type TEXT NOT NULL,
  risk_level INTEGER NOT NULL,
  predicted_at TIMESTAMPTZ DEFAULT now(),
  is_addressed BOOLEAN DEFAULT false,
  suggested_actions TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prediction_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own insights"
  ON prediction_insights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Support Contents Table
CREATE TABLE IF NOT EXISTS support_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES prediction_insights(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  content_type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE support_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own support contents"
  ON support_contents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS prediction_insights_user_id_idx ON prediction_insights(user_id);
CREATE INDEX IF NOT EXISTS prediction_insights_goal_id_idx ON prediction_insights(goal_id);
CREATE INDEX IF NOT EXISTS support_contents_prediction_id_idx ON support_contents(prediction_id);
CREATE INDEX IF NOT EXISTS support_contents_user_id_idx ON support_contents(user_id); 