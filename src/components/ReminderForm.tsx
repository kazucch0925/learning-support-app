import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import type { Database } from '../lib/database.types';
import Button from './ui/Button';

type Goal = Database['public']['Tables']['goals']['Row'];

interface ReminderFormProps {
  goal: Goal;
  onSubmit: (reminderTime: string, daysOfWeek: number[]) => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = [
  { id: 0, name: '日' },
  { id: 1, name: '月' },
  { id: 2, name: '火' },
  { id: 3, name: '水' },
  { id: 4, name: '木' },
  { id: 5, name: '金' },
  { id: 6, name: '土' },
];

const QUICK_TIMES = [
  { label: '朝6時', value: '06:00' },
  { label: '朝9時', value: '09:00' },
  { label: '昼12時', value: '12:00' },
  { label: '夕方6時', value: '18:00' },
  { label: '夜9時', value: '21:00' },
];

export default function ReminderForm({ goal, onSubmit, onCancel }: ReminderFormProps) {
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const handleDayToggle = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert('曜日を1つ以上選択してください');
      return;
    }
    onSubmit(reminderTime, selectedDays);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">目標</h3>
        <div className="text-base font-medium text-gray-900 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-teal-600" />
          {goal.title}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          リマインド時刻
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_TIMES.map(time => (
            <Button
              key={time.value}
              type="button"
              variant={reminderTime === time.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setReminderTime(time.value)}
              icon={<Clock className="h-4 w-4" />}
            >
              {time.label}
            </Button>
          ))}
        </div>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          リマインドする曜日
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map(day => (
            <Button
              key={day.id}
              type="button"
              variant={selectedDays.includes(day.id) ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleDayToggle(day.id)}
            >
              {day.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
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
          icon={<Plus className="h-4 w-4" />}
        >
          リマインダーを設定
        </Button>
      </div>
    </form>
  );
}