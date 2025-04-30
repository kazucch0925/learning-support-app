import React, { useState, useEffect } from 'react';
import { Clock, BookOpen, CheckCircle, Plus, Minus, RotateCcw, MessageSquare, Calendar } from 'lucide-react';
import type { Database } from '../lib/database.types';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import DatePicker from './ui/DatePicker';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import FormField from './ui/FormField';
import { format, isToday, isBefore, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

type Goal = Database['public']['Tables']['goals']['Row'];
type LearningSession = Database['public']['Tables']['learning_sessions']['Row'];

interface LogSessionFormProps {
  goal: Goal;
  todayMinutes?: number; // 今日の実際の学習時間（オプション）
  onSubmit: (duration: number, notes: string, date?: Date) => void;
  onCancel: () => void;
}

const MAX_MINUTES_PER_DAY = 1440; // 24時間 = 1440分
const MIN_DURATION = 0; // 最小時間は0分

export default function LogSessionForm({ goal, todayMinutes = 0, onSubmit, onCancel }: LogSessionFormProps) {
  // 今日か過去モードかを先に定義
  const [mode, setMode] = useState<'today' | 'past'>('today');
  // 今日モードの初期値として todayMinutes を使用、過去モードでは0を使用
  const [duration, setDuration] = useState(todayMinutes);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [todaySessions, setTodaySessions] = useState<LearningSession[]>([]);
  const today = new Date();

  // 30日前までの日付を選択可能に
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 30);

  // Calculate a dynamic max value for the slider
  const practicalSliderMax = Math.max(Math.round(goal.target_minutes_per_day * 1.5), 60); 

  // 選択した日付の学習セッションを取得する
  useEffect(() => {
    if (mode === 'past') {
      fetchSessionsForDate(selectedDate);
    }
  }, [selectedDate, mode]);

  // 日付切り替え時に呼び出す関数
  const fetchSessionsForDate = async (date: Date) => {
    setIsLoading(true);
    try {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const { data, error } = await supabase
        .from('learning_sessions')
        .select('id, duration, notes, completed_at')
        .eq('goal_id', goal.id)
        .gte('completed_at', dayStart.toISOString())
        .lte('completed_at', dayEnd.toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('選択した日付の学習記録の取得中にエラーが発生しました:', error);
        return;
      }

      if (data && data.length > 0) {
        // すべてのセッションを保存
        setTodaySessions(data as LearningSession[]);
        
        // 総学習時間を計算
        const totalDuration = data.reduce((sum, session) => sum + session.duration, 0);
        setDuration(totalDuration);
        
        // 最新のセッションのメモを表示
        if (data[0].notes) {
          setNotes(data[0].notes);
        } else {
          setNotes('');
        }
      } else {
        // 記録がなければ初期値に設定
        setDuration(0);
        setNotes('');
        setTodaySessions([]);
      }
    } catch (err) {
      console.error('学習記録の取得中にエラーが発生しました:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDuration = Math.max(MIN_DURATION, duration); // 念のため0未満にならないように
    
    if (mode === 'today') {
      onSubmit(finalDuration, notes);
    } else {
      onSubmit(finalDuration, notes, selectedDate);
    }
  };

  const handleDurationChange = (minutes: number) => {
    setDuration(Math.min(Math.max(MIN_DURATION, minutes), MAX_MINUTES_PER_DAY));
  };

  const resetDuration = () => {
    setDuration(MIN_DURATION);
  };

  // タブ切り替え時の処理
  const handleModeChange = (value: string) => {
    const newMode = value as 'today' | 'past';
    setMode(newMode);
    
    if (newMode === 'today') {
      // 今日モードに切り替えた場合、今日の実際の学習時間を使用
      setDuration(todayMinutes || 0);
      setNotes('');
      setTodaySessions([]);
    } else {
      // 過去モードに切り替えた場合、選択された日付のデータを取得
      fetchSessionsForDate(selectedDate);
    }
  };

  // セッション履歴コンポーネント
  const SessionHistory = ({ sessions }: { sessions: LearningSession[] }) => {
    if (!sessions || sessions.length === 0) return null;
    
    return (
      <div className="mt-4 border rounded-md p-3 bg-gray-50">
        <h3 className="text-sm font-medium mb-2">この日の学習記録</h3>
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id} className="flex justify-between text-sm">
              <span>{format(new Date(session.completed_at), 'HH:mm', { locale: ja })} - {session.duration}分</span>
              {session.notes && <span className="text-gray-500 truncate max-w-[50%]">{session.notes}</span>}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium mt-2 text-teal-700">
          合計: {sessions.reduce((sum, s) => sum + s.duration, 0)}分
        </p>
      </div>
    );
  };

  const durationIncrements = [5, 15, 30, 60];
  const durationDecrements = [5, 10, 15, 30, 60]; // 60 を追加

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg mb-1">
        <h3 className="text-sm font-medium text-gray-600 mb-1.5">目標</h3>
        <div className="text-base font-medium text-gray-900 flex items-center bg-white p-3 rounded-md border border-gray-200 shadow-sm">
          <BookOpen className="h-5 w-5 mr-2.5 text-teal-600" />
          {goal.title}
        </div>
      </div>

      <Tabs defaultValue="today" onValueChange={handleModeChange} className="mt-2">
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">今日の記録</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">過去の記録</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <p className="text-sm text-gray-600 mb-2">
            今日（{format(today, 'yyyy年MM月dd日', { locale: ja })}）の学習時間を記録します。
          </p>
        </TabsContent>
        
        <TabsContent value="past">
          <FormField 
            label="日付を選択" 
            description="過去30日以内の記録のみ追加できます"
          >
            <div className="flex items-center">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={minDate}
                maxDate={today}
                className="w-full"
              />
              <Calendar className="h-5 w-5 text-gray-500 ml-2" />
            </div>
          </FormField>
          
          <div className="mt-2">
            <div className="text-sm text-teal-600 font-medium">
              {isToday(selectedDate) 
                ? '今日' 
                : format(selectedDate, 'yyyy年MM月dd日（E）', { locale: ja })}
              の記録:
            </div>
            {isLoading && <div className="text-xs text-gray-500 mt-1">読み込み中...</div>}
          </div>

          {!isLoading && todaySessions.length > 0 && (
            <SessionHistory sessions={todaySessions} />
          )}
        </TabsContent>
      </Tabs>

      <div>
        <label htmlFor="duration-input" className="block text-sm font-medium text-gray-700 mb-2">
          学習時間（分）
        </label>
        <div className="flex items-center space-x-3 mb-4">
          <input
            id="duration-input"
            type="number"
            value={duration}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            min={MIN_DURATION}
            max={MAX_MINUTES_PER_DAY}
            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50 text-center"
            aria-label="学習時間"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetDuration}
            icon={<RotateCcw className="h-4 w-4" />}
            className="bg-white hover:bg-gray-50 text-gray-600 border-gray-300 hover:text-teal-600 transition-colors"
          >
            リセット
          </Button>
        </div>
        
        {/* タイムコントロール */}
        <div className="space-y-3 mb-4">
          {/* 減算ボタン */}
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2 w-16">減らす:</span>
              <div className="grid grid-cols-5 gap-2 flex-1">
                {durationDecrements.map(minutes => (
                  <button
                    key={`minus-${minutes}`}
                    type="button"
                    className={`flex items-center justify-center h-10 rounded-md border transition-all duration-200 ${
                      duration < minutes 
                        ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' 
                        : 'bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 border-gray-300'
                    }`}
                    onClick={() => handleDurationChange(duration - minutes)}
                    disabled={duration < minutes}
                    aria-label={`${minutes}分減らす`}
                    title={`${minutes}分減らす`}
                  >
                    <Minus className="h-3.5 w-3.5 mr-1" />
                    <span>{minutes}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* 加算ボタン */}
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-600 mr-2 w-16">増やす:</span>
              <div className="grid grid-cols-5 gap-2 flex-1">
                <button
                  key="plus-5"
                  type="button"
                  className="flex items-center justify-center h-10 rounded-md border bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-gray-700 border-gray-300 transition-all duration-200"
                  onClick={() => handleDurationChange(duration + 5)}
                  aria-label="5分増やす"
                  title="5分増やす"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>5</span>
                </button>
                <button
                  key="plus-10"
                  type="button"
                  className="flex items-center justify-center h-10 rounded-md border bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-gray-700 border-gray-300 transition-all duration-200"
                  onClick={() => handleDurationChange(duration + 10)}
                  aria-label="10分増やす"
                  title="10分増やす"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>10</span>
                </button>
                <button
                  key="plus-15"
                  type="button"
                  className="flex items-center justify-center h-10 rounded-md border bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-gray-700 border-gray-300 transition-all duration-200"
                  onClick={() => handleDurationChange(duration + 15)}
                  aria-label="15分増やす"
                  title="15分増やす"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>15</span>
                </button>
                <button
                  key="plus-30"
                  type="button"
                  className="flex items-center justify-center h-10 rounded-md border bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-gray-700 border-gray-300 transition-all duration-200"
                  onClick={() => handleDurationChange(duration + 30)}
                  aria-label="30分増やす"
                  title="30分増やす"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>30</span>
                </button>
                <button
                  key="plus-60"
                  type="button"
                  className="flex items-center justify-center h-10 rounded-md border bg-white hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 text-gray-700 border-gray-300 transition-all duration-200"
                  onClick={() => handleDurationChange(duration + 60)}
                  aria-label="60分増やす"
                  title="60分増やす"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>60</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <input
          type="range"
          id="duration-slider"
          value={duration}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          min={MIN_DURATION}
          max={practicalSliderMax}
          step={5}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600 hover:accent-teal-700"
          aria-labelledby="duration-label"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{MIN_DURATION}分</span>
          <span id="duration-label" className="text-center text-sm font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
            {duration}分
          </span>
          <span>{practicalSliderMax}分</span>
        </div>

        <div className="mt-5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 font-medium">目標達成状況</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{duration}/{goal.target_minutes_per_day}分</span>
          </div>
          <ProgressBar
            value={Math.min(duration, goal.target_minutes_per_day)}
            max={goal.target_minutes_per_day}
            variant="primary"
            animated={true}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
          <MessageSquare className="h-4 w-4 mr-1.5 text-gray-500" />
          今回のメモ（任意）
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50 resize-none"
          placeholder="学習内容や気づきを記録しましょう"
        />
      </div>

      {duration >= goal.target_minutes_per_day && (
        <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 rounded-lg p-4 flex items-start shadow-sm">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-1">目標達成！🎉</h4>
            <p className="text-xs text-green-600 leading-relaxed">
              目標の{goal.target_minutes_per_day}分を達成しました。
              継続は力なり！今日も素晴らしい進歩です。
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-4">
        <Button
          type="button"
          variant="outline"
          className="text-teal-600 border-teal-200 hover:bg-teal-50"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="shadow-sm"
        >
          記録する
        </Button>
      </div>
    </form>
  );
}