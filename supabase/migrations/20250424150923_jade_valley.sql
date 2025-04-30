/*
  # ユーザーテーブルの作成

  1. 新規テーブル
    - `users`
      - `id` (uuid, primary key) - ユーザーID
      - `name` (text) - ユーザー名
      - `avatar_url` (text) - アバター画像URL
      - `streak_days` (integer) - 連続学習日数
      - `total_points` (integer) - 合計ポイント
      - `created_at` (timestamptz) - 作成日時
      - `updated_at` (timestamptz) - 更新日時

  2. セキュリティ
    - usersテーブルのRLSを有効化
    - 認証済みユーザーが自身のデータを読み書きできるポリシーを追加
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text,
  avatar_url text,
  streak_days integer DEFAULT 0,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが自身のデータを読み取れるポリシー
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 認証済みユーザーが自身のデータを更新できるポリシー
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 新規ユーザー登録時に自動的にusersテーブルにレコードを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();