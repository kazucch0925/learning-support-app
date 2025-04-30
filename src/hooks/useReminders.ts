import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Reminder {
  id: string;
  goal_id: string;
  reminder_time: string;
  days_of_week: number[];
  is_enabled: boolean;
  goal: {
    title: string;
  };
}

interface AnchoringHabit {
  id: string;
  goal_id: string;
  existing_habit: string;
  trigger_time: string | null;
  notes: string | null;
  goal: {
    title: string;
  };
}

export function useReminders() {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [anchoringHabits, setAnchoringHabits] = useState<AnchoringHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReminders = useCallback(async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (e) {
      console.error('リマインダーの取得に失敗しました:', e);
      setError(e instanceof Error ? e.message : 'リマインダーの取得に失敗しました');
      toast.error('リマインダーの取得に失敗しました');
    } finally {
    }
  }, [supabase]);

  const fetchAnchoringHabits = useCallback(async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('anchoring_habits')
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnchoringHabits(data || []);
    } catch (e) {
      console.error('習慣アンカリングの取得に失敗しました:', e);
      setError(e instanceof Error ? e.message : '習慣アンカリングの取得に失敗しました');
      toast.error('習慣アンカリングの取得に失敗しました');
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
      Promise.all([fetchReminders(), fetchAnchoringHabits()])
        .catch((err) => {
            console.error("Error during initial fetch:", err);
        })
        .finally(() => setLoading(false));
    } else {
      setReminders([]);
      setAnchoringHabits([]);
      setError(null);
      setLoading(false);
    }
  }, [isClerkLoaded, clerkUser, fetchReminders, fetchAnchoringHabits]);

  const createReminder = useCallback(async (goalId: string, reminderTime: string, daysOfWeek: number[]) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          goal_id: goalId,
          reminder_time: reminderTime,
          days_of_week: daysOfWeek,
          is_enabled: true
        }])
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .single();

      if (error) throw error;
      await fetchReminders();
      toast.success('リマインダーを作成しました');
      return data;
    } catch (e) {
      console.error('リマインダーの作成に失敗しました:', e);
      setError(e instanceof Error ? e.message : 'リマインダーの作成に失敗しました');
      toast.error('リマインダーの作成に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchReminders, clerkUser]);

  const createAnchoringHabit = useCallback(async (
    goalId: string,
    existingHabit: string,
    triggerTime?: string | null,
    notes?: string
  ) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('anchoring_habits')
        .insert([{
          goal_id: goalId,
          existing_habit: existingHabit,
          trigger_time: triggerTime,
          notes
        }])
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .single();

      if (error) throw error;
      await fetchAnchoringHabits();
      toast.success('習慣アンカリングを作成しました');
      return data;
    } catch (e) {
      console.error('習慣アンカリングの作成に失敗しました:', e);
      setError(e instanceof Error ? e.message : '習慣アンカリングの作成に失敗しました');
      toast.error('習慣アンカリングの作成に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchAnchoringHabits, clerkUser]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Omit<Reminder, 'id' | 'goal_id' | 'goal'>>) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .single();

      if (error) throw error;
      await fetchReminders();
      toast.success('リマインダーを更新しました');
      return data;
    } catch (e) {
      console.error('リマインダーの更新に失敗しました:', e);
      setError(e instanceof Error ? e.message : 'リマインダーの更新に失敗しました');
      toast.error('リマインダーの更新に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchReminders, clerkUser]);

  const updateAnchoringHabit = useCallback(async (id: string, updates: Partial<Omit<AnchoringHabit, 'id' | 'goal_id' | 'goal'>>) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('anchoring_habits')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .single();

      if (error) throw error;
      await fetchAnchoringHabits();
      toast.success('習慣アンカリングを更新しました');
      return data;
    } catch (e) {
      console.error('習慣アンカリングの更新に失敗しました:', e);
      setError(e instanceof Error ? e.message : '習慣アンカリングの更新に失敗しました');
      toast.error('習慣アンカリングの更新に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchAnchoringHabits, clerkUser]);

  const deleteReminder = useCallback(async (id: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchReminders();
      toast.success('リマインダーを削除しました');
    } catch (e) {
      console.error('リマインダーの削除に失敗しました:', e);
      setError(e instanceof Error ? e.message : 'リマインダーの削除に失敗しました');
      toast.error('リマインダーの削除に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchReminders, clerkUser]);

  const deleteAnchoringHabit = useCallback(async (id: string) => {
    if (!clerkUser) {
        toast.error('ログインしていません。');
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('anchoring_habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAnchoringHabits();
      toast.success('習慣アンカリングを削除しました');
    } catch (e) {
      console.error('習慣アンカリングの削除に失敗しました:', e);
      setError(e instanceof Error ? e.message : '習慣アンカリングの削除に失敗しました');
      toast.error('習慣アンカリングの削除に失敗しました');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [fetchAnchoringHabits, clerkUser]);

  return {
    reminders,
    anchoringHabits,
    loading,
    error,
    createReminder,
    createAnchoringHabit,
    updateReminder,
    updateAnchoringHabit,
    deleteReminder,
    deleteAnchoringHabit
  };
}