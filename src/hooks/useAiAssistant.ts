import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import type { AiSuggestion } from '../types';

export type Suggestion = {
  id: string;
  user_id: string;
  goal_id?: string | null;
  title: string;
  description: string;
  type: string;
  expires_at: string;
  is_applied: boolean;
  is_saved?: boolean;
  metadata?: Record<string, any>;
  suggestion?: string;
  created_at: string;
};

export function useAiAssistant() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('is_applied', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }
      setSuggestions((data as Suggestion[]) || []);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      setError(error instanceof Error ? error.message : 'AI提案の取得に失敗しました');
      toast.error('AIの提案の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (!isClerkLoaded) {
        return;
    }
    if (clerkUser) {
        fetchSuggestions();
    } else {
        setSuggestions([]);
        setError(null);
        setIsLoading(false);
    }
  }, [isClerkLoaded, clerkUser, fetchSuggestions]);

  const saveSuggestion = useCallback(async (suggestionId: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ is_saved: true })
        .eq('id', suggestionId);

      if (error) {
        throw error;
      }

      setSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, is_saved: true } : s)
      );
      
      toast.success('提案が保存されました');
    } catch (error) {
      console.error('Error saving suggestion:', error);
      toast.error('提案の保存に失敗しました');
    } finally {
        setIsLoading(false);
    }
  }, [clerkUser]);

  const dismissSuggestion = useCallback(async (suggestionId: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) {
        throw error;
      }

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      
      toast.success('提案が削除されました');
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
      toast.error('提案の削除に失敗しました');
    } finally {
        setIsLoading(false);
    }
  }, [clerkUser]);

  const analyzeOptimalLearningTime = useCallback(async (goalId?: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let query = supabase
        .from('learning_sessions')
        .select('completed_at, duration')
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });
        
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data: sessions, error: sessionError } = await query;
      
      if (sessionError) throw sessionError;
      
      if (!sessions || sessions.length < 5) {
        console.log('学習セッションが5件未満のため、時間分析をスキップ');
        return null;
      }
      
      const timeSlots: Record<string, { count: number, totalDuration: number }> = {};
      
      sessions.forEach(session => {
        const date = new Date(session.completed_at);
        const hour = date.getHours();
        
        const timeSlot = Math.floor(hour / 3) * 3;
        const slotKey = `${timeSlot}-${timeSlot + 3}`;
        
        if (!timeSlots[slotKey]) {
          timeSlots[slotKey] = { count: 0, totalDuration: 0 };
        }
        
        timeSlots[slotKey].count += 1;
        timeSlots[slotKey].totalDuration += session.duration;
      });
      
      let bestTimeSlot = '';
      let highestCount = 0;
      let avgDuration = 0;
      
      Object.entries(timeSlots).forEach(([slot, { count, totalDuration }]) => {
        if (count > highestCount) {
          highestCount = count;
          bestTimeSlot = slot;
          avgDuration = Math.round(totalDuration / count);
        }
      });
      
      if (!bestTimeSlot) return null;
      
      const [start, end] = bestTimeSlot.split('-').map(Number);
      const timeDescription = `${start}時〜${end}時`;
      
      const title = '最適な学習時間の提案';
      const description = `あなたの学習パターンを分析したところ、${timeDescription}の時間帯が最も学習効果が高いようです。この時間帯には平均${avgDuration}分程度の学習を行っており、継続性も高くなっています。この時間帯に学習を計画してみてはいかがでしょうか？`;

      const { data: existingSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('type', 'optimal_time')
        .gt('expires_at', new Date().toISOString())
        .limit(1);
        
      if (existingSuggestions && existingSuggestions.length > 0) return null;
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);
      
      const { error: insertError } = await supabase
        .from('ai_suggestions')
        .insert([{
          goal_id: goalId,
          title,
          description,
          type: 'optimal_time',
          expires_at: expiresAt.toISOString(),
          is_applied: false,
          metadata: {
            time_slot: bestTimeSlot,
            avg_duration: avgDuration
          }
        }]);
        
      if (insertError) throw insertError;

      await fetchSuggestions();
      toast.success('最適な学習時間を提案しました');
      return { timeSlot: bestTimeSlot, avgDuration };
    } catch (e) {
      console.error('学習時間分析に失敗しました:', e);
      setError(e instanceof Error ? e.message : '学習時間分析に失敗しました');
      toast.error('学習時間の分析に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSuggestions, clerkUser]);

  const suggestLearningMethod = useCallback(async (goalId: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('title, description, categories, category')
        .eq('id', goalId)
        .single();
        
      if (goalError) throw goalError;
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('duration, notes')
        .eq('goal_id', goalId)
        .order('completed_at', { ascending: false })
        .limit(20);
        
      if (sessionsError) throw sessionsError;
      
      if (!sessions || sessions.length < 3) {
        console.log('学習セッションが3件未満のため、学習方法提案をスキップ');
        return null;
      }
      
      const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
      const maxDuration = Math.max(...sessions.map(s => s.duration));
      let methodType = '';
      let title = '';
      let description = '';
      const category = goal.category;
      
      if (avgDuration < 15) {
        methodType = 'pomodoro';
        title = 'ポモドーロテクニックの活用';
        description = '短時間で集中的に学習されているようですね。25分の集中学習と5分の休憩を組み合わせるポモドーロテクニックを取り入れると、さらに効率的に学習できます。';
      } else if (maxDuration > 60) {
        methodType = 'split_sessions';
        title = '効果的な分割学習のすすめ';
        description = '長時間の学習セッションを行っているようですね。脳科学研究によると、20-30分の集中学習を短い休憩を挟みながら行う方が、長時間連続して学習するよりも記憶定着に効果的です。学習を複数の短いセッションに分けてみてはいかがでしょうか？';
      } else if (category === 'language') {
        methodType = 'spaced_repetition';
        title = '間隔反復学習法で語学力アップ';
        description = '語学学習には「間隔反復学習法」が非常に効果的です。新しい単語や表現を学んだ後、1日後、3日後、1週間後、2週間後...と徐々に間隔を広げて復習することで、長期記憶への定着率が大幅に向上します。Anki などのアプリを活用してみてはいかがでしょうか？';
      } else if (category === 'programming') {
        methodType = 'project_based';
        title = 'プロジェクトベースの学習法';
        description = 'プログラミングスキルを効果的に伸ばすには、小さな実践プロジェクトに取り組むことが最も効果的です。学んだ概念を実際のコードに適用することで理解が深まります。毎回の学習で小さな機能を1つ実装する目標を立ててみてはいかがでしょうか？';
      } else {
        methodType = 'active_recall';
        title = 'アクティブリコールで学習効率アップ';
        description = '学習内容を単に読むだけでなく、「アクティブリコール」という方法を試してみてください。学んだ内容を自分の言葉で説明したり、問題を解いたりすることで、記憶の定着率が大幅に向上します。学習後に5分間、内容を思い出して書き出す習慣をつけるだけでも効果があります。';
      }
      
      const { data: existingSuggestions } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('goal_id', goalId)
        .eq('type', `learning_method_${methodType}`)
        .gt('expires_at', new Date().toISOString())
        .limit(1);
        
      if (existingSuggestions && existingSuggestions.length > 0) return null;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      const { error: insertError } = await supabase
        .from('ai_suggestions')
        .insert([{
          goal_id: goalId,
          title,
          description,
          type: `learning_method_${methodType}`,
          expires_at: expiresAt.toISOString(),
          is_applied: false
        }]);
        
      if (insertError) throw insertError;

      await fetchSuggestions();
      toast.success('新しい学習法を提案しました');
      return { methodType, title, description };
    } catch (e) {
      console.error('学習法提案に失敗しました:', e);
      setError(e instanceof Error ? e.message : '学習法提案に失敗しました');
      toast.error('学習法の提案に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSuggestions, clerkUser]);

  const refreshSuggestions = useCallback(() => fetchSuggestions(), [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    saveSuggestion,
    dismissSuggestion,
    refreshSuggestions,
    analyzeOptimalLearningTime,
    suggestLearningMethod
  };
}