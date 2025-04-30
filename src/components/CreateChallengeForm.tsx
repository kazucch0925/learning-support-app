import React, { useState } from 'react';
import { Calendar, Clock, Tag, Users } from 'lucide-react';
import { useFriendSystem } from '../features/friendlyCompetition/hooks/useFriendSystem';
import Button from './ui/Button';

type CreateChallengeFormProps = {
  onSubmit: (
    title: string,
    description: string,
    category: string,
    startDate: Date,
    endDate: Date,
    targetMinutes: number,
    participants: string[]
  ) => Promise<void>;
  onCancel: () => void;
};

export default function CreateChallengeForm({
  onSubmit,
  onCancel
}: CreateChallengeFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)
  );
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { friends, loading: friendsLoading } = useFriendSystem();

  // カテゴリのリスト
  const categories = [
    { id: 'language', name: '語学' },
    { id: 'programming', name: 'プログラミング' },
    { id: 'math', name: '数学' },
    { id: 'science', name: '科学' },
    { id: 'art', name: '芸術' },
    { id: 'music', name: '音楽' },
    { id: 'sports', name: 'スポーツ' },
    { id: 'business', name: 'ビジネス' },
    { id: 'other', name: 'その他' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!title) {
      setError('タイトルを入力してください');
      return;
    }

    if (!category) {
      setError('カテゴリを選択してください');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError('終了日は開始日より後に設定してください');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(
        title,
        description,
        category,
        start,
        end,
        targetMinutes,
        selectedFriends
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'チャレンジの作成に失敗しました');
      setIsSubmitting(false);
    }
  };

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          チャレンジのタイトル（必須）
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          placeholder="例：週間英語学習チャレンジ"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          説明
        </label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          placeholder="チャレンジの詳細や目標、ルールなどを記入"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          カテゴリ（必須）
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className="h-4 w-4 text-gray-400" />
          </div>
          <select
            id="category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">カテゴリを選択</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            開始日
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            終了日
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="targetMinutes" className="block text-sm font-medium text-gray-700 mb-1">
          目標時間（分）
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="number"
            id="targetMinutes"
            min={1}
            max={1440}
            value={targetMinutes}
            onChange={e => setTargetMinutes(parseInt(e.target.value) || 60)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          チャレンジ期間中に達成したい合計学習時間（分）
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>参加を招待する友だち</span>
          </div>
        </label>

        {friendsLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">読み込み中...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-600 text-sm">招待できる友だちがいません</p>
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
            {friends.map(friend => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
              >
                <div className="flex items-center">
                  {friend.avatar_url ? (
                    <img
                      src={friend.avatar_url}
                      alt={friend.name}
                      className="w-8 h-8 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      <span className="text-gray-600">{friend.name.charAt(0)}</span>
                    </div>
                  )}
                  <span className="text-sm">{friend.name}</span>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => handleFriendToggle(friend.id)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">
          選択した友だちにチャレンジへの参加が招待されます
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-teal-600 border-teal-200 hover:bg-teal-50"
        >
          キャンセル
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? '作成中...' : 'チャレンジを作成'}
        </Button>
      </div>
    </form>
  );
} 