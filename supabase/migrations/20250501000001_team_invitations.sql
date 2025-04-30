/*
  # チーム招待機能の実装

  1. 新規テーブル
    - `team_invitations`
      - チームへの招待を管理
      - 招待状態のトラッキング（pending, accepted, declined）
      - 招待の有効期限を設定

  2. セキュリティ
    - チーム管理者のみが招待を作成可能
    - 招待されたユーザーのみが招待を確認・受諾可能
*/

-- チーム招待テーブル
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invitee_email TEXT, -- メールアドレスによる招待の場合
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT UNIQUE, -- 招待トークン（メール招待用）
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_invitee CHECK (
    (invitee_id IS NOT NULL AND invitee_email IS NULL) OR 
    (invitee_id IS NULL AND invitee_email IS NOT NULL)
  )
);

-- RLSの設定
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- 招待のポリシー
CREATE POLICY "チーム管理者は招待を作成可能"
  ON team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "招待されたユーザーは自分の招待を閲覧可能"
  ON team_invitations
  FOR SELECT
  TO authenticated
  USING (
    (invitee_id = auth.uid() OR invitee_email = auth.email()) OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "招待されたユーザーは招待を更新可能"
  ON team_invitations
  FOR UPDATE
  TO authenticated
  USING (invitee_id = auth.uid() OR invitee_email = auth.email())
  WITH CHECK (invitee_id = auth.uid() OR invitee_email = auth.email());

-- トリガー：招待を受け入れた場合にチームメンバーに追加
CREATE OR REPLACE FUNCTION handle_team_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- チームメンバーに追加
    INSERT INTO team_members (team_id, user_id, role)
    VALUES (NEW.team_id, COALESCE(NEW.invitee_id, auth.uid()), NEW.role)
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    -- チーム活動の記録
    INSERT INTO team_activities (
      team_id, 
      user_id, 
      activity_type, 
      content
    )
    VALUES (
      NEW.team_id, 
      COALESCE(NEW.invitee_id, auth.uid()), 
      'member', 
      'メンバーが招待を受け入れて参加しました'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_invitation_update
  AFTER UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_team_invitation_acceptance();

-- 更新日時を自動更新するトリガー
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 