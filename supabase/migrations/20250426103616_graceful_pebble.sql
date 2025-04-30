/*
  # リマインダーと習慣化支援機能の追加

  1. 新規テーブル
    - `reminders`
      - ユーザーごとの学習リマインダー設定
    - `anchoring_habits`
      - 既存の習慣と新しい学習習慣の紐付け
*/

-- リマインダーテーブル
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  goal_id UUID REFERENCES goals(id) NOT NULL,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 習慣アンカリングテーブル
CREATE TABLE anchoring_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  goal_id UUID REFERENCES goals(id) NOT NULL,
  existing_habit TEXT NOT NULL,
  trigger_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLSの設定
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchoring_habits ENABLE ROW LEVEL SECURITY;

-- リマインダーのポリシー
CREATE POLICY "Users can manage own reminders"
  ON reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 習慣アンカリングのポリシー
CREATE POLICY "Users can manage own anchoring habits"
  ON anchoring_habits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);