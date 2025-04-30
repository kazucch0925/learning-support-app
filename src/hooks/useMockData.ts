import { useState, useEffect } from 'react';
import { User, Goal, Badge, AiSuggestion, TeamGoal, LearningSession } from '../types';

// Generate a mock user
const generateUser = (): User => {
  return {
    id: '1',
    name: 'Alex Johnson',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    streak: 14,
    totalPoints: 2350,
    badges: generateBadges(),
  };
};

// Generate mock badges
const generateBadges = (): Badge[] => {
  return [
    {
      id: '1',
      name: 'First Step',
      description: 'Complete your first learning session',
      icon: 'award',
      unlockedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    },
    {
      id: '2',
      name: 'Week Warrior',
      description: 'Complete 7 consecutive days',
      icon: 'flame',
      unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      id: '3',
      name: 'Steady Pace',
      description: 'Learn for 30+ minutes in one session',
      icon: 'clock',
      unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      id: '4',
      name: 'Early Bird',
      description: 'Complete a session before 8 AM',
      icon: 'sun',
      unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: '5',
      name: 'Night Owl',
      description: 'Complete a session after 10 PM',
      icon: 'moon',
      unlockedAt: null,
    },
    {
      id: '6',
      name: 'Team Player',
      description: 'Join a group learning goal',
      icon: 'users',
      unlockedAt: null,
    },
    {
      id: '7',
      name: 'Milestone Maker',
      description: 'Reach 30 days of continuous learning',
      icon: 'target',
      unlockedAt: null,
    },
    {
      id: '8',
      name: 'Focus Master',
      description: 'Complete a 60+ minute session',
      icon: 'zap',
      unlockedAt: null,
    },
  ];
};

// Generate mock goals
const generateGoals = (): Goal[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return [
    {
      id: '1',
      userId: '1',
      title: 'Learn Japanese',
      description: 'Master basic conversational Japanese for my trip',
      targetMinutesPerDay: 15,
      currentMinutesPerDay: 15,
      category: 'Language',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      streakDays: 14,
      lastCompletedAt: today,
    },
    {
      id: '2',
      userId: '1',
      title: 'Python Programming',
      description: 'Build a simple machine learning project',
      targetMinutesPerDay: 20,
      currentMinutesPerDay: 20,
      category: 'Programming',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      streakDays: 10,
      lastCompletedAt: yesterday,
    },
    {
      id: '3',
      userId: '1',
      title: 'Guitar Practice',
      description: 'Learn to play my favorite songs',
      targetMinutesPerDay: 10,
      currentMinutesPerDay: 10,
      category: 'Music',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      streakDays: 5,
      lastCompletedAt: today,
    },
  ];
};

// Generate mock AI suggestions
const generateAiSuggestions = (): AiSuggestion[] => {
  return [
    {
      id: '1',
      userId: '1',
      title: 'Try studying in the morning',
      description: 'Based on your learning patterns, you seem to retain information better in the morning. Consider shifting your Japanese studies to before 10 AM.',
      type: 'timing',
      createdAt: new Date(),
      isApplied: false,
    },
    {
      id: '2',
      userId: '1',
      title: 'Use spaced repetition for vocabulary',
      description: 'Your language learning could benefit from spaced repetition techniques. Try reviewing vocabulary in increasing intervals.',
      type: 'method',
      createdAt: new Date(),
      isApplied: false,
    },
    {
      id: '3',
      userId: '1',
      title: 'Add 5 minutes to your daily guitar practice',
      description: 'You\'ve been consistent with your 10-minute practice sessions. Consider increasing to 15 minutes to challenge yourself.',
      type: 'content',
      createdAt: new Date(),
      isApplied: false,
    },
  ];
};

// Generate mock team goals
const generateTeamGoals = (): TeamGoal[] => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  return [
    {
      id: '1',
      title: 'Coding Challenge Group',
      description: 'Complete 10 coding challenges together',
      members: [
        {
          id: '2',
          name: 'Taylor Swift',
          avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
          streak: 7,
          totalPoints: 1200,
          badges: [],
        },
        {
          id: '3',
          name: 'Sam Chen',
          avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
          streak: 12,
          totalPoints: 1800,
          badges: [],
        },
        {
          id: '4',
          name: 'Maria Rodriguez',
          avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150',
          streak: 5,
          totalPoints: 950,
          badges: [],
        },
      ],
      targetCompletionDate: futureDate,
      progress: 35,
    },
    {
      id: '2',
      title: 'Japanese Study Club',
      description: 'Practice conversation weekly and learn 500 common words',
      members: [
        {
          id: '5',
          name: 'David Kim',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          streak: 21,
          totalPoints: 2500,
          badges: [],
        },
        {
          id: '6',
          name: 'Emma Davis',
          avatar: 'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=150',
          streak: 15,
          totalPoints: 1850,
          badges: [],
        },
      ],
      targetCompletionDate: futureDate,
      progress: 42,
    },
  ];
};

// Generate mock learning sessions
const generateLearningSessions = (): LearningSession[] => {
  const sessions: LearningSession[] = [];
  const now = new Date();
  
  // Generate 30 sessions for the past 15 days (2 per day on average)
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 15);
    const completedAt = new Date(now);
    completedAt.setDate(completedAt.getDate() - daysAgo);
    completedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    sessions.push({
      id: `session-${i}`,
      goalId: ['1', '2', '3'][Math.floor(Math.random() * 3)], // Random goal ID
      userId: '1',
      duration: 10 + Math.floor(Math.random() * 50), // Between 10 and 60 minutes
      completedAt,
      notes: i % 5 === 0 ? 'Great session today, feeling motivated!' : '',
    });
  }
  
  // Sort by date (newest first)
  return sessions.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
};

export default function useMockData() {
  const [user, setUser] = useState<User | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [teamGoals, setTeamGoals] = useState<TeamGoal[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      setUser(generateUser());
      setGoals(generateGoals());
      setBadges(generateBadges());
      setAiSuggestions(generateAiSuggestions());
      setTeamGoals(generateTeamGoals());
      setSessions(generateLearningSessions());
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Add a goal
  const addGoal = (goal: Partial<Goal>) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      userId: '1',
      title: goal.title || '',
      description: goal.description || '',
      targetMinutesPerDay: goal.targetMinutesPerDay || 10,
      currentMinutesPerDay: goal.currentMinutesPerDay || 10,
      category: goal.category || 'Other',
      createdAt: new Date(),
      streakDays: 0,
      lastCompletedAt: null,
    };
    
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  };
  
  // Update a goal
  const updateGoal = (id: string, updatedGoal: Partial<Goal>) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, ...updatedGoal } : goal
    ));
  };
  
  // Delete a goal
  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };
  
  // Log a learning session
  const logSession = (goalId: string, duration: number, notes: string) => {
    const newSession: LearningSession = {
      id: `session-${Date.now()}`,
      goalId,
      userId: '1',
      duration,
      completedAt: new Date(),
      notes,
    };
    
    setSessions(prev => [newSession, ...prev]);
    
    // Update the goal's streak and last completed date
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const today = new Date();
        const lastCompleted = goal.lastCompletedAt ? new Date(goal.lastCompletedAt) : null;
        
        // Check if this is the first time or a continuation of the streak
        let newStreakDays = goal.streakDays;
        
        if (!lastCompleted) {
          // First time completing
          newStreakDays = 1;
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const isYesterday = lastCompleted.getDate() === yesterday.getDate() &&
                             lastCompleted.getMonth() === yesterday.getMonth() &&
                             lastCompleted.getFullYear() === yesterday.getFullYear();
                             
          if (isYesterday) {
            // Continuing the streak
            newStreakDays += 1;
          } else {
            // Not yesterday, check if it's the same day (already completed today)
            const isSameDay = lastCompleted.getDate() === today.getDate() &&
                             lastCompleted.getMonth() === today.getMonth() &&
                             lastCompleted.getFullYear() === today.getFullYear();
                             
            if (!isSameDay) {
              // Not yesterday and not today, reset streak
              newStreakDays = 1;
            }
          }
        }
        
        // Update user points based on streak
        setUser(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            totalPoints: prev.totalPoints + duration + (newStreakDays > 10 ? 10 : 0),
            streak: Math.max(prev.streak, newStreakDays),
          };
        });
        
        return {
          ...goal,
          lastCompletedAt: today,
          streakDays: newStreakDays,
          // Optionally adjust the current target based on consistency
          currentMinutesPerDay: goal.targetMinutesPerDay < duration 
            ? Math.min(goal.targetMinutesPerDay + 1, 60) 
            : goal.currentMinutesPerDay,
        };
      }
      return goal;
    }));
    
    return newSession;
  };
  
  // Handle AI suggestions
  const applyAiSuggestion = (id: string) => {
    setAiSuggestions(prev => prev.map(suggestion => 
      suggestion.id === id ? { ...suggestion, isApplied: true } : suggestion
    ));
    
    // Remove from the active suggestions list
    setTimeout(() => {
      setAiSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
    }, 500);
  };
  
  const dismissAiSuggestion = (id: string) => {
    setTimeout(() => {
      setAiSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
    }, 300);
  };
  
  // Join a team
  const joinTeam = (teamId: string) => {
    setTeamGoals(prev => prev.map(team => {
      if (team.id === teamId && user) {
        // Check if user is already a member
        if (team.members.some(member => member.id === user.id)) {
          return team;
        }
        
        return {
          ...team,
          members: [...team.members, user],
        };
      }
      return team;
    }));
  };
  
  return {
    user,
    goals,
    badges,
    aiSuggestions,
    teamGoals,
    sessions,
    isLoading,
    actions: {
      addGoal,
      updateGoal,
      deleteGoal,
      logSession,
      applyAiSuggestion,
      dismissAiSuggestion,
      joinTeam,
    },
  };
}