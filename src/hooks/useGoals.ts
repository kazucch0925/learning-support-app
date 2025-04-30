import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAiAssistant } from './useAiAssistant';
import { toast } from 'react-hot-toast';

type Goal = Database['public']['Tables']['goals']['Row'];
type NewGoal = Database['public']['Tables']['goals']['Insert'];

// userId は Clerk ユーザー ID (string) を想定するように変更
const createManualAdjustmentSuggestion = async (
  userId: string, // Clerk User ID
  goalId: string,
  oldTarget: number,
  newTarget: number
) => {
  if (!userId) {
    console.error('createManualAdjustmentSuggestion: userId is missing');
    return;
  }
  // ... (suggestionData の user_id も Clerk ID になるが、ai_suggestions テーブルのRLS/カラム型に依存)
  // ai_suggestionsテーブルのuser_idもClerk ID (text) を想定する
  const suggestionData = {
    user_id: userId, // Clerk User ID を使用
    goal_id: goalId,
    // ... 他のフィールド
    title: newTarget > oldTarget ? '学習目標を手動で引き上げ' : '学習目標を手動で調整',
    description: newTarget > oldTarget ? `目標時間を手動で ${oldTarget}分から ${newTarget}分に引き上げました。` : `目標時間を手動で ${oldTarget}分から ${newTarget}分に調整しました。`,
    type: 'manual_adjustment',
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3日後
    is_applied: false
  };

  try {
    const { error } = await supabase
      .from('ai_suggestions')
      .insert([suggestionData]);

    if (error) throw error;
  } catch (error) {
    console.error('手動調整提案の作成中にエラー:', error);
    toast.error('提案の作成中にエラーが発生しました');
  }
};

export function useGoals() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGoals(data || []);
    } catch (e) {
      console.error('Error fetching goals:', e);
      setError(e instanceof Error ? e.message : 'ゴールの取得中にエラーが発生しました');
      toast.error('ゴールの取得に失敗しました');
    } finally {
    }
  }, [supabase]);

  useEffect(() => {
    if (!isClerkLoaded) {
      setLoading(true);
      return;
    }
    if (clerkUser) {
        setLoading(true);
        fetchGoals().finally(() => setLoading(false));
    } else {
        setGoals([]);
        setError(null);
        setLoading(false);
    }
  }, [isClerkLoaded, clerkUser, fetchGoals]);

  const addGoal = useCallback(async (goalData: { title: string } & Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'title'>>) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    try {
      const newGoalData = {
        ...goalData,
      };

      const { data, error } = await supabase
        .from('goals')
        .insert(newGoalData)
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [data, ...prev]);
      toast.success('ゴールを作成しました');
      return data;
    } catch (e) {
      console.error('Error adding goal:', e);
      setError(e instanceof Error ? e.message : 'ゴールの作成に失敗しました');
      toast.error('ゴールの作成に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase, clerkUser]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    const clerkUserId = clerkUser.id;

    setLoading(true);
    try {
      const { data: currentGoal, error: fetchError } = await supabase
        .from('goals')
        .select('target_minutes_per_day')
        .eq('id', goalId)
        .single();

      if (fetchError) {
          console.error('更新前の目標取得エラー:', fetchError);
          throw fetchError;
      }
      const oldTarget = currentGoal?.target_minutes_per_day;

      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;

      const newTarget = updatedGoal.target_minutes_per_day;
      if (oldTarget !== undefined && newTarget !== undefined && oldTarget !== newTarget) {
        try {
          await createManualAdjustmentSuggestion(clerkUserId, goalId, oldTarget, newTarget);
        } catch (suggestionError) {
          console.error('[useGoals.updateGoal] Suggestion creation failed:', suggestionError);
        }
      }

      setGoals(prev => prev.map(goal => goal.id === goalId ? updatedGoal : goal));
      toast.success('ゴールを更新しました');
      return updatedGoal;
    } catch (e) {
      console.error('Error updating goal:', e);
      setError(e instanceof Error ? e.message : '更新に失敗しました');
      toast.error('ゴールの更新に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase, clerkUser]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return;
    }
    setLoading(true);
    try {
      const { error: sessionsError } = await supabase
        .from('learning_sessions')
        .delete()
        .eq('goal_id', goalId);

      if (sessionsError) {
          console.warn('関連セッションの削除中にエラー:', sessionsError);
      }

      const { error: goalError } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (goalError) throw goalError;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('ゴールを削除しました');
    } catch (e) {
      console.error('Error deleting goal:', e);
      setError(e instanceof Error ? e.message : '削除に失敗しました');
      toast.error('ゴールの削除に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase, clerkUser]);

  return { goals, loading, error, addGoal, updateGoal, deleteGoal };
}