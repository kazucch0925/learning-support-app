/*
  # チームコミュニケーション機能の追加

  1. 新規テーブル
    - `team_messages`
      - チーム内のメッセージを保存
      - メッセージの種類（通常、目標更新、お知らせ等）を管理
    - `team_reactions`
      - メッセージへのリアクションを管理
      - 絵文字やスタンプによる簡易的なフィードバック

  2. セキュリティ
    - チームメンバーのみがメッセージの投稿・閲覧可能
    - リアクションの追加・削除が可能
*/

-- チームメッセージテーブル
CREATE TABLE team_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'normal',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- チームリアクションテーブル
CREATE TABLE team_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES team_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- RLSの設定
ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_reactions ENABLE ROW LEVEL SECURITY;

-- メッセージのポリシー
CREATE POLICY "チームメンバーはメッセージを閲覧可能"
  ON team_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "チームメンバーはメッセージを投稿可能"
  ON team_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_messages.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- リアクションのポリシー
CREATE POLICY "チームメンバーはリアクション可能"
  ON team_reactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_messages
      JOIN team_members ON team_members.team_id = team_messages.team_id
      WHERE team_messages.id = team_reactions.message_id
      AND team_members.user_id = auth.uid()
    )
  );