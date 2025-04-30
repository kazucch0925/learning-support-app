import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Award, TrendingUp, Edit, Trash, CheckCircle, ChevronRight, Bell, BarChart2, RotateCcw, ArrowUpRight, ArrowDownRight, X, Flame, Trophy, Target, Info, Trash2, Plus } from 'lucide-react';
import type { Database, Json } from '../lib/database.types';
import { CATEGORIES, Category, AiSuggestion } from '../types';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import Badge from './ui/Badge';
import ProgressBar from './ui/ProgressBar';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ReminderForm from './ReminderForm';
import Tooltip from './ui/Tooltip';
import GoalDetailModal from './GoalDetailModal';
import { formatDistanceToNowStrict, differenceInDays, parseISO, format, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

// 完全な型定義を使用
type DetailReminder = Database['public']['Tables']['reminders']['Row'];
type DetailSuggestion = Database['public']['Tables']['ai_suggestions']['Row'];

// 簡易版の型定義（コンポーネント内部でのみ使用）
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

interface Suggestion {
  id: string;
  goal_id: string;
  type: string;
  title: string;
  description: string;
  is_applied: boolean;
}

interface GoalCardProps {
  goal: Goal;
  reminders: DetailReminder[]; 
  anchoringHabits: any[]; // Keeping this for compatibility, but not using
  suggestions: DetailSuggestion[];
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onLogSession: (goal: Goal) => void;
  onSetReminder: (goalId: string, reminderTime: string, daysOfWeek: number[]) => void;
  onSetAnchoringHabit: (goalId: string, existingHabit: string, triggerTime: string | null, notes: string) => void; // Keeping for compatibility
  onRestart: (goalId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  onDeleteAnchoringHabit: (habitId: string) => void; // Keeping for compatibility
  onDismissSuggestion: (suggestionId: string) => void;
}

// Helper function to calculate remaining days
const calculateRemainingDays = (deadline: string | null): number | null => {
  if (!deadline) return null;
  try {
    const deadlineDate = parseISO(deadline); // Assumes YYYY-MM-DD format
    const today = new Date();
    // Set today to the start of the day for accurate difference calculation
    today.setHours(0, 0, 0, 0);
    return differenceInDays(deadlineDate, today);
  } catch (e) {
    console.error("Error calculating remaining days:", e);
    return null;
  }
};

export default function GoalCard({ 
  goal, 
  reminders,
  anchoringHabits,
  suggestions,
  onEdit, 
  onDelete, 
  onLogSession,
  onSetReminder,
  onSetAnchoringHabit,
  onRestart,
  onDeleteReminder,
  onDeleteAnchoringHabit,
  onDismissSuggestion
}: GoalCardProps) {
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showReminderList, setShowReminderList] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date();
  const lastCompleted = goal.last_completed_at ? new Date(goal.last_completed_at) : null;
  
  // 今日の学習時間を取得
  useEffect(() => {
    const fetchTodayLearning = async () => {
      setIsLoading(true);
      try {
        // 今日の日付の開始と終了を設定
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from('learning_sessions')
          .select('duration')
          .eq('goal_id', goal.id)
          .gte('completed_at', startOfDay.toISOString())
          .lte('completed_at', endOfDay.toISOString());

        if (error) {
          console.error('Error fetching today\'s learning sessions:', error);
          return;
        }

        // 今日の合計学習時間を計算
        const totalMinutes = data.reduce((sum, session) => sum + (session.duration || 0), 0);
        setTodayMinutes(totalMinutes);
      } catch (err) {
        console.error('Failed to fetch today\'s learning data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayLearning();
  }, [goal.id]);

  // 今日の学習目標達成状況
  const isCompletedToday = lastCompleted ? 
    isToday(new Date(lastCompleted)) &&
    (todayMinutes >= goal.target_minutes_per_day) : false;
  
  const createdAt = new Date(goal.created_at);
  const daysActive = Math.ceil((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const goalCategories = goal.categories?.map(categoryId => 
    CATEGORIES.find(c => c.id === categoryId)
  ).filter(Boolean) as Category[] || [];

  const displayCategories = goalCategories.slice(0, 3);
  const remainingCategories = Math.max(0, goalCategories.length - 3);

  const goalReminders = reminders.filter(r => r.goal_id === goal.id);
  const goalSuggestions = suggestions.filter(s => s.goal_id === goal.id);
  
  // リマインダーの最大数（上限5個）
  const maxReminders = 5;
  const canAddReminder = goalReminders.length < maxReminders;

  // Calculate remaining days, handle potential undefined
  const remainingDays = calculateRemainingDays(goal.deadline ?? null);

  const handleRestart = () => {
    setShowRestartConfirm(true);
  };

  const confirmRestart = async () => {
    await onRestart(goal.id);
    setShowRestartConfirm(false);
  };

  const needsRestart = goal.last_completed_at && 
    (new Date().getTime() - new Date(goal.last_completed_at).getTime()) > 7 * 24 * 60 * 60 * 1000;

  const formatDaysOfWeek = (days: number[]) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return [...days].sort((a, b) => a - b).map(d => dayNames[d]).join('・');
  };
  
  const renderGoalAdjustmentStatus = () => {
    const adjustmentSuggestion = suggestions.find(
      s => 
        s.goal_id === goal.id && 
        (s.type === 'goal_adjustment' || s.type === 'manual_adjustment') && 
        !s.is_applied
    );

    if (!adjustmentSuggestion) return null;

    const isIncrease = adjustmentSuggestion.title?.includes('引き上げ');
    const description = adjustmentSuggestion.description || '目標が調整されました。';
    
    const handleDismissClick = () => {
      onDismissSuggestion(adjustmentSuggestion.id);
    };

    return (
      <div className={`
        flex items-start p-3 pr-8 rounded-md space-x-2 mb-2 relative
        ${isIncrease ? 'bg-green-50 border border-green-100' : 'bg-blue-50 border border-blue-100'}
      `}>
        {isIncrease ? (
          <ArrowUpRight className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <ArrowDownRight className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className={`text-sm font-medium ${isIncrease ? 'text-green-800' : 'text-blue-800'}`}>
            {adjustmentSuggestion.title}
          </h4>
          <p className={`text-xs ${isIncrease ? 'text-green-700' : 'text-blue-700'} mt-1`}>
            {description}
          </p>
        </div>
        <Button 
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 p-1"
          onClick={handleDismissClick}
          icon={<X className="h-4 w-4 text-red-500" />}
        >
          <></>
        </Button>
      </div>
    );
  };
  
  const handleReminderSubmit = (reminderTime: string, daysOfWeek: number[]) => {
    if (!canAddReminder) {
      alert(`リマインダーは最大${maxReminders}個までしか設定できません`);
      return;
    }
    onSetReminder(goal.id, reminderTime, daysOfWeek);
    setShowReminderForm(false);
  };

  return (
    <>
      <Card className="w-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{goal.title}</CardTitle>
              <CardDescription>{goal.description}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1 justify-end">
              {displayCategories.map((category: Category) => (
                category && (
                  <Badge
                    key={category.id}
                    variant="primary"
                    size="sm"
                    className={`bg-${category.color}-100 text-${category.color}-800`}
                  >
                    {category.name}
                  </Badge>
                )
              ))}
              {remainingCategories > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCategories(true)}
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  +{remainingCategories}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {renderGoalAdjustmentStatus()}
        
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2 text-teal-600" />
            <span>目標: {goal.target_minutes_per_day}分/日</span>
            <span className="mx-2">|</span>
            <span>今日: {isLoading ? '読込中...' : `${todayMinutes}分`}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-teal-600" />
            <span>目標設定から: {daysActive}日経過</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Flame className="h-4 w-4 mr-2 text-orange-600" />
            <span>現在: {goal.streak_days}日継続中</span>
            {goal.streak_days > 10 && (
              <Badge variant="success" size="sm" className="ml-2">
                好調!
              </Badge>
            )}
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
            <span>自己ベスト: {goal.max_streak_days ?? 0}日</span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1 text-teal-600" />
                今日の進捗
              </span>
              <span className="text-xs text-gray-500">{isLoading ? '読込中...' : `${todayMinutes}/${goal.target_minutes_per_day}分`}</span>
            </div>
            <ProgressBar 
              value={isLoading ? 0 : todayMinutes} 
              max={goal.target_minutes_per_day} 
              variant="primary" 
              animated={true}
            />
          </div>

          {goalReminders.length > 0 && (
            <div className="space-y-2">
              {goalReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between text-sm bg-blue-50 text-blue-800 px-3 py-2 rounded-md">
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    <span>{reminder.reminder_time} ({formatDaysOfWeek(reminder.days_of_week)})</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReminderList(true)}
                  >
                    詳細
                  </Button>
                </div>
              ))}
            </div>
          )}

          {needsRestart && (
            <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex items-start">
              <RotateCcw className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">
                  学習を再開しませんか？
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  7日以上学習が記録されていません。
                  小さな目標から再スタートできます。
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                  icon={<RotateCcw className="h-4 w-4" />}
                  className="mt-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  再スタート
                </Button>
              </div>
            </div>
          )}

          {/* Display Deadline Info */}
          {goal.deadline && (
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
              期限: {format(parseISO(goal.deadline), 'yyyy年M月d日', { locale: ja })}
              {remainingDays !== null && (
                <span className={`ml-2 font-medium ${remainingDays < 0 ? 'text-red-600' : remainingDays <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
                  {remainingDays < 0 ? `(期限切れ)` : remainingDays === 0 ? `(今日)` : `(あと${remainingDays}日)`}
                </span>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2 mt-auto pt-3">
          {/* Main Action Button: Log Session */}
          <Button 
            variant="primary" 
            size="sm"
            className="w-full"
            onClick={() => onLogSession(goal)}
            disabled={isCompletedToday}
            icon={isCompletedToday ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          >
            {isCompletedToday ? "今日分 達成済み" : "学習を記録"}
          </Button>
          
          {/* Secondary Actions - Now all with consistent button style */}
          <div className="flex justify-between w-full space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={() => setIsDetailModalOpen(true)}
              icon={<Info className="h-4 w-4" />}
            >
              詳細
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={() => onEdit(goal)}
              icon={<Edit className="h-4 w-4" />}
            >
              編集
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-red-600 hover:bg-red-50" 
              onClick={() => onDelete(goal.id)}
              icon={<Trash2 className="h-4 w-4" />}
            >
              削除
            </Button>
          </div>
          
          {/* Reminder button - removed Habit button */}
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => setShowReminderForm(true)}
            icon={<Bell className="h-4 w-4" />}
            disabled={!canAddReminder}
          >
            リマインド設定
          </Button>
        </CardFooter>
      </Card>

      <Modal
        isOpen={showAllCategories}
        onClose={() => setShowAllCategories(false)}
        title="カテゴリ一覧"
      >
        <div className="flex flex-wrap gap-2 p-4">
          {goalCategories.length > 0 ? (
            goalCategories.map((category: Category) => (
              category && (
                <Badge
                  key={category.id}
                  variant="primary"
                  size="md"
                  className={`bg-${category.color}-100 text-${category.color}-800`}
                >
                  {category.name}
                </Badge>
              )
            ))
          ) : (
            <p className="text-sm text-gray-500">カテゴリが設定されていません。</p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showReminderForm}
        onClose={() => setShowReminderForm(false)}
        title="リマインダー設定"
      >
        <ReminderForm
          goal={goal}
          onSubmit={handleReminderSubmit}
          onCancel={() => setShowReminderForm(false)}
        />
      </Modal>

      <Modal
        isOpen={showReminderList}
        onClose={() => setShowReminderList(false)}
        title="設定済みリマインダー"
      >
        <div className="p-4 space-y-4">
          {goalReminders.length > 0 ? (
            goalReminders.map(reminder => (
              <div key={reminder.id} className="flex items-center justify-between text-sm p-2 border border-gray-100 rounded-md">
                <div>
                  <div className="font-medium flex items-center">
                    <Bell className="h-4 w-4 mr-2 text-blue-600" />
                    <span>{reminder.reminder_time}</span>
                  </div>
                  <div className="text-gray-600 mt-1">曜日: {formatDaysOfWeek(reminder.days_of_week)}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => onDeleteReminder(reminder.id)}
                  icon={<Trash className="h-4 w-4" />}
                >
                  削除
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">リマインダーは設定されていません。</p>
          )}
          
          <div className="mt-2 text-xs text-gray-500">
            リマインダーは最大{maxReminders}個まで設定できます（現在: {goalReminders.length}/{maxReminders}）
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        title="目標の再スタート確認"
        size="sm"
      >
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            この目標を再スタートしますか？ストリーク日数などの進捗がリセットされます。
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              className="text-teal-600 border-teal-200 hover:bg-teal-50"
              onClick={() => setShowRestartConfirm(false)}
            >
              キャンセル
            </Button>
            <Button variant="outline" onClick={confirmRestart}>
              再スタートする
            </Button>
          </div>
        </div>
      </Modal>

      <GoalDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        goal={goal} 
        reminders={goalReminders as DetailReminder[]} 
        anchoringHabits={[]} // Empty array as we're removing this feature
        suggestions={goalSuggestions as DetailSuggestion[]} 
        onSetReminder={onSetReminder} 
        onSetAnchoringHabit={onSetAnchoringHabit} // Keeping for compatibility
        onDeleteReminder={onDeleteReminder}
        onDeleteAnchoringHabit={onDeleteAnchoringHabit} // Keeping for compatibility
        onDismissSuggestion={onDismissSuggestion}
      />
    </>
  );
}