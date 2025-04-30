-- ai_suggestions テーブルに INSERT ポリシーを追加
CREATE POLICY "Users can insert own suggestions" 
  ON public.ai_suggestions
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

COMMENT ON POLICY "Users can insert own suggestions" ON public.ai_suggestions 
IS '認証されたユーザーは自分の提案のみ挿入できる'; 