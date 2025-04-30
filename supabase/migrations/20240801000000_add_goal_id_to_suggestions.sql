ALTER TABLE public.ai_suggestions
ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.ai_suggestions.goal_id IS '提案が関連する学習目標ID (NULL許容)'; 