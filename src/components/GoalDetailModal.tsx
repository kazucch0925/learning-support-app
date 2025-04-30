import React, { useState, useEffect, useCallback } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge'; // Import Badge component
import { Calendar, Clock, Target, Flame, Trophy, Bell, Trash2, Info, Sparkles, X, BookOpen, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { CATEGORIES, Category } from '../types'; // Import CATEGORIES
import { format, parseISO, isToday, subDays, startOfDay, endOfDay, isSameDay, formatISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Use specific types from database.types or custom types
type Goal = Database['public']['Tables']['goals']['Row'];
type Reminder = Database['public']['Tables']['reminders']['Row'];
type Suggestion = Database['public']['Tables']['ai_suggestions']['Row'];
type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null; // Allow null
  reminders: Reminder[];
  anchoringHabits: any[]; // Kept for compatibility but no longer used
  suggestions: Suggestion[];
  onSetReminder: (goalId: string, reminderTime: string, daysOfWeek: number[]) => void;
  onSetAnchoringHabit: (goalId: string, existingHabit: string, triggerTime: string | null, notes: string) => void; // Kept for compatibility
  onDeleteReminder: (reminderId: string) => void;
  onDeleteAnchoringHabit: (habitId: string) => void; // Kept for compatibility
  onDismissSuggestion: (suggestionId: string) => void;
}

// Helper to format days of the week
const formatDaysOfWeek = (days: number[] | null) => {
  if (!days || days.length === 0) return '曜日未設定';
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  return [...days].sort((a, b) => a - b).map(d => dayNames[d]).join('・');
};

// Helper to find category details
const findCategory = (categoryId: string): Category | undefined => {
  return CATEGORIES.find(c => c.id === categoryId);
};

// データポイントの型定義
interface ChartDataPoint {
  date: string;
  formattedDate: string;
  actual: number;
  target: number;
}

// ウィンドウサイズを取得するためのカスタムフック
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  
  return windowSize;
};

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  isOpen,
  onClose,
  goal,
  reminders,
  suggestions,
  onDeleteReminder,
  onDismissSuggestion,
}) => {
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [learningHistory, setLearningHistory] = useState<LearningSession[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState<'2weeks' | '1month'>('2weeks');
  const itemsPerPage = 5;
  
  // ウィンドウサイズを取得
  const windowSize = useWindowSize();

  // 画面サイズに基づいてX軸のインターバルを計算
  const getXAxisInterval = useCallback(() => {
    if (chartPeriod === '1month') {
      if (windowSize.width < 640) return 6; // スマホ
      if (windowSize.width < 768) return 4; // タブレット
      return 3; // デスクトップ
    } else { // 2weeks
      if (windowSize.width < 640) return 3; // スマホ
      if (windowSize.width < 768) return 2; // タブレット
      return 1; // デスクトップ
    }
  }, [windowSize.width, chartPeriod]);

  // 今日の学習時間を取得
  useEffect(() => {
    if (isOpen && goal) {
      const fetchTodayLearning = async () => {
        setIsLoading(true);
        try {
          // 今日の日付の開始と終了を設定
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);

          const { data, error } = await supabase
            .from('learning_sessions')
            .select('duration')
            .eq('goal_id', goal.id)
            .gte('completed_at', startOfToday.toISOString())
            .lte('completed_at', endOfToday.toISOString());

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
    }
  }, [isOpen, goal]);

  // 学習履歴を取得
  useEffect(() => {
    if (isOpen && goal) {
      const fetchLearningHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const { data, error } = await supabase
            .from('learning_sessions')
            .select('*')
            .eq('goal_id', goal.id)
            .order('completed_at', { ascending: false });

          if (error) {
            console.error('Error fetching learning history:', error);
            return;
          }

          setLearningHistory(data || []);
        } catch (err) {
          console.error('Failed to fetch learning history:', err);
        } finally {
          setIsHistoryLoading(false);
        }
      };

      fetchLearningHistory();
    }
  }, [isOpen, goal]);

  // グラフ用データを準備
  useEffect(() => {
    if (isOpen && goal && !isHistoryLoading) {
      prepareChartData();
    }
  }, [isOpen, goal, learningHistory, chartPeriod, isHistoryLoading]);

  // グラフデータを生成
  const prepareChartData = () => {
    if (!goal) return;

    // 対象期間の日数を決定
    const days = chartPeriod === '2weeks' ? 14 : 30;
    
    // 対象期間の開始日
    const startDate = subDays(new Date(), days - 1);
    
    // 日付ごとのデータポイントを作成
    const dataPoints: ChartDataPoint[] = [];
    
    // 各日付についてループ
    for (let i = 0; i < days; i++) {
      const currentDate = subDays(new Date(), days - 1 - i);
      const currentDateStart = startOfDay(currentDate);
      const currentDateEnd = endOfDay(currentDate);
      
      // その日の学習セッションをフィルタリング
      const sessionsOnDay = learningHistory.filter(session => {
        const sessionDate = new Date(session.completed_at);
        return sessionDate >= currentDateStart && sessionDate <= currentDateEnd;
      });
      
      // その日の合計学習時間を計算
      const actualMinutes = sessionsOnDay.reduce((sum, session) => sum + (session.duration || 0), 0);
      
      // データポイントを追加
      dataPoints.push({
        date: formatISO(currentDate, { representation: 'date' }),
        formattedDate: format(currentDate, 'MM/dd(E)', { locale: ja }),
        actual: actualMinutes,
        target: goal.target_minutes_per_day
      });
    }
    
    setChartData(dataPoints);
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-md shadow-md">
          <p className="font-semibold">{data.formattedDate}</p>
          <p className="text-teal-600">実績: {data.actual}分</p>
          <p className="text-blue-600">目標: {data.target}分</p>
        </div>
      );
    }
    return null;
  };

  if (!isOpen || !goal) return null;

  const goalCategories = goal.categories?.map(findCategory).filter(Boolean) as Category[] || [];

  // 今日の学習目標達成状況
  const isCompletedToday = goal.last_completed_at ? 
    isToday(new Date(goal.last_completed_at)) &&
    (todayMinutes >= goal.target_minutes_per_day) : false;

  // ページネーション処理
  const totalPages = Math.ceil(learningHistory.length / itemsPerPage);
  const currentItems = learningHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`目標詳細: ${goal.title}`} size="lg">
      <div className="p-6 space-y-6">
        {/* Goal Info Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2">基本情報</h3>
          {goal.description && <p className="text-sm text-gray-600 mb-3">{goal.description}</p>}
          <div className="flex flex-wrap gap-1 mb-3">
            {goalCategories.map(cat => (
               <Badge key={cat.id} variant="primary" size="sm" className={`bg-${cat.color}-100 text-${cat.color}-800`}>
                 {cat.name}
               </Badge>
            ))}
             {goal.categories?.length === 0 && <Badge variant="secondary">カテゴリ未設定</Badge>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center text-gray-700">
              <Target className="h-4 w-4 mr-2 text-teal-600" />
              <span>目標時間: {goal.target_minutes_per_day}分/日</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="h-4 w-4 mr-2 text-teal-600" />
              <span>今日の学習: {isLoading ? '読込中...' : `${todayMinutes}分`}</span>
              {isCompletedToday && (
                <Badge variant="success" size="sm" className="ml-2">
                  達成!
                </Badge>
              )}
            </div>
            <div className="flex items-center text-gray-700">
              <Flame className="h-4 w-4 mr-2 text-orange-600" />
              <span>継続日数: {goal.streak_days}日</span>
            </div>
             <div className="flex items-center text-gray-700">
              <Trophy className="h-4 w-4 mr-2 text-yellow-600" />
              <span>最長継続: {goal.max_streak_days ?? 0}日</span>
            </div>
            {goal.deadline && (
               <div className="flex items-center text-gray-700 sm:col-span-2">
                 <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                 <span>期限: {format(parseISO(goal.deadline), 'yyyy年M月d日', { locale: ja })}</span>
              </div>
            )}
          </div>
        </section>

        {/* Progress Chart Section */}
        <section>
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <h3 className="text-lg font-semibold flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-teal-600" /> 学習進捗
            </h3>
            <div className="flex space-x-2">
              <Button
                variant={chartPeriod === '2weeks' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartPeriod('2weeks')}
                className={chartPeriod === '2weeks' ? '' : 'text-teal-600 border-teal-200'}
              >
                2週間
              </Button>
              <Button
                variant={chartPeriod === '1month' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartPeriod('1month')}
                className={chartPeriod === '1month' ? '' : 'text-teal-600 border-teal-200'}
              >
                1ヶ月
              </Button>
            </div>
          </div>
          
          {isHistoryLoading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">データ読込中...</p>
            </div>
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    height={60}
                    interval={getXAxisInterval()}
                    tick={(props) => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text 
                            x={0} 
                            y={0} 
                            dy={10}
                            dx={-10}
                            textAnchor="end"
                            fill="#666"
                            fontSize={10}
                            transform="rotate(-45)"
                          >
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    name="実績" 
                    stroke="#14b8a6" 
                    fill="#14b8a6" 
                    fillOpacity={0.3} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    name="目標" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="text-xs text-center text-gray-500 mt-4">
            {chartPeriod === '2weeks' ? '過去2週間' : '過去1ヶ月'}の学習実績と目標の推移
          </div>
        </section>

        {/* Learning History Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-teal-600" /> 学習履歴
          </h3>
          {isHistoryLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">読込中...</p>
          ) : learningHistory.length > 0 ? (
            <div>
              <div className="space-y-3">
                {currentItems.map(session => (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="flex items-center mb-1 sm:mb-0">
                        <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="font-medium text-gray-800">
                          {format(new Date(session.completed_at), 'yyyy年M月d日(E) HH:mm', { locale: ja })}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-2 text-teal-600" />
                        <span className="text-teal-700">{session.duration}分</span>
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-2 sm:mt-0 text-sm text-gray-600 border-t pt-2 sm:border-t-0 sm:pt-0 sm:pl-4 max-w-full sm:max-w-[50%]">
                        {session.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {learningHistory.length}件中 {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, learningHistory.length)}件を表示
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      icon={<ChevronLeft className="h-4 w-4" />}
                    >
                      前へ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      icon={<ChevronRight className="h-4 w-4" />}
                    >
                      次へ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">学習記録がまだありません。</p>
          )}
        </section>

        {/* Reminders Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
             <Bell className="h-5 w-5 mr-2 text-blue-600"/> リマインダー
          </h3>
          {reminders.length > 0 ? (
            <ul className="space-y-2">
              {reminders.map(reminder => (
                <li key={reminder.id} className="flex items-center justify-between text-sm p-2 bg-blue-50 rounded-md">
                  <div>
                     <span className="font-medium text-blue-800">{reminder.reminder_time}</span>
                     <span className="ml-2 text-blue-700">({formatDaysOfWeek(reminder.days_of_week)})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:bg-red-100 p-1"
                    onClick={() => onDeleteReminder(reminder.id)}
                   >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">設定されているリマインダーはありません。</p>
          )}
        </section>

         {/* AI Suggestions Section */}
        <section>
          <h3 className="text-lg font-semibold mb-3 border-b pb-2 flex items-center">
             <Sparkles className="h-5 w-5 mr-2 text-purple-600" /> AIからの提案
          </h3>
          {suggestions.filter(s => !s.is_applied).length > 0 ? ( // Show only unapplied suggestions
            <ul className="space-y-2">
              {suggestions.filter(s => !s.is_applied).map(suggestion => (
                <li key={suggestion.id} className="p-3 bg-purple-50 rounded-md relative">
                  <h4 className="text-sm font-semibold text-purple-800 mb-1">{suggestion.title}</h4>
                  <p className="text-xs text-purple-700 mb-2">{suggestion.description}</p>
                  {/* Add apply button if needed, currently only dismiss */}
                  <Button 
                     variant="ghost" 
                     size="sm"
                     className="absolute top-1 right-1 text-gray-500 hover:bg-purple-100 p-1"
                     onClick={() => onDismissSuggestion(suggestion.id)}
                  >
                     <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">現在、未適用の提案はありません。</p>
          )}
        </section>

        {/* Footer with Close Button */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="text-teal-600 border-teal-200 hover:bg-teal-50"
          >
            閉じる
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default GoalDetailModal; 