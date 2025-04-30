export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  name: string;
  avatar: string;
  streak: number;
  totalPoints: number;
  badges: Badge[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  target_minutes_per_day: number;
  current_minutes_per_day: number;
  streak_days: number;
  created_at: string;
  updated_at?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  goal_id: string;
  minutes: number;
  notes?: string;
  date: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  category: string;
  created_by: string;
  start_date: string;
  end_date: string;
  target_minutes: number;
  created_at: string;
  updated_at?: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  total_minutes: number;
  user?: User;
}

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  type: 'achievement' | 'reminder' | 'challenge';
  created_at: string;
  data?: any;
};

export const CATEGORIES: Category[] = [
  { id: 'language', name: '語学', color: 'blue' },
  { id: 'programming', name: 'プログラミング', color: 'emerald' },
  { id: 'math', name: '数学', color: 'purple' },
  { id: 'science', name: '科学', color: 'cyan' },
  { id: 'business', name: 'ビジネス', color: 'amber' },
  { id: 'art', name: '芸術', color: 'rose' },
  { id: 'music', name: '音楽', color: 'indigo' },
  { id: 'sports', name: 'スポーツ', color: 'orange' },
  { id: 'cooking', name: '料理', color: 'red' },
  { id: 'reading', name: '読書', color: 'lime' },
  { id: 'writing', name: '執筆', color: 'sky' },
  { id: 'meditation', name: '瞑想', color: 'violet' },
  { id: 'other', name: 'その他', color: 'gray' }
];

export interface Session {
  id: string;
  user_id: string;
  goal_id: string;
  timestamp: string;
  duration_minutes: number;
  notes?: string;
  mood?: 'great' | 'good' | 'neutral' | 'difficult' | 'frustrated';
  completed_tasks?: string[];
}

export interface AiSuggestion {
  id: string;
  user_id: string;
  goal_id?: string;
  title: string;
  description: string;
  type: string;
  is_applied: boolean;
  expires_at: string;
  created_at?: string;
  metadata?: any;
}