import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { toast } from 'react-hot-toast';

// Explicitly define the type for the user data we expect
// Add the new fields here
type UserData = {
  id: string;
  name: string;
  avatar_url: string | null;
  streak_days: number;
  total_points: number;
  created_at: string;
  updated_at: string;
  bio: string | null;
  last_first_challenge_date: string | null; // Add this
  first_challenge_streak_count: number; // Add this
};

export function useUserData() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        // Add the new fields to the select query
        .select('id, name, avatar_url, streak_days, total_points, created_at, updated_at, bio, last_first_challenge_date, first_challenge_streak_count') 
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Case where profile doesn't exist yet
          console.warn('User profile not found, possibly new user.');
          setUserData(null); // Set to null if not found
        } else {
          throw error;
        }
      } else {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('ユーザーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Ensure refreshUserData also calls fetchUserData
  const refreshUserData = useCallback(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Make sure updateUserData returns the updated type if needed
  const updateUserData = useCallback(async (updateData: Partial<Omit<UserData, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;
    // ... implementation of update ...
    // After successful update, refresh the data
    refreshUserData();
  }, [user, refreshUserData]);

  return { userData, loading, error, updateUserData, refreshUserData };
}