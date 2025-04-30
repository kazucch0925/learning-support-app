/*
  # メール確認要件の無効化

  1. 変更内容
    - 新規ユーザー登録時のメール確認要件を無効化
    - 既存の未確認ユーザーを確認済みに更新
*/

-- 新規ユーザーのメール確認を自動的に完了とする
ALTER TABLE auth.users
ALTER COLUMN confirmed_at
SET DEFAULT NOW();

-- 既存の未確認ユーザーを確認済みに更新
UPDATE auth.users
SET confirmed_at = NOW()
WHERE confirmed_at IS NULL;