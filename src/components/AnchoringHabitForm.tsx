import React, { useState } from 'react';
import { Link, Clock } from 'lucide-react';
import type { Database } from '../lib/database.types';
import Button from './ui/Button';

type Goal = Database['public']['Tables']['goals']['Row'];

interface AnchoringHabitFormProps {
  goal: Goal;
  onSubmit: (existingHabit: string, triggerTime: string | null, notes: string) => void;
  onCancel: () => void;
}

const COMMON_HABITS = [
  '朝食を食べる',
  '通勤・通学',
  'コーヒーを飲む',
  '昼休憩',
  '帰宅後',
  '夕食後',
  '就寝前',
];

export default function AnchoringHabitForm({ goal, onSubmit, onCancel }: AnchoringHabitFormProps) {
  const [existingHabit, setExistingHabit] = useState('');
  const [triggerTime, setTriggerTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingHabit.trim()) {
      alert('既存の習慣を入力してください');
      return;
    }
    onSubmit(existingHabit, triggerTime || null, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">目標</h3>
        <div className="text-base font-medium text-gray-900 flex items-center">
          <Link className="h-4 w-4 mr-2 text-teal-600" />
          {goal.title}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          既存の習慣
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {COMMON_HABITS.map(habit => (
            <Button
              key={habit}
              type="button"
              variant={existingHabit === habit ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setExistingHabit(habit)}
            >
              {habit}
            </Button>
          ))}
        </div>
        <input
          type="text"
          value={existingHabit}
          onChange={(e) => setExistingHabit(e.target.value)}
          placeholder="例：朝食を食べる"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center justify-between">
            <span>トリガー時刻（任意）</span>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
        </label>
        <input
          type="time"
          value={triggerTime}
          onChange={(e) => setTriggerTime(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          メモ（任意）
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="習慣化のための具体的な手順やコツを記録しましょう"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={<Link className="h-4 w-4" />}
        >
          習慣を紐付ける
        </Button>
      </div>
    </form>
  );
}