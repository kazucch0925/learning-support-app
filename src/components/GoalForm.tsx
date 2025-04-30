import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import type { Database } from '../lib/database.types';
import { CATEGORIES } from '../types';

type Goal = Database['public']['Tables']['goals']['Row'];

// Combined type for form state, includes deadline
type GoalFormData = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_completed_at' | 'streak_days' | 'current_minutes_per_day' | 'max_streak_days'>> & { deadline?: string | null };

interface GoalFormProps {
  initialGoal?: Goal | null;
  onSubmit: (goalData: GoalFormData) => void;
  onCancel: () => void;
}

// Helper to format date YYYY-MM-DD for input type="date"
const formatDateForInput = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    // Ensure it's treated as UTC to avoid timezone shifts when splitting
    const date = new Date(dateString + 'T00:00:00Z'); 
    if (isNaN(date.getTime())) return ''; // Handle invalid date string
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date:", e);
    return '';
  }
};

const GoalForm: React.FC<GoalFormProps> = ({ initialGoal, onSubmit, onCancel }) => {
  // Initialize state from initialGoal or set defaults
  const [goal, setGoal] = useState<GoalFormData>(() => ({
    title: initialGoal?.title || '',
    description: initialGoal?.description || '',
    categories: (initialGoal?.categories as string[] | undefined) || [],
    target_minutes_per_day: initialGoal?.target_minutes_per_day || 10,
    deadline: initialGoal?.deadline ? formatDateForInput(initialGoal.deadline) : null,
  }));

  // Effect to update form when initialGoal changes (e.g., when opening modal for editing)
  useEffect(() => {
    if (initialGoal) {
      setGoal({
        title: initialGoal.title || '',
        description: initialGoal.description || '',
        categories: (initialGoal.categories as string[] | undefined) || [],
        target_minutes_per_day: initialGoal.target_minutes_per_day || 10,
        deadline: initialGoal.deadline ? formatDateForInput(initialGoal.deadline) : null,
      });
    } else {
      // Reset form if initialGoal is null (e.g., opening modal for new goal after editing)
       setGoal({ title: '', description: '', categories: [], target_minutes_per_day: 10, deadline: null });
    }
  }, [initialGoal]);

  // Generic handler for text inputs and textareas
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGoal(prev => ({ ...prev, [name]: value }));
  };

  // Handler for number inputs
   const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoal(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 })); // Ensure it's a number
  };

  // Handler for date inputs
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      // Store date as YYYY-MM-DD string or null if empty
      setGoal(prev => ({ ...prev, [name]: value || null })); 
  };

  // Handler for category checkboxes
  const handleCategoryToggle = (categoryId: string) => {
    setGoal(prev => {
      const currentCategories = prev.categories || [];
      const newCategories = currentCategories.includes(categoryId)
        ? currentCategories.filter(cat => cat !== categoryId)
        : [...currentCategories, categoryId];
      return { ...prev, categories: newCategories };
    });
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure target minutes is at least 1
    const dataToSubmit = {
        ...goal,
        target_minutes_per_day: Math.max(1, goal.target_minutes_per_day || 1)
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Input */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">目標タイトル <span className="text-red-600">*</span></label>
        <input 
          id="title" 
          name="title"
          type="text"
          value={goal.title || ''} 
          onChange={handleChange} 
          required 
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
          placeholder="例：基本情報技術者試験 合格"
        />
      </div>
       {/* Description Textarea */}
       <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
        <textarea 
            id="description" 
            name="description"
            value={goal.description || ''} 
            onChange={handleChange} 
            rows={3} 
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
            placeholder="目標の詳細や学習方針など"
        />
      </div>
       {/* Categories Checkboxes */}
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ（任意）</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CATEGORIES.map(cat => (
              <label key={cat.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-sm cursor-pointer hover:bg-gray-200">
                  <input 
                      type="checkbox" 
                      value={cat.id} 
                      checked={goal.categories?.includes(cat.id)} 
                      onChange={() => handleCategoryToggle(cat.id)} 
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 shadow-sm"
                  />
                  <span>{cat.name}</span>
              </label>
          ))}
        </div>
      </div>
       {/* Target Minutes Input */}
       <div>
        <label htmlFor="target_minutes_per_day" className="block text-sm font-medium text-gray-700 mb-1">1日の目標時間（分）<span className="text-red-600">*</span></label>
        <input 
            id="target_minutes_per_day" 
            name="target_minutes_per_day"
            type="number" 
            value={goal.target_minutes_per_day || ''} // Use empty string for placeholder if 0/null
            onChange={handleNumberChange} 
            min="1" 
            required 
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
            placeholder="例: 60"
        />
         <p className="mt-1 text-xs text-gray-500">
           1分以上の目標時間を設定してください。
         </p>
      </div>
      {/* Deadline Date Input */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">期限日（任意）</label>
        <input 
          id="deadline" 
          name="deadline"
          type="date" 
          value={goal.deadline || ''} // Use goal state and empty string for null
          onChange={handleDateChange} 
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
        />
         <p className="mt-1 text-xs text-gray-500">
           試験日などを設定すると、残り日数が表示されます。
         </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          className="text-teal-600 border-teal-200 hover:bg-teal-50"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button type="submit" variant="primary">{initialGoal?.id ? '更新' : '作成'}</Button> {/* Check initialGoal.id for button text */} 
      </div>
    </form>
  );
};

export default GoalForm;