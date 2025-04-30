import { useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
// Remove Goal type import if not used elsewhere in this file after changes
// import type { Database } from '../lib/database.types';
// type Goal = Database['public']['Tables']['goals']['Row'];

// Define the expected return type from the RPC function
interface LogSessionResult {
  success: boolean;
  message: string;
  points_earned: number;
  streak: number;
}

export function useLearningSession() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modify logSession to call the RPC function and support past dates
  const logSession = useCallback(async (goalId: string, finalTotalDuration: number, notes: string = '', date?: Date) => {
    if (!isLoaded || !user) return null; // Return null or indicate failure if no user

    if (finalTotalDuration < 0) {
      setError("学習時間は0分以上である必要があります。");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const userId = user.id;
      
      // 過去の日付が指定されている場合は、その日付に直接記録
      if (date && !isToday(date)) {
        // 過去の記録の場合、常に新しいセッションを作成
        const { error: insertError } = await supabase
          .from('learning_sessions')
          .insert({
            goal_id: goalId,
            user_id: userId,
            duration: finalTotalDuration,
            notes: notes,
            completed_at: date.toISOString()
          });

        if (insertError) throw insertError;

        // 過去の記録では、ポイントは加算しない
        return { 
          success: true, 
          message: '過去の学習記録を保存しました。', 
          points_earned: 0, 
          streak: 0 // 過去の記録ではストリークは変更しない
        };
      }

      // 今日の記録の場合は従来の処理
      // Get current minutes and streak days to calculate added duration and return streak on no change
      const { data: currentGoal, error: goalFetchError } = await supabase
        .from('goals')
        .select('current_minutes_per_day, streak_days') // Add streak_days
        .eq('id', goalId)
        .single();

      if (goalFetchError) throw goalFetchError;
      if (!currentGoal) throw new Error('Goal not found');

      const addedDuration = finalTotalDuration - currentGoal.current_minutes_per_day;

      // If duration didn't actually change, don't call RPC
      if (addedDuration <= 0) {
         console.log("No change in duration, skipping log.")
         setLoading(false);
         // Return something to indicate success but no points, include current streak
         return { success: true, message: '学習時間に変更はありませんでした。', points_earned: 0, streak: currentGoal.streak_days || 0 }; 
      }

      // Call the RPC function - Remove generic type hint for now
      const { data, error: rpcError } = await supabase.rpc(
        'log_learning_session_and_get_points', 
        {
          _goal_id: goalId,
          _added_duration: addedDuration,
          _final_total_duration: finalTotalDuration,
          _notes: notes
        }
      );

      if (rpcError) throw rpcError;
      
      // Assert the type of data here
      const result = data as LogSessionResult | null;

      if (!result) throw new Error('RPC function did not return data.');

      if (!result.success) {
        throw new Error(result.message || 'セッションの記録に失敗しました。');
      }

      // Return the result from the RPC function, including points_earned
      return result; 

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'セッションの記録中に予期せぬエラーが発生しました';
      setError(errorMessage);
      console.error('Error logging session:', e); 
      return null; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]); // Add supabase to dependencies if it's not stable across renders, though it usually is

  return {
    logSession,
    loading,
    error
  };
}

// 日付が今日かどうかをチェックする関数
function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}