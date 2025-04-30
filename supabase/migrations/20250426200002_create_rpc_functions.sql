/*
  # チャレンジ機能用のRPC関数

  1. 定義する関数
    - チャレンジ作成
    - チャレンジ参加
    - チャレンジ退出
    - 進捗記録
    - コメント投稿
*/

-- チャレンジ作成関数
CREATE OR REPLACE FUNCTION create_challenge(
  title TEXT,
  description TEXT,
  category TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_minutes INTEGER,
  participant_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_id UUID;
  current_user_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 必須項目チェック
  IF title IS NULL OR category IS NULL OR start_date IS NULL OR end_date IS NULL OR target_minutes IS NULL THEN
    RAISE EXCEPTION 'Required fields cannot be null';
  END IF;
  
  -- 日付の妥当性チェック
  IF start_date >= end_date THEN
    RAISE EXCEPTION 'End date must be after start date';
  END IF;
  
  -- target_minutesの妥当性チェック
  IF target_minutes <= 0 THEN
    RAISE EXCEPTION 'Target minutes must be greater than 0';
  END IF;

  -- チャレンジの作成
  INSERT INTO challenges (
    title,
    description,
    category,
    creator_id,
    start_date,
    end_date,
    target_minutes
  ) VALUES (
    title,
    description,
    category,
    current_user_id,
    start_date,
    end_date,
    target_minutes
  ) RETURNING id INTO challenge_id;
  
  -- 作成者を参加者として追加
  INSERT INTO challenge_participants (challenge_id, user_id)
  VALUES (challenge_id, current_user_id);
  
  -- 招待された参加者を追加
  IF participant_ids IS NOT NULL AND array_length(participant_ids, 1) > 0 THEN
    INSERT INTO challenge_participants (challenge_id, user_id)
    SELECT challenge_id, participant_id
    FROM unnest(participant_ids) AS participant_id
    WHERE participant_id != current_user_id;  -- 作成者は既に追加済み
  END IF;
  
  RETURN challenge_id;
END;
$$;

-- チャレンジ参加関数
CREATE OR REPLACE FUNCTION join_challenge(
  challenge_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  challenge_exists BOOLEAN;
  already_joined BOOLEAN;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- チャレンジの存在確認
  SELECT EXISTS(SELECT 1 FROM challenges WHERE id = challenge_id) INTO challenge_exists;
  IF NOT challenge_exists THEN
    RAISE EXCEPTION 'Challenge does not exist';
  END IF;
  
  -- 既に参加しているかチェック
  SELECT EXISTS(
    SELECT 1 FROM challenge_participants 
    WHERE challenge_id = join_challenge.challenge_id AND user_id = current_user_id
  ) INTO already_joined;
  
  IF already_joined THEN
    RETURN FALSE;  -- 既に参加済み
  END IF;
  
  -- 参加者として追加
  INSERT INTO challenge_participants (challenge_id, user_id)
  VALUES (challenge_id, current_user_id);
  
  RETURN TRUE;
END;
$$;

-- チャレンジ退出関数
CREATE OR REPLACE FUNCTION leave_challenge(
  challenge_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_creator BOOLEAN;
  participant_count INTEGER;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 作成者かどうかを確認
  SELECT EXISTS(
    SELECT 1 FROM challenges 
    WHERE id = challenge_id AND creator_id = current_user_id
  ) INTO is_creator;
  
  -- 参加者の数を確認
  SELECT COUNT(*) FROM challenge_participants
  WHERE challenge_id = leave_challenge.challenge_id
  INTO participant_count;
  
  -- 作成者かつ自分以外の参加者がいる場合は退出不可
  IF is_creator AND participant_count > 1 THEN
    RAISE EXCEPTION 'Challenge creator cannot leave while other participants exist';
  END IF;
  
  -- 参加者から削除
  DELETE FROM challenge_participants
  WHERE challenge_id = leave_challenge.challenge_id AND user_id = current_user_id;
  
  -- 作成者または最後の参加者の場合、チャレンジ自体を削除
  IF (is_creator OR participant_count <= 1) THEN
    DELETE FROM challenges
    WHERE id = challenge_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 進捗記録関数
CREATE OR REPLACE FUNCTION log_challenge_progress(
  challenge_id UUID,
  minutes_completed INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_participant BOOLEAN;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 参加者かどうかを確認
  SELECT EXISTS(
    SELECT 1 FROM challenge_participants
    WHERE challenge_id = log_challenge_progress.challenge_id AND user_id = current_user_id
  ) INTO is_participant;
  
  IF NOT is_participant THEN
    RAISE EXCEPTION 'User is not a participant in this challenge';
  END IF;
  
  IF minutes_completed <= 0 THEN
    RAISE EXCEPTION 'Minutes completed must be greater than 0';
  END IF;
  
  -- 進捗を記録
  INSERT INTO challenge_progress (
    challenge_id,
    user_id,
    minutes_completed
  ) VALUES (
    challenge_id,
    current_user_id,
    minutes_completed
  );
  
  RETURN TRUE;
END;
$$;

-- コメント投稿関数
CREATE OR REPLACE FUNCTION post_challenge_comment(
  challenge_id UUID,
  comment_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_participant BOOLEAN;
  comment_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 参加者かどうかを確認
  SELECT EXISTS(
    SELECT 1 FROM challenge_participants
    WHERE challenge_id = post_challenge_comment.challenge_id AND user_id = current_user_id
  ) INTO is_participant;
  
  IF NOT is_participant THEN
    RAISE EXCEPTION 'Only participants can comment on challenges';
  END IF;
  
  IF comment_text IS NULL OR length(trim(comment_text)) = 0 THEN
    RAISE EXCEPTION 'Comment cannot be empty';
  END IF;
  
  -- コメントを投稿
  INSERT INTO challenge_comments (
    challenge_id,
    user_id,
    comment
  ) VALUES (
    challenge_id,
    current_user_id,
    comment_text
  ) RETURNING id INTO comment_id;
  
  RETURN comment_id;
END;
$$; 