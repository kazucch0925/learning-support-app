import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../lib/database.types';

type Friendship = Database['public']['Tables']['friendships']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type FriendWithDetails = User & { 
  friendship: Friendship,
  stats?: {
    totalMinutes: number;
    streakDays: number;
    activeDays: number;
    averageMinutesPerDay: number;
  }
};

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined'
}

export enum PrivacyLevel {
  ALL = 'all',
  GOALS_ONLY = 'goals_only',
  SUMMARY_ONLY = 'summary_only'
}

export function useFriendSystem() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithDetails[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithDetails[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // 友人リストと友人リクエストを取得
  useEffect(() => {
    if (!user) return;
    fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 承認済みの友人関係を取得
      const { data: acceptedFriendships, error: acceptedError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', FriendshipStatus.ACCEPTED);
      
      if (acceptedError) throw acceptedError;
      
      // 受け取った友人リクエストを取得
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_id', user.id)
        .eq('status', FriendshipStatus.PENDING);
      
      if (receivedError) throw receivedError;
      
      // 送信した友人リクエストを取得
      const { data: sentRequestsData, error: sentError } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', FriendshipStatus.PENDING);
      
      if (sentError) throw sentError;
      
      // 友人の詳細情報を取得して整形
      const acceptedFriendsWithDetails = await fetchFriendsDetails(acceptedFriendships);
      const pendingFriendsWithDetails = await fetchFriendsDetails(receivedRequests, true);
      const sentRequestsWithDetails = await fetchFriendsDetails(sentRequestsData, false);
      
      // 友人の学習統計を取得
      await fetchFriendsStats(acceptedFriendsWithDetails);
      
      setFriends(acceptedFriendsWithDetails);
      setPendingRequests(pendingFriendsWithDetails);
      setSentRequests(sentRequestsWithDetails);
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人リストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 友人の詳細情報を取得
  const fetchFriendsDetails = async (friendships: Friendship[], isReceived = false): Promise<FriendWithDetails[]> => {
    if (!user || !friendships || friendships.length === 0) return [];
    
    const friendDetails: FriendWithDetails[] = [];
    
    for (const friendship of friendships) {
      const friendId = isReceived || friendship.friend_id === user.id
        ? friendship.user_id
        : friendship.friend_id;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', friendId)
        .single();
      
      if (error) {
        console.error('友人情報の取得に失敗しました:', error);
        continue;
      }
      
      if (data) {
        friendDetails.push({
          ...data,
          friendship
        });
      }
    }
    
    return friendDetails;
  };

  // 友人の学習統計を取得
  const fetchFriendsStats = async (friends: FriendWithDetails[]) => {
    if (!friends || friends.length === 0) return;
    
    for (const friend of friends) {
      // プライバシー設定をチェック
      if (
        friend.friendship.privacy_level === PrivacyLevel.SUMMARY_ONLY || 
        friend.friendship.privacy_level === PrivacyLevel.ALL
      ) {
        try {
          // 過去30日間の学習セッションを取得
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { data: sessions, error } = await supabase
            .from('learning_sessions')
            .select('*')
            .eq('user_id', friend.id)
            .gte('completed_at', thirtyDaysAgo.toISOString());
          
          if (error) throw error;
          
          if (sessions && sessions.length > 0) {
            // 統計情報を計算
            const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);
            
            // アクティブな日数を計算（ユニークな日付の数）
            const uniqueDates = new Set();
            sessions.forEach(session => {
              const date = new Date(session.completed_at).toISOString().split('T')[0];
              uniqueDates.add(date);
            });
            
            // 平均学習時間を計算
            const activeDays = uniqueDates.size;
            const averageMinutesPerDay = activeDays > 0 ? totalMinutes / activeDays : 0;
            
            // 友人の統計情報を更新
            friend.stats = {
              totalMinutes,
              streakDays: friend.streak_days || 0,
              activeDays,
              averageMinutesPerDay
            };
          }
        } catch (e) {
          console.error(`${friend.name}の統計情報取得に失敗:`, e);
        }
      }
    }
  };

  // ユーザー検索
  const searchUsers = async (query: string) => {
    if (!user || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id) // 自分以外のユーザーを検索
        .or(`name.ilike.%${query}%`);
      
      if (error) throw error;
      
      // すでに友人リクエストを送信している、または友人であるユーザーをフィルタリング
      const existingFriendIds = new Set([
        ...friends.map(f => f.id),
        ...pendingRequests.map(p => p.id),
        ...sentRequests.map(s => s.id)
      ]);
      
      const filteredResults = data.filter(user => !existingFriendIds.has(user.id));
      setSearchResults(filteredResults);
    } catch (e) {
      console.error('ユーザー検索に失敗:', e);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 友人リクエストを送信
  const sendFriendRequest = async (friendId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: FriendshipStatus.PENDING,
          privacy_level: PrivacyLevel.ALL // デフォルトのプライバシー設定
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // 送信したリクエストのユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', friendId)
        .single();
      
      if (userError) throw userError;
      
      // 送信したリクエストリストを更新
      setSentRequests(prev => [
        ...prev,
        {
          ...userData,
          friendship: data
        }
      ]);
      
      // 検索結果から追加したユーザーを削除
      setSearchResults(prev => prev.filter(user => user.id !== friendId));
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人リクエストの送信に失敗しました');
      return false;
    }
  };

  // 友人リクエストを承認
  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: FriendshipStatus.ACCEPTED })
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      // 承認したリクエストを見つける
      const acceptedRequest = pendingRequests.find(request => request.friendship.id === friendshipId);
      
      if (acceptedRequest) {
        // 友人リストを更新
        setFriends(prev => [...prev, acceptedRequest]);
        
        // 保留中リクエストリストを更新
        setPendingRequests(prev => prev.filter(request => request.friendship.id !== friendshipId));
      }
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人リクエストの承認に失敗しました');
      return false;
    }
  };

  // 友人リクエストを拒否
  const declineFriendRequest = async (friendshipId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: FriendshipStatus.DECLINED })
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      // 保留中リクエストリストを更新
      setPendingRequests(prev => prev.filter(request => request.friendship.id !== friendshipId));
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人リクエストの拒否に失敗しました');
      return false;
    }
  };

  // 友人リクエストをキャンセル
  const cancelFriendRequest = async (friendshipId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      // 送信済みリクエストリストを更新
      setSentRequests(prev => prev.filter(request => request.friendship.id !== friendshipId));
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人リクエストのキャンセルに失敗しました');
      return false;
    }
  };

  // 友人関係を解除
  const removeFriend = async (friendshipId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      // 友人リストを更新
      setFriends(prev => prev.filter(friend => friend.friendship.id !== friendshipId));
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '友人関係の解除に失敗しました');
      return false;
    }
  };

  // プライバシー設定を更新
  const updatePrivacySettings = async (friendshipId: string, privacyLevel: PrivacyLevel) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ privacy_level: privacyLevel })
        .eq('id', friendshipId);
      
      if (error) throw error;
      
      // 友人リストのプライバシー設定を更新
      setFriends(prev => prev.map(friend => {
        if (friend.friendship.id === friendshipId) {
          return {
            ...friend,
            friendship: {
              ...friend.friendship,
              privacy_level: privacyLevel
            }
          };
        }
        return friend;
      }));
      
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'プライバシー設定の更新に失敗しました');
      return false;
    }
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    searchResults,
    searchLoading,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    updatePrivacySettings,
    refreshFriends: fetchFriends
  };
} 