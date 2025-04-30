/*
  # TypeScript型定義用のデータベース型エクスポート設定

  1. 目的
    - Supabaseが提供するTypeScript型定義生成のための設定

  2. 内容
    - typescript-typesエクステンション自体は既に有効化されていることを前提
    - チャレンジ関連テーブルをエクスポート対象として追加
*/

-- テーブルの型情報をエクスポート
COMMENT ON TABLE challenges IS '@@typegen';
COMMENT ON TABLE challenge_participants IS '@@typegen';
COMMENT ON TABLE challenge_progress IS '@@typegen';
COMMENT ON TABLE challenge_comments IS '@@typegen';

-- ビューのエクスポート
COMMENT ON VIEW challenge_participant_details IS '@@typegen';

-- RLS起因のエラーを防ぐために公開関数経由でチャレンジデータを取得する関数
CREATE OR REPLACE FUNCTION get_challenge_with_details(challenge_id UUID)
RETURNS JSONB AS $$
DECLARE
  challenge_data JSONB;
  participants_data JSONB;
  progress_data JSONB;
  comments_data JSONB;
BEGIN
  -- チャレンジの基本情報を取得
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'description', c.description,
    'category', c.category,
    'creator_id', c.creator_id,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'target_minutes', c.target_minutes,
    'created_at', c.created_at,
    'updated_at', c.updated_at
  )
  FROM challenges c
  WHERE c.id = challenge_id
  INTO challenge_data;

  -- 参加者情報を取得
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', cpd.id,
      'name', cpd.name,
      'avatar_url', cpd.avatar_url,
      'minutes_completed', cpd.minutes_completed
    )
  )
  FROM challenge_participant_details cpd
  WHERE cpd.challenge_id = challenge_id
  INTO participants_data;

  -- 進捗情報を取得
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cp.id,
      'user_id', cp.user_id,
      'minutes_completed', cp.minutes_completed,
      'logged_at', cp.logged_at
    )
  )
  FROM challenge_progress cp
  WHERE cp.challenge_id = challenge_id
  INTO progress_data;

  -- コメント情報を取得
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', cc.id,
      'user_id', cc.user_id,
      'comment', cc.comment,
      'created_at', cc.created_at
    )
  )
  FROM challenge_comments cc
  WHERE cc.challenge_id = challenge_id
  ORDER BY cc.created_at DESC
  INTO comments_data;

  -- 全情報を統合
  RETURN jsonb_build_object(
    'challenge', challenge_data,
    'participants', COALESCE(participants_data, '[]'::jsonb),
    'progress', COALESCE(progress_data, '[]'::jsonb),
    'comments', COALESCE(comments_data, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 