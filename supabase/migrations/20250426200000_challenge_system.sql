/*
  # チャレンジ機能のテーブル作成

  1. 新規テーブル
    - `challenges`
      - チャレンジの基本情報
    - `challenge_participants`
      - チャレンジの参加者
    - `challenge_progress`
      - 参加者の進捗状況
    - `challenge_comments`
      - チャレンジに対するコメント

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - 適切なアクセス制御ポリシーを設定
*/

-- チャレンジテーブル
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  target_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- チャレンジ参加者テーブル
CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (challenge_id, user_id)
);

-- チャレンジ進捗テーブル
CREATE TABLE IF NOT EXISTS challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  minutes_completed INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (challenge_id, user_id, logged_at)
);

-- チャレンジコメントテーブル
CREATE TABLE IF NOT EXISTS challenge_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 参加者情報を取得するためのビュー
CREATE OR REPLACE VIEW challenge_participant_details AS
SELECT 
  cp.challenge_id,
  cp.user_id as id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  COALESCE(SUM(prog.minutes_completed), 0) as minutes_completed
FROM 
  challenge_participants cp
  LEFT JOIN auth.users u ON cp.user_id = u.id
  LEFT JOIN challenge_progress prog ON cp.challenge_id = prog.challenge_id AND cp.user_id = prog.user_id
GROUP BY 
  cp.challenge_id, cp.user_id, u.email, u.raw_user_meta_data;

-- RLSの設定
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_comments ENABLE ROW LEVEL SECURITY;

-- チャレンジのポリシー
CREATE POLICY "チャレンジの作成は認証済みユーザーのみ可能"
  ON challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "チャレンジの閲覧は認証済みユーザーに許可"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "チャレンジの更新は作成者のみ可能"
  ON challenges
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "チャレンジの削除は作成者のみ可能"
  ON challenges
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- チャレンジ参加者のポリシー
CREATE POLICY "参加者の閲覧は認証済みユーザーに許可"
  ON challenge_participants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "参加登録は認証済みユーザーに許可"
  ON challenge_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "参加取消は自分自身のみ可能"
  ON challenge_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- チャレンジ進捗のポリシー
CREATE POLICY "進捗の閲覧は認証済みユーザーに許可"
  ON challenge_progress
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "進捗の記録は参加者のみ可能"
  ON challenge_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_participants.challenge_id = challenge_progress.challenge_id
      AND challenge_participants.user_id = auth.uid()
    )
  );

-- チャレンジコメントのポリシー
CREATE POLICY "コメントの閲覧は認証済みユーザーに許可"
  ON challenge_comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "コメントの投稿は参加者のみ可能"
  ON challenge_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_participants.challenge_id = challenge_comments.challenge_id
      AND challenge_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "コメントの編集は投稿者のみ可能"
  ON challenge_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "コメントの削除は投稿者のみ可能"
  ON challenge_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- チャレンジ更新日時のトリガー
DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント更新日時のトリガー
DROP TRIGGER IF EXISTS update_challenge_comments_updated_at ON challenge_comments;
CREATE TRIGGER update_challenge_comments_updated_at
  BEFORE UPDATE ON challenge_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 