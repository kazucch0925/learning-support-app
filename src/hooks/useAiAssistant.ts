import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { AiSuggestion } from '../types';

export function useAiAssistant() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchSuggestions();
  }, [user]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_applied', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useAiAssistant] Error fetching suggestions:', error);
        throw error;
      }

      const finalSuggestions = data || [];

      setSuggestions([...finalSuggestions]);

    } catch (e) {
      setError(e instanceof Error ? e.message : '提案の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ is_applied: true })
        .eq('id', id);

      if (error) throw error;
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '提案の適用に失敗しました');
      throw e;
    }
  };

  const dismissSuggestion = async (id: string) => {
    try {
      const targetSuggestion = suggestions.find(s => s.id === id);

      if (!targetSuggestion) {
      } else {
        const idsToDismiss = [id]; 
        const targetGoalId = targetSuggestion.goal_id;
        const targetType = targetSuggestion.type;

        if (targetGoalId && (targetType === 'goal_adjustment' || targetType === 'manual_adjustment')) {
          suggestions.forEach(s => {
            if (
              s.id !== id && 
              s.goal_id === targetGoalId && 
              (s.type === 'goal_adjustment' || s.type === 'manual_adjustment')
            ) {
              if (!idsToDismiss.includes(s.id)) {
                idsToDismiss.push(s.id);
              }
            }
          });
        } else {
        }

        const { data: updateData, error } = await supabase
          .from('ai_suggestions')
          .update({ is_applied: true })
          .in('id', idsToDismiss)
          .select();

        if (error) {
          throw error;
        }

        setSuggestions(prev => {
          const newState = prev.filter(s => !idsToDismiss.includes(s.id));
          return newState;
        });

    }

    } catch (e) {
      setError(e instanceof Error ? e.message : '提案の削除に失敗しました');
    }
  };

  /**
   * 学習パターンを分析して最適な学習時間を提案
   */
  const analyzeOptimalLearningTime = async (goalId?: string) => {
    if (!user) return null;
    
    try {
      // 過去30日間の学習セッションを取得
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let query = supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo.toISOString())
        .order('completed_at', { ascending: false });
        
      if (goalId) {
        query = query.eq('goal_id', goalId);
      }
      
      const { data: sessions, error } = await query;
      
      if (error) throw error;
      
      if (!sessions || sessions.length < 5) {
        return null; // 十分なデータがない場合
      }
      
      // 時間帯ごとの学習セッション数とその平均時間を計算
      const timeSlots: Record<string, { count: number, totalDuration: number }> = {};
      
      sessions.forEach(session => {
        const date = new Date(session.completed_at);
        const hour = date.getHours();
        
        // 時間帯を3時間区切りでグループ化
        const timeSlot = Math.floor(hour / 3) * 3;
        const slotKey = `${timeSlot}-${timeSlot + 3}`;
        
        if (!timeSlots[slotKey]) {
          timeSlots[slotKey] = { count: 0, totalDuration: 0 };
        }
        
        timeSlots[slotKey].count += 1;
        timeSlots[slotKey].totalDuration += session.duration;
      });
      
      // 最も頻度の高い時間帯と平均学習時間を特定
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
      
      // 時間帯の表現を日本語に変換
      const [start, end] = bestTimeSlot.split('-').map(Number);
      const timeDescription = `${start}時〜${end}時`;
      
      // 提案を作成
      const title = '最適な学習時間の提案';
      const description = `あなたの学習パターンを分析したところ、${timeDescription}の時間帯が最も学習効果が高いようです。この時間帯には平均${avgDuration}分程度の学習を行っており、継続性も高くなっています。この時間帯に学習を計画してみてはいかがでしょうか？`;

      // 既存の類似提案をチェック
      const { data: existingSuggestions } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'optimal_time')
        .gt('expires_at', new Date().toISOString());
        
      if (existingSuggestions && existingSuggestions.length > 0) {
        return null; // 既に提案がある場合は新しい提案を作成しない
      }
      
      // 有効期限を2週間後に設定
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);
      
      await supabase
        .from('ai_suggestions')
        .insert([{
          user_id: user.id,
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
        
      await fetchSuggestions();
      return { timeSlot: bestTimeSlot, avgDuration };
    } catch (e) {
      console.error('学習時間分析に失敗しました:', e);
      return null;
    }
  };

  /**
   * 学習パターンに基づいて個人に最適な学習法を提案
   */
  const suggestLearningMethod = async (goalId: string) => {
    if (!user) return null;
    
    try {
      // 目標の詳細を取得
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();
        
      if (goalError) throw goalError;
      
      // 目標に関連する学習セッションを取得
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('goal_id', goalId)
        .order('completed_at', { ascending: false })
        .limit(20);
        
      if (sessionsError) throw sessionsError;
      
      if (!sessions || sessions.length < 3) {
        return null; // 十分なデータがない場合
      }
      
      // 学習法の提案アルゴリズム
      // 1. 短時間セッションが多い場合はポモドーロテクニックを提案
      // 2. 長時間セッションでは分割学習を提案
      // 3. 特定の学習カテゴリに基づいたカスタマイズされた提案
      
      const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
      const maxDuration = Math.max(...sessions.map(s => s.duration));
      let methodType = '';
      let title = '';
      let description = '';

      // カテゴリに基づいた学習法の最適化
      const category = goal.category;
      
      if (avgDuration < 15) {
        // 短い学習セッションにはポモドーロテクニック
        methodType = 'pomodoro';
        title = 'ポモドーロテクニックの活用';
        description = `短時間で集中的に学習されているようですね。25分の集中学習と5分の休憩を組み合わせるポモドーロテクニックを取り入れると、さらに効率的に学習できます。`;
      } else if (maxDuration > 60) {
        // 長時間セッションには分割学習
        methodType = 'split_sessions';
        title = '効果的な分割学習のすすめ';
        description = `長時間の学習セッションを行っているようですね。脳科学研究によると、20-30分の集中学習を短い休憩を挟みながら行う方が、長時間連続して学習するよりも記憶定着に効果的です。学習を複数の短いセッションに分けてみてはいかがでしょうか？`;
      } else if (category === 'language') {
        // 言語学習の場合
        methodType = 'spaced_repetition';
        title = '間隔反復学習法で語学力アップ';
        description = `語学学習には「間隔反復学習法」が非常に効果的です。新しい単語や表現を学んだ後、1日後、3日後、1週間後、2週間後...と徐々に間隔を広げて復習することで、長期記憶への定着率が大幅に向上します。Anki などのアプリを活用してみてはいかがでしょうか？`;
      } else if (category === 'programming') {
        // プログラミング学習の場合
        methodType = 'project_based';
        title = 'プロジェクトベースの学習法';
        description = `プログラミングスキルを効果的に伸ばすには、小さな実践プロジェクトに取り組むことが最も効果的です。学んだ概念を実際のコードに適用することで理解が深まります。毎回の学習で小さな機能を1つ実装する目標を立ててみてはいかがでしょうか？`;
      } else {
        // その他のカテゴリ
        methodType = 'active_recall';
        title = 'アクティブリコールで学習効率アップ';
        description = `学習内容を単に読むだけでなく、「アクティブリコール」という方法を試してみてください。学んだ内容を自分の言葉で説明したり、問題を解いたりすることで、記憶の定着率が大幅に向上します。学習後に5分間、内容を思い出して書き出す習慣をつけるだけでも効果があります。`;
      }
      
      // 既存の類似提案をチェック
      const { data: existingSuggestions } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_id', goalId)
        .eq('type', `learning_method_${methodType}`)
        .gt('expires_at', new Date().toISOString());
        
      if (existingSuggestions && existingSuggestions.length > 0) {
        return null; // 既に提案がある場合は新しい提案を作成しない
      }
      
      // 有効期限を1ヶ月後に設定
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      await supabase
        .from('ai_suggestions')
        .insert([{
          user_id: user.id,
          goal_id: goalId,
          title,
          description,
          type: `learning_method_${methodType}`,
          expires_at: expiresAt.toISOString(),
          is_applied: false
        }]);
        
      await fetchSuggestions();
      return { methodType, title, description };
    } catch (e) {
      console.error('学習法提案に失敗しました:', e);
      return null;
    }
  };

  const refreshSuggestions = () => fetchSuggestions();

  return {
    suggestions,
    loading,
    error,
    applySuggestion,
    dismissSuggestion,
    refreshSuggestions,
    analyzeOptimalLearningTime,
    suggestLearningMethod
  };
}