import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

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
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [anchoringHabits, setAnchoringHabits] = useState<AnchoringHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchReminders();
    fetchAnchoringHabits();
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リマインダーの取得に失敗しました');
    }
  };

  const fetchAnchoringHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('anchoring_habits')
        .select(`
          *,
          goal:goals (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnchoringHabits(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '習慣アンカリングの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async (goalId: string, reminderTime: string, daysOfWeek: number[]) => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          user_id: user?.id,
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
      setReminders(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リマインダーの作成に失敗しました');
      throw e;
    }
  };

  const createAnchoringHabit = async (
    goalId: string,
    existingHabit: string,
    triggerTime?: string | null,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('anchoring_habits')
        .insert([{
          user_id: user?.id,
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
      setAnchoringHabits(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : '習慣アンカリングの作成に失敗しました');
      throw e;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
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
      setReminders(prev => prev.map(r => r.id === id ? data : r));
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リマインダーの更新に失敗しました');
      throw e;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'リマインダーの削除に失敗しました');
      throw e;
    }
  };

  const deleteAnchoringHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('anchoring_habits')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAnchoringHabits(prev => prev.filter(h => h.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '習慣アンカリングの削除に失敗しました');
      throw e;
    }
  };

  return {
    reminders,
    anchoringHabits,
    loading,
    error,
    createReminder,
    createAnchoringHabit,
    updateReminder,
    deleteReminder,
    deleteAnchoringHabit,
    refreshReminders: fetchReminders,
    refreshAnchoringHabits: fetchAnchoringHabits,
  };
}