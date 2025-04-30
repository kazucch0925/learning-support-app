import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

type Goal = Database['public']['Tables']['goals']['Row'];
type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

interface GoalAdjustment {
  id: string;
  user_id: string;
  goal_id: string;
  adjustment_date: string;
  reason: string;
  previous_value: number;
  new_value: number;
}

export function useGoalAdjustment() {
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAdjustmentSuggestion = useCallback(async (
    goalId: string,
    type: 'increase' | 'decrease',
    oldTarget: number,
    newTarget: number
  ) => {
    const title = type === 'increase'
      ? '学習目標の引き上げ'
      : '学習目標の最適化';
    const description = type === 'increase'
      ? `素晴らしい進捗です！あなたは${oldTarget}分の目標を一貫して達成しています。さらなる成長のために、目標を${newTarget}分に引き上げました。`
      : `目標を継続しやすくするために、学習時間を${oldTarget}分から${newTarget}分に調整しました。小さな成功体験を積み重ねることが長期的な習慣形成につながります。`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);
    try {
      await supabase
        .from('ai_suggestions')
        .insert([{
          goal_id: goalId,
          title,
          description,
          type: 'goal_adjustment',
          expires_at: expiresAt.toISOString(),
          is_applied: false
        }]);
    } catch (error) {
      console.error('提案の作成に失敗しました:', error);
      toast.error('目標調整提案の作成に失敗しました');
    }
  }, []);

  /**
   * 目標の自動調整ロジックを実装
   * 1. ストリークが長いほど、少しずつ目標を引き上げる
   * 2. 実際の達成度に基づいて過剰な目標は下方修正
   */
  const calculateAdjustedGoal = (goal: Goal, sessions: LearningSession[]): Partial<Goal> | null => {
    // ストリークが短い場合や直近のセッションがない場合は調整しない
    if (goal.streak_days < 5 || sessions.length === 0) {
      return null;
    }

    // 平均学習時間を計算
    const averageDuration = sessions.reduce((sum, session) => sum + session.duration, 0) / sessions.length;
    
    // 目標の自動調整ロジック
    let newTargetMinutes = goal.target_minutes_per_day;
    
    // ストリークが長く、平均学習時間が目標を上回る場合は少しずつ引き上げる
    if (goal.streak_days >= 7 && averageDuration > goal.target_minutes_per_day * 1.2) {
      // 10%増加（最大で5分増加）
      const increase = Math.min(5, Math.floor(goal.target_minutes_per_day * 0.1));
      newTargetMinutes = goal.target_minutes_per_day + increase;
    }
    
    // 継続的に目標達成できていない場合は下方修正
    if (averageDuration < goal.target_minutes_per_day * 0.7) {
      // 直近の達成度に合わせて調整（最小でも5分）
      newTargetMinutes = Math.max(5, Math.floor(averageDuration * 1.1));
    }
    
    // 変更がない場合はnullを返す
    if (newTargetMinutes === goal.target_minutes_per_day) {
      return null;
    }
    
    return {
      target_minutes_per_day: newTargetMinutes
    };
  };

  /**
   * 目標を自動的に調整する
   */
  const adjustGoal = useCallback(async (goalId: string): Promise<Goal | null> => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }

    setLoading(true);
    setError(null);

    try {
      // 目標情報を取得 (RLSが効く)
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*') // 調整計算と提案作成に必要なカラムを取得
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;
      if (!goal) throw new Error('Goal not found or not accessible'); // RLS考慮

      // 過去14日間の学習セッションを取得 (RLSが効く)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*') // calculateAdjustedGoal に渡すため、元の型と合わせる
        .eq('goal_id', goalId)
        .gte('completed_at', twoWeeksAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // 調整ロジックの適用
      const adjustedGoalSettings = calculateAdjustedGoal(goal, sessions || []);
      
      if (!adjustedGoalSettings || adjustedGoalSettings.target_minutes_per_day === undefined) {
        console.log(`Goal ${goalId} adjustment not needed.`);
        return goal; // 調整不要なら現在のゴールを返す
      }

      // 目標を更新 (RLSが効く)
      const { data: updatedGoal, error: updateError } = await supabase
        .from('goals')
        .update(adjustedGoalSettings)
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) throw updateError;

      // AIサジェスションを作成（目標調整の通知）
      if (Math.abs(adjustedGoalSettings.target_minutes_per_day - goal.target_minutes_per_day) >= 5) {
        const suggestionType = adjustedGoalSettings.target_minutes_per_day > goal.target_minutes_per_day
          ? 'increase'
          : 'decrease';
        
        await createAdjustmentSuggestion(goal.id, suggestionType, goal.target_minutes_per_day, adjustedGoalSettings.target_minutes_per_day);
      }

      toast.success('目標が自動調整されました');
      return updatedGoal;
    } catch (e) {
      console.error("Error adjusting goal:", e);
      setError(e instanceof Error ? e.message : '目標の調整に失敗しました');
      toast.error('目標の調整に失敗しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, [clerkUser, createAdjustmentSuggestion]);

  return {
    loading,
    error,
    adjustGoal,
  };
} 