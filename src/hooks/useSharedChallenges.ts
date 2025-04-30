import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type SharedChallenge = Database['public']['Tables']['shared_challenges']['Row'];
type ChallengeProgress = Database['public']['Tables']['challenge_progress']['Row'];

type SharedChallengeWithProgress = SharedChallenge & {
  progress: ChallengeProgress[];
  creator?: {
    name: string;
    avatar_url: string | null;
  };
  participant_details?: {
    id: string;
    name: string;
    avatar_url: string | null;
    minutes_completed: number;
  }[];
};

export function useSharedChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<SharedChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // チャレンジの一覧を取得
  const fetchChallenges = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // ユーザーが参加しているチャレンジを取得
      const { data: challengesData, error: challengesError } = await supabase
        .from('shared_challenges')
        .select('*')
        .contains('participants', [user.id]);

      if (challengesError) throw challengesError;

      // チャレンジの進捗情報を取得
      const challengesWithProgress: SharedChallengeWithProgress[] = [];

      for (const challenge of challengesData || []) {
        // 進捗情報を取得
        const { data: progressData, error: progressError } = await supabase
          .from('challenge_progress')
          .select('*')
          .eq('challenge_id', challenge.id);

        if (progressError) throw progressError;

        // 作成者情報を取得
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', challenge.creator_id)
          .single();

        if (creatorError && creatorError.code !== 'PGRST116') {
          throw creatorError;
        }

        // 参加者の詳細情報を取得
        const participantDetails = [];
        for (const participantId of challenge.participants) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, avatar_url')
            .eq('id', participantId)
            .single();

          if (userError && userError.code !== 'PGRST116') {
            console.error(`参加者情報の取得に失敗しました: ${userError.message}`);
            continue;
          }

          // この参加者の進捗を取得
          const userProgress = progressData?.find(p => p.user_id === participantId);
          
          participantDetails.push({
            ...userData,
            minutes_completed: userProgress?.minutes_completed || 0
          });
        }

        challengesWithProgress.push({
          ...challenge,
          progress: progressData || [],
          creator: creatorData || undefined,
          participant_details: participantDetails
        });
      }

      setChallenges(challengesWithProgress);
    } catch (e) {
      console.error('チャレンジの取得に失敗しました:', e);
      setError(e instanceof Error ? e.message : 'チャレンジの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // ログイン状態が変わったらチャレンジを取得
  useEffect(() => {
    if (user) {
      fetchChallenges();
    } else {
      setChallenges([]);
      setLoading(false);
    }
  }, [user]);

  // 新しいチャレンジを作成
  const createChallenge = async (
    title: string,
    description: string,
    category: string,
    startDate: Date,
    endDate: Date,
    targetMinutes: number,
    participants: string[]
  ): Promise<SharedChallenge> => {
    if (!user) throw new Error('ログインが必要です');

    try {
      // 自分自身も参加者に含める
      const allParticipants = [user.id, ...participants.filter(id => id !== user.id)];

      const { data, error } = await supabase
        .from('shared_challenges')
        .insert({
          title,
          description,
          creator_id: user.id,
          category,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          target_minutes: targetMinutes,
          participants: allParticipants
        })
        .select()
        .single();

      if (error) throw error;

      // 参加者全員の進捗レコードを作成
      for (const participantId of allParticipants) {
        await supabase
          .from('challenge_progress')
          .insert({
            challenge_id: data.id,
            user_id: participantId,
            minutes_completed: 0,
            last_activity: new Date().toISOString()
          });
      }

      // 最新のチャレンジリストを取得
      await fetchChallenges();

      return data;
    } catch (e) {
      console.error('チャレンジの作成に失敗しました:', e);
      throw e;
    }
  };

  // 既存のチャレンジに参加
  const joinChallenge = async (challengeId: string): Promise<void> => {
    if (!user) throw new Error('ログインが必要です');

    try {
      // まずチャレンジの情報を取得
      const { data: challengeData, error: challengeError } = await supabase
        .from('shared_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // 既に参加している場合はスキップ
      if (challengeData.participants.includes(user.id)) {
        return;
      }

      // 参加者リストを更新
      const updatedParticipants = [...challengeData.participants, user.id];

      const { error: updateError } = await supabase
        .from('shared_challenges')
        .update({ participants: updatedParticipants })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // 進捗レコードを作成
      await supabase
        .from('challenge_progress')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          minutes_completed: 0,
          last_activity: new Date().toISOString()
        });

      // 最新のチャレンジリストを取得
      await fetchChallenges();
    } catch (e) {
      console.error('チャレンジへの参加に失敗しました:', e);
      throw e;
    }
  };

  // チャレンジから退出
  const leaveChallenge = async (challengeId: string): Promise<void> => {
    if (!user) throw new Error('ログインが必要です');

    try {
      // まずチャレンジの情報を取得
      const { data: challengeData, error: challengeError } = await supabase
        .from('shared_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // 参加者リストから自分を削除
      const updatedParticipants = challengeData.participants.filter((id: string) => id !== user.id);

      // 作成者の場合は退出できない（チャレンジを削除する必要がある）
      if (challengeData.creator_id === user.id && updatedParticipants.length > 0) {
        throw new Error('チャレンジの作成者は退出できません');
      }

      // 参加者がいなくなる場合はチャレンジごと削除
      if (updatedParticipants.length === 0) {
        const { error: deleteError } = await supabase
          .from('shared_challenges')
          .delete()
          .eq('id', challengeId);

        if (deleteError) throw deleteError;
      } else {
        // 参加者リストを更新
        const { error: updateError } = await supabase
          .from('shared_challenges')
          .update({ participants: updatedParticipants })
          .eq('id', challengeId);

        if (updateError) throw updateError;
      }

      // 進捗レコードを削除
      await supabase
        .from('challenge_progress')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      // 最新のチャレンジリストを取得
      await fetchChallenges();
    } catch (e) {
      console.error('チャレンジからの退出に失敗しました:', e);
      throw e;
    }
  };

  // 学習時間を記録
  const logChallengeSession = async (
    challengeId: string,
    minutes: number,
    notes?: string
  ): Promise<void> => {
    if (!user) throw new Error('ログインが必要です');

    try {
      // 現在の進捗を取得
      const { data: progressData, error: progressError } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (progressError) throw progressError;

      // 進捗を更新
      const updatedMinutes = (progressData?.minutes_completed || 0) + minutes;
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('challenge_progress')
        .update({
          minutes_completed: updatedMinutes,
          last_activity: now
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 最新のチャレンジリストを取得
      await fetchChallenges();
    } catch (e) {
      console.error('学習時間の記録に失敗しました:', e);
      throw e;
    }
  };

  return {
    challenges,
    loading,
    error,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    logChallengeSession,
    refreshChallenges: fetchChallenges
  };
} 