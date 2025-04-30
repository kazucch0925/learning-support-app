/*
  # AI学習アシスタント機能の追加

  1. 新規テーブル
    - `ai_suggestions`
      - AIによる学習提案を保存
      - ユーザーごとの学習パターン分析結果を保存
    - `learning_patterns`
      - ユーザーの学習パターンデータを保存
      - 時間帯、継続時間、完了率などを記録

  2. セキュリティ
    - RLSの有効化
    - ユーザーごとのアクセス制御
*/

-- AI提案テーブル
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  is_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 学習パターンテーブル
CREATE TABLE learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  goal_id UUID REFERENCES goals(id) NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  completion_rate FLOAT NOT NULL,
  mood_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLSの設定
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;

-- AI提案のポリシー
CREATE POLICY "Users can read own suggestions"
  ON ai_suggestions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON ai_suggestions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 学習パターンのポリシー
CREATE POLICY "Users can manage own learning patterns"
  ON learning_patterns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);