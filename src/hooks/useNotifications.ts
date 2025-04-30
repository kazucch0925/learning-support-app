import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

export function useNotifications() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const fetchedNotifications = data || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);

    } catch (e) {
      console.error("Error fetching notifications:", e);
      setError(e instanceof Error ? e.message : '通知の取得に失敗しました');
      toast.error('通知の取得に失敗しました');
    } finally {
      // setLoading は useEffect で管理
    }
  }, [supabase]);

  useEffect(() => {
    if (!isClerkLoaded) {
      setLoading(true);
      return;
    }
    if (clerkUser) {
        setLoading(true);
        fetchNotifications().finally(() => setLoading(false));
    }
    else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
    }
  }, [isClerkLoaded, clerkUser, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      if (error) throw error;
      setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('通知を既読にしました');
    } catch (e) {
      console.error("Error marking notification as read:", e);
      setError(e instanceof Error ? e.message : '通知の更新に失敗しました');
      toast.error('通知の更新に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase]);

  const markAllAsRead = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      if (error) throw error;
      setNotifications(prev =>
          prev.map(n => n.is_read ? n : { ...n, is_read: true })
      );
      setUnreadCount(0);
      toast.success('すべての通知を既読にしました');
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
      setError(e instanceof Error ? e.message : '通知の更新に失敗しました');
      toast.error('通知の一括既読に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
      await fetchNotifications(); // 再フェッチして状態を更新
      toast.success('通知を削除しました');
    } catch (e) {
      console.error("Error deleting notification:", e);
      setError(e instanceof Error ? e.message : '通知の削除に失敗しました');
      toast.error('通知の削除に失敗しました');
      throw e;
    } finally {
        setLoading(false);
    }
  }, [supabase, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications
  };
}