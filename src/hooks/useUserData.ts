import { useEffect, useState, useCallback } from 'react';
// useUserを再度インポート
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';
// convertClerkIdToUuid のインポートを削除
// import { convertClerkIdToUuid } from '../lib/utils';

// UserData 型を実際のスキーマに合わせる
type UserData = {
  id: string; // Supabase UUID (users.id)
  clerk_id: string; // Clerk User ID (users.clerk_id)
  name: string;
  avatar_url: string | null;
  streak_days: number;
  total_points: number;
  created_at: string;
  updated_at: string;
  bio: string | null;
  last_first_challenge_date: string | null;
  first_challenge_streak_count: number;
};

export function useUserData() {
  // useUserを再度有効化
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true); // isClerkLoaded が false の間もローディング扱い
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    // Clerkユーザーが存在しない場合は何もしない (useEffect側で制御)
    // setLoading(true); // useEffect側で制御
    setError(null); // エラーリセット
    try {
      // RLS ((auth.jwt()->>'sub') = clerk_id) が適用される前提
      const { data, error: profileError } = await supabase
        .from('users')
        // clerk_id も select に含める
        .select('id, clerk_id, name, avatar_url, streak_days, total_points, created_at, updated_at, bio, last_first_challenge_date, first_challenge_streak_count')
        // RLSが効くので .eq() は不要
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // RLSで1件に絞られるはずなので、通常ここには来ない想定だが念のため
          console.warn('User profile not found, possibly new user or RLS/clerk_id issue.');
          setUserData(null);
        } else {
          throw profileError;
        }
      } else {
        // data の型はDBスキーマに従う。UserData型にキャストしてセット
        setUserData(data as UserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'ユーザーデータの取得に失敗しました');
      toast.error('ユーザーデータの取得に失敗しました');
    } finally {
       // fetchUserDataが呼ばれるのは isClerkLoaded && clerkUser の後なので、
       // ここでの setLoading(false) はfetch完了を示す
       // setLoading(false); // useEffect 側で最終的なローディング解除を行う方が良い
    }
  // 依存配列は supabase のみ、または空でも良い
  }, [supabase]);

  // onAuthStateChange を削除し、Clerkの状態に依存するuseEffectに変更
  useEffect(() => {
    // Clerkがロードされるまで待機
    if (!isClerkLoaded) {
      setLoading(true);
      return;
    }

    // Clerkがロードされ、ユーザーが認証されている場合
    if (clerkUser) {
        setLoading(true); // フェッチ開始前にローディング設定
      fetchUserData().finally(() => setLoading(false)); // フェッチ完了後にローディング解除
    }
    // Clerkがロードされ、ユーザーが認証されていない場合
    else {
      setUserData(null);
      setError(null);
      setLoading(false); // ローディング解除
    }
    // Clerkの状態が変わるたびに実行
  }, [isClerkLoaded, clerkUser, fetchUserData]);

  const refreshUserData = useCallback(() => {
    // clerkUserが存在する場合のみフェッチを実行
    if (clerkUser) {
        setLoading(true);
        fetchUserData().finally(() => setLoading(false));
    }
  }, [clerkUser, fetchUserData]);

  // updateData の型から id, clerk_id, created_at, updated_at を除外
  const updateUserData = useCallback(async (updateData: Partial<Omit<UserData, 'id' | 'clerk_id' | 'created_at' | 'updated_at'>>) => {
    // clerkUserチェック
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
      // RLS ((auth.jwt()->>'sub') = clerk_id) が適用される前提
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        // RLSが効くので .eq() は不要
        // clerk_id も select に含める
        .select('id, clerk_id, name, avatar_url, streak_days, total_points, created_at, updated_at, bio, last_first_challenge_date, first_challenge_streak_count')
        .single(); // RLSにより自動的に対象ユーザーが1件になるはず

      if (error) {
        throw error;
      }

      setUserData(data as UserData);
      toast.success('ユーザー情報を更新しました');
      return data;
    } catch (error) {
      console.error('Error updating user data:', error);
      setError(error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました');
      toast.error('ユーザー情報の更新に失敗しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, clerkUser]); // clerkUser を依存配列に追加

  return { userData, loading, error, updateUserData, refreshUserData };
}