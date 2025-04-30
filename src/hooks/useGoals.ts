import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAiAssistant } from './useAiAssistant'; // suggestions取得用に必要になる可能性

type Goal = Database['public']['Tables']['goals']['Row'];
type NewGoal = Database['public']['Tables']['goals']['Insert'];

// ai_suggestions テーブルに書き込むための共通関数 (仮)
// 本来は useAiAssistant フックの責務かもしれないが、依存回避のためここに定義
// useAiAssistant フックをインポートして使う方が良い可能性もある
const createManualAdjustmentSuggestion = async (
  userId: string | undefined,
  goalId: string,
  oldTarget: number,
  newTarget: number
) => {
  if (!userId) return;

  const type = newTarget > oldTarget ? 'increase' : 'decrease';
  const title = type === 'increase' 
    ? '学習目標を手動で引き上げ' 
    : '学習目標を手動で調整';
  
  const description = type === 'increase'
    ? `目標時間を手動で ${oldTarget}分から ${newTarget}分に引き上げました。`
    : `目標時間を手動で ${oldTarget}分から ${newTarget}分に調整しました。`;
  
  // 有効期限を短めに設定（例: 3日間）手動変更はすぐ確認される想定
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 3);
  
  const suggestionData = {
    user_id: userId,
    goal_id: goalId,
    title,
    description,
    type: 'manual_adjustment',
    expires_at: expiresAt.toISOString(),
    is_applied: false
  };

  try {
    const { error } = await supabase
      .from('ai_suggestions')
      .insert([suggestionData]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('手動調整提案の作成中に予期せぬエラー:', error);
  }
};

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    fetchGoals();
  }, [user]);

  const addGoal = async (goal: Partial<Goal>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([{ ...goal, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ゴールの作成に失敗しました');
      throw e;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!user) return;
    try {
      // 1. 更新前の目標データを取得
      const { data: currentGoal, error: fetchError } = await supabase
        .from('goals')
        .select('target_minutes_per_day')
        .eq('id', goalId)
        .single();

      if (fetchError) {
        console.error('更新前の目標取得エラー:', fetchError);
        // エラーでも続行
      }
      const oldTarget = currentGoal?.target_minutes_per_day;

      // 2. 目標データを更新
      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;

      // 3. target_minutes_per_day が変更されていたら通知レコードを作成し、完了を待つ
      const newTarget = updatedGoal.target_minutes_per_day;
      if (oldTarget !== undefined && newTarget !== undefined && oldTarget !== newTarget) {
        try {
          await createManualAdjustmentSuggestion(user?.id, goalId, oldTarget, newTarget);
        } catch (suggestionError) {
          console.error('[useGoals.updateGoal] Suggestion creation failed, but goal update succeeded.', suggestionError);
        }
      }

      // 4. Stateを更新
      setGoals(prev => prev.map(goal => goal.id === goalId ? updatedGoal : goal));
      return updatedGoal;
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
      throw e;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      // まず、関連する学習セッションを削除
      const { error: sessionsError } = await supabase
        .from('learning_sessions')
        .delete()
        .eq('goal_id', goalId);

      if (sessionsError) throw sessionsError;

      // 次に、目標を削除
      const { error: goalError } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (goalError) throw goalError;
      
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      throw e;
    }
  };

  const restartGoal = async (goalId: string) => {
    try {
      // 目標の履歴を保存
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('目標が見つかりません');

      const { error: historyError } = await supabase
        .from('goal_history')
        .insert([{
          goal_id: goalId,
          user_id: user?.id,
          previous_streak: goal.streak_days,
          previous_minutes: goal.current_minutes_per_day,
          restart_date: new Date().toISOString()
        }]);

      if (historyError) throw historyError;

      // 目標をリセット
      const { data, error } = await supabase
        .from('goals')
        .update({
          streak_days: 0,
          current_minutes_per_day: Math.max(5, Math.floor(goal.target_minutes_per_day * 0.5)),
          last_completed_at: null
        })
        .eq('id', goalId)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === goalId ? data : g));
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リスタートに失敗しました');
      throw e;
    }
  };

  const refreshGoals = () => fetchGoals();

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    restartGoal,
    refreshGoals
  };
}