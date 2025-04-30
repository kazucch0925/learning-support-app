import { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Flame, Sparkles, Lightbulb, InfoIcon, Edit } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import GoalCard from '../components/GoalCard';
import AiAssistantSection from '../components/AiAssistantSection';
import LearningTree from '../components/LearningTree';
import GoalForm from '../components/GoalForm';
import LogSessionForm from '../components/LogSessionForm';
import Modal from '../components/ui/Modal';
import Tooltip from '../components/ui/Tooltip';
import { useGoals } from '../hooks/useGoals';
import { useAuth } from '../contexts/AuthContext';
import { useLearningSession } from '../hooks/useLearningSession';
import { useReminders } from '../hooks/useReminders';
import { useUserData } from '../hooks/useUserData';
import { useGoalAdjustment } from '../hooks/useGoalAdjustment';
import { useAiAssistant } from '../hooks/useAiAssistant';
import type { Database } from '../lib/database.types';
import Avatar from '../components/Avatar';
import ProfileEditModal from '../components/ProfileEditModal';
import DailyBonusHandler from '../components/dashboard/DailyBonusHandler';
import toast from 'react-hot-toast';
import { isToday } from 'date-fns';
import { supabase } from '../lib/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];

interface DashboardProps {
  onNavigate?: (path: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const { userData, loading: userDataLoading, updateUserData, refreshUserData } = useUserData();
  const { goals, loading, addGoal, updateGoal, deleteGoal, refreshGoals, restartGoal } = useGoals();
  const { logSession } = useLearningSession();
  const { 
    createReminder, 
    createAnchoringHabit, 
    refreshReminders, 
    refreshAnchoringHabits, 
    reminders, 
    anchoringHabits,
    deleteReminder,
    deleteAnchoringHabit
  } = useReminders();
  const { adjustGoal } = useGoalAdjustment();
  const { suggestions, dismissSuggestion, analyzeOptimalLearningTime, suggestLearningMethod, refreshSuggestions, loading: suggestionsLoading } = useAiAssistant();
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loggingSessionForGoal, setLoggingSessionForGoal] = useState<Goal | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [goalTodayMinutes, setGoalTodayMinutes] = useState<Record<string, number>>({});

  // 今日の学習時間を取得する関数
  const fetchTodayMinutesForGoal = async (goalId: string) => {
    try {
      // 今日の日付の開始と終了を設定
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('learning_sessions')
        .select('duration')
        .eq('goal_id', goalId)
        .gte('completed_at', startOfToday.toISOString())
        .lte('completed_at', endOfToday.toISOString());

      if (error) {
        console.error('Error fetching today\'s learning sessions:', error);
        return 0;
      }

      // 今日の合計学習時間を計算
      return data.reduce((sum, session) => sum + (session.duration || 0), 0);
    } catch (err) {
      console.error('Failed to fetch today\'s learning data:', err);
      return 0;
    }
  };

  // 学習記録ダイアログを開く際に今日の学習時間を取得
  const handleOpenLogSession = async (goal: Goal) => {
    setLoggingSessionForGoal(goal);
    const todayMinutes = await fetchTodayMinutesForGoal(goal.id);
    setGoalTodayMinutes(prev => ({ ...prev, [goal.id]: todayMinutes }));
  };

  useEffect(() => {
    if (goals.length === 0 || loading) return;

    const checkAndAdjustGoals = async () => {
      for (const goal of goals) {
        if (goal.streak_days >= 5) {
          await adjustGoal(goal.id);
        }
      }
    };

    checkAndAdjustGoals();
  }, [goals, loading]);

  const handleAddGoal = async (goalData: Partial<Goal>) => {
    if (!goalData.title || !goalData.categories || goalData.categories.length === 0) {
      console.error('タイトルとカテゴリは必須です');
      return;
    }
    
    const newGoal = {
      title: goalData.title,
      categories: goalData.categories,
      description: goalData.description || null,
      target_minutes_per_day: goalData.target_minutes_per_day || 10,
      current_minutes_per_day: goalData.current_minutes_per_day || 0
    };
    
    await addGoal(newGoal);
    setShowAddGoal(false);
  };

  const handleUpdateGoal = async (goalData: Partial<Goal>) => {
    if (editingGoal) {
      const updateData = { ...goalData };
      delete updateData.current_minutes_per_day;
      
      await updateGoal(editingGoal.id, updateData);
      setEditingGoal(null);
      
      refreshSuggestions(); 
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
  };

  const handleLogSession = async (duration: number, notes: string, date?: Date) => {
    if (loggingSessionForGoal) {
      try {
        const result = await logSession(loggingSessionForGoal.id, duration, notes, date);
        
        if (result && result.success && result.points_earned > 0) {
          toast.success(`学習を記録！ +${result.points_earned}ポイント獲得しました！✨`);
        } else if (result && result.success) {
          const message = date && !isToday(date) 
            ? '過去の学習記録を追加しました。' 
            : (result.message || '学習を記録しました。');
          toast.success(message);
        } else if (!result?.success) {
           toast.error(result?.message || '学習の記録に失敗しました。');
        }

        if(result?.success) {
            if (!date || isToday(date)) {
              await adjustGoal(loggingSessionForGoal.id);
              
              const goalInfo = goals.find(g => g.id === loggingSessionForGoal.id);
              const currentStreak = result.streak; 
              if (goalInfo && currentStreak >= 5) { 
                await analyzeOptimalLearningTime();
                await suggestLearningMethod(loggingSessionForGoal.id);
              }
            }
            
            refreshGoals();
            refreshSuggestions();
            refreshUserData();
        }

        setLoggingSessionForGoal(null);
      } catch (error) {
        console.error('学習セッションの記録処理中にエラーが発生しました:', error);
        setLoggingSessionForGoal(null);
      }
    }
  };

  const handleSetReminder = async (goalId: string, reminderTime: string, daysOfWeek: number[]) => {
    try {
      await createReminder(goalId, reminderTime, daysOfWeek);
      refreshReminders();
    } catch (error) {
      console.error('リマインダーの設定に失敗しました:', error);
    }
  };

  const handleSetAnchoringHabit = async (goalId: string, existingHabit: string, triggerTime: string | null, notes: string) => {
    try {
      await createAnchoringHabit(goalId, existingHabit, triggerTime, notes);
      refreshAnchoringHabits();
    } catch (error) {
      console.error('習慣アンカリングの設定に失敗しました:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
      refreshReminders();
    } catch (error) {
      console.error('リマインダーの削除に失敗しました:', error);
    }
  };

  const handleDeleteAnchoringHabit = async (habitId: string) => {
    try {
      await deleteAnchoringHabit(habitId);
      refreshAnchoringHabits();
    } catch (error) {
      console.error('習慣アンカリングの削除に失敗しました:', error);
    }
  };

  const handleRestartGoal = async (goalId: string) => {
    try {
      await restartGoal(goalId);
      refreshGoals();
    } catch (error) {
      console.error('目標の再スタートに失敗しました:', error);
    }
  };

  if (loading || userDataLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DailyBonusHandler refreshUserData={refreshUserData} />

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center text-gray-900">
            <Flame className="h-5 w-5 mr-2 text-emerald-600" />
            あなたの学習の木
            <Tooltip 
              content="「学習の木」はあなたの学習活動をゲーム感覚で可視化するものです。毎日の学習を記録することで木が成長し、葉が増えていきます。継続日数に応じて木の大きさが変わり、総ポイントが増えるほど実がなります。学習の達成感を視覚的に感じることができます。画面右上のポイント表示で総獲得ポイントを確認できます。" 
              position="bottom"
              width="max-w-md"
            >
              <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
            </Tooltip>
          </h2>
          <div className="flex flex-col items-end space-y-1">
            <button 
              className="flex items-center space-x-2 cursor-pointer group rounded-md p-1 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2" 
              onClick={() => setShowProfileModal(true)}
              aria-label="プロフィールを編集"
            >
              <span className="text-sm font-medium text-gray-700 hidden sm:inline group-hover:text-teal-600">
                {userData?.name || 'User'}
              </span>
              <Avatar 
                src={userData?.avatar_url}
                name={userData?.name}
                size={32} 
                className="border border-gray-200 group-hover:border-teal-400"
              />
            </button>
            <div className="flex items-center space-x-2 text-xs">
              {userData && userData.first_challenge_streak_count > 0 && (
                <span className="font-medium text-teal-600 flex items-center">
                  <Flame className="h-3 w-3 mr-1" />
                  連続 {userData.first_challenge_streak_count} 日
                </span>
              )}
              <span className="text-gray-500">|</span>
              <span className="text-gray-500">総ポイント:</span>
              <span className="font-medium text-emerald-600">{userData?.total_points || 0} pt</span>
            </div>
          </div>
        </div>
        <LearningTree 
          goals={goals} 
          totalPoints={userData?.total_points || 0}
          streakDays={userData?.streak_days || 0}
        />
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center text-gray-900">
            <BookOpen className="h-5 w-5 mr-2 text-teal-600" />
            学習目標
            <Tooltip 
              content="「学習目標」では具体的な学習目標を設定・管理できます。右上の「新しい目標」ボタンから目標を追加できます。各目標カードでは、進捗状況の確認、学習時間の記録、リマインダーの設定ができます。「リマインド」ボタンで学習時間の通知を設定（最大5個）、「習慣化」ボタンで既存の習慣と紐付け（最大5個）ができます。「詳細」ボタンをクリックすると、設定済みのリマインダーや習慣アンカリングを確認・削除できます。「学習を記録」ボタンで日々の学習時間を記録しましょう。" 
              position="bottom"
              width="max-w-md"
            >
              <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
            </Tooltip>
          </h2>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowAddGoal(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            新しい目標
          </Button>
        </div>

        {goals.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-3">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="text-lg font-medium text-gray-700">目標がまだありません</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  小さな目標から始めて、学習習慣を作りましょう。
                </p>
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => setShowAddGoal(true)}
                  className="mt-2"
                  icon={<Plus className="h-4 w-4" />}
                >
                  最初の目標を作成
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(goal => {
              return (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  reminders={reminders}
                  anchoringHabits={anchoringHabits}
                  suggestions={suggestions}
                  onEdit={() => setEditingGoal(goal)}
                  onDelete={() => handleDeleteGoal(goal.id)}
                  onLogSession={() => handleOpenLogSession(goal)}
                  onSetReminder={handleSetReminder}
                  onSetAnchoringHabit={handleSetAnchoringHabit}
                  onRestart={handleRestartGoal}
                  onDeleteReminder={handleDeleteReminder}
                  onDeleteAnchoringHabit={handleDeleteAnchoringHabit}
                  onDismissSuggestion={dismissSuggestion}
                />
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center text-gray-900">
            <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
            AIアシスタントからの提案
            <Tooltip 
              content="「AIアシスタント」はあなたの学習データを分析し、パーソナライズされた提案を行います。最適な学習時間帯や効果的な学習方法、集中力を高めるテクニックなどが提案されます。各提案カードに表示される「適用する」ボタンをクリックすると提案を取り入れることができます。「詳細を見る」で詳しい説明を確認できます。AIの提案は学習を継続するほど精度が高まり、あなたの学習スタイルに合わせた内容になります。" 
              position="bottom"
              width="max-w-md"
            >
              <InfoIcon className="h-4 w-4 ml-1 text-gray-400" />
            </Tooltip>
          </h2>
        </div>
        <AiAssistantSection />
      </section>

      <Modal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        title="新しい目標の作成"
      >
        <GoalForm 
          onSubmit={handleAddGoal} 
          onCancel={() => setShowAddGoal(false)} 
        />
      </Modal>

      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="目標の編集"
      >
        {editingGoal && (
          <GoalForm 
            initialGoal={editingGoal} 
            onSubmit={handleUpdateGoal} 
            onCancel={() => setEditingGoal(null)} 
          />
        )}
      </Modal>

      <Modal
        isOpen={!!loggingSessionForGoal}
        onClose={() => setLoggingSessionForGoal(null)}
        title="学習セッションの記録"
      >
        {loggingSessionForGoal && (
          <LogSessionForm 
            goal={loggingSessionForGoal}
            todayMinutes={goalTodayMinutes[loggingSessionForGoal.id] || 0}
            onSubmit={handleLogSession}
            onCancel={() => setLoggingSessionForGoal(null)}
          />
        )}
      </Modal>

      {userData && (
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userData={userData}
          updateUserData={updateUserData}
          refreshUserData={refreshUserData}
        />
      )}
    </div>
  );
}