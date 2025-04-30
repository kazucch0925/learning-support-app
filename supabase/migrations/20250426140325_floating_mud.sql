/*
  # ユーザー削除時の処理改善

  1. 変更内容
    - ユーザー削除時にauth.usersテーブルからも削除するトリガーを追加
    - 関連データの削除を処理するトリガーを追加

  2. セキュリティ
    - 削除は認証済みユーザーのみ可能
    - 自分自身のデータのみ削除可能
*/

-- ユーザー削除時のトリガー関数
CREATE OR REPLACE FUNCTION handle_deleted_user()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.usersテーブルからユーザーを削除
  DELETE FROM auth.users WHERE id = OLD.id;
  
  -- 関連データの削除
  DELETE FROM goals WHERE user_id = OLD.id;
  DELETE FROM learning_sessions WHERE user_id = OLD.id;
  DELETE FROM team_members WHERE user_id = OLD.id;
  DELETE FROM team_messages WHERE user_id = OLD.id;
  DELETE FROM team_reactions WHERE user_id = OLD.id;
  DELETE FROM team_activities WHERE user_id = OLD.id;
  
  -- チームの所有者が削除された場合、チームも削除
  DELETE FROM teams WHERE created_by = OLD.id;
  
  RETURN OLD;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS on_user_deleted ON public.users;

-- 新しいトリガーを作成
CREATE TRIGGER on_user_deleted
  AFTER DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_deleted_user();

-- ユーザー削除のポリシーを追加
CREATE POLICY "Users can delete their own data"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);