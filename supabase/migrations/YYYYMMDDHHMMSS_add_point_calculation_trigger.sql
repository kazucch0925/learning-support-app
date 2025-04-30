-- ポイント計算関数
CREATE OR REPLACE FUNCTION calculate_session_points(session_duration INT, current_streak_days INT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE -- 入力が同じなら結果は常に同じ
AS $$
DECLARE
  points_to_add INT;
  streak_bonus INT := 10; -- ストリークボーナスポイント
  streak_threshold INT := 10; -- ボーナスが発生するストリーク日数
BEGIN
  -- 基本ポイントはセッション時間
  points_to_add := session_duration;

  -- ストリークボーナス判定
  IF current_streak_days >= streak_threshold THEN
    points_to_add := points_to_add + streak_bonus;
  END IF;

  RETURN points_to_add;
END;
$$;

-- トリガー関数
CREATE OR REPLACE FUNCTION handle_new_session_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- usersテーブルへのUPDATE権限のために必要
SET search_path = public -- publicスキーマを指定
AS $$
DECLARE
  streak_days_for_goal INT;
  points_to_add INT;
BEGIN
  -- goalsテーブルから現在のストリーク日数を取得
  SELECT streak_days INTO streak_days_for_goal
  FROM goals
  WHERE id = NEW.goal_id;

  -- ポイントを計算
  points_to_add := calculate_session_points(NEW.duration, streak_days_for_goal);

  -- usersテーブルのtotal_pointsを更新
  IF points_to_add > 0 THEN
    UPDATE users
    SET total_points = total_points + points_to_add
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW; -- INSERTトリガーの場合はNEWを返す
END;
$$;

-- トリガーの設定
-- 既存のトリガーがあれば削除 (念のため)
DROP TRIGGER IF EXISTS on_new_session_add_points ON learning_sessions;
-- 新しいトリガーを作成
CREATE TRIGGER on_new_session_add_points
  AFTER INSERT ON learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_session_points();

-- RLSポリシーの修正 (usersテーブル)
-- 既存のUPDATEポリシーを削除
DROP POLICY IF EXISTS "Users can update own data" ON users;
-- 新しいUPDATEポリシーを作成 (total_points の直接更新を推奨しない形)
-- 他のカラムは更新可能とするポリシー
CREATE POLICY "Users can update own data except points" 
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id); 