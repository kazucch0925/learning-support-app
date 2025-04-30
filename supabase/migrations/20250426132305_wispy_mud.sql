/*
  # チームテーブルの作成（IF NOT EXISTS付き）

  1. 新規テーブル
    - `teams`
      - チームの基本情報
    - `team_members`
      - チームメンバーシップ
    - `team_goals`
      - チームの目標
    - `team_activities`
      - チーム活動の記録

  2. セキュリティ
    - 全テーブルでRLSを有効化
    - チームメンバーのみが閲覧・更新可能なポリシーを設定
*/

-- チームテーブル
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- チームメンバーテーブル
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

-- チーム目標テーブル
CREATE TABLE IF NOT EXISTS team_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- チーム活動テーブル
CREATE TABLE IF NOT EXISTS team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES team_goals(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLSの設定
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'teams' AND policyname = 'チームの作成は認証済みユーザーのみ可能'
  ) THEN
    ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

    -- チームのポリシー
    CREATE POLICY "チームの作成は認証済みユーザーのみ可能"
      ON teams
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "認証済みユーザーはチーム一覧を閲覧可能"
      ON teams
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "チームメンバーはチーム情報を更新可能"
      ON teams
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.team_id = teams.id
          AND team_members.user_id = auth.uid()
          AND team_members.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'team_members' AND policyname = 'チームメンバーシップの閲覧'
  ) THEN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

    -- チームメンバーのポリシー
    CREATE POLICY "チームメンバーシップの閲覧"
      ON team_members
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY "チームへの参加"
      ON team_members
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'team_goals' AND policyname = 'チームメンバーは目標を管理可能'
  ) THEN
    ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;

    -- チーム目標のポリシー
    CREATE POLICY "チームメンバーは目標を管理可能"
      ON team_goals
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.team_id = team_goals.team_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE tablename = 'team_activities' AND policyname = 'チームメンバーは活動を閲覧可能'
  ) THEN
    ALTER TABLE team_activities ENABLE ROW LEVEL SECURITY;

    -- チーム活動のポリシー
    CREATE POLICY "チームメンバーは活動を閲覧可能"
      ON team_activities
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.team_id = team_activities.team_id
          AND team_members.user_id = auth.uid()
        )
      );

    CREATE POLICY "チームメンバーは活動を記録可能"
      ON team_activities
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
          SELECT 1 FROM team_members
          WHERE team_members.team_id = team_activities.team_id
          AND team_members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーの作成（既存のトリガーを削除して再作成）
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_goals_updated_at ON team_goals;
CREATE TRIGGER update_team_goals_updated_at
  BEFORE UPDATE ON team_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();