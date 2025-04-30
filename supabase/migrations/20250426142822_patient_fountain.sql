/*
  # Add notifications table for reminders and anchoring habits

  1. New Tables
    - `notifications`
      - Stores notifications for users
      - Supports different notification types
      - Includes metadata for additional context

  2. Security
    - Enable RLS
    - Add policies for users to manage their notifications
*/

-- 通知テーブル
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLSの設定
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 通知のポリシー
CREATE POLICY "Users can manage their own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);