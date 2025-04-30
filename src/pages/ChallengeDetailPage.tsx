import React, { useState } from 'react';
import { User as UserIcon, Calendar, Clock, Users } from 'lucide-react';
import Button from '../components/ui/Button';

interface ChallengeDetailPageProps {
  challengeId: string;
  onBack: () => void;
}

// モックデータ
const mockChallenge = {
  id: "1",
  title: "プログラミング30日チャレンジ",
  description: "毎日最低30分間のプログラミング学習をして、スキルを向上させましょう。",
  category: "プログラミング",
  start_date: "2025-05-01T00:00:00Z",
  end_date: "2025-05-31T00:00:00Z",
  target_minutes: 900,
  creator: {
    id: "user-1",
    name: "田中太郎",
    email: "tanaka@example.com",
    avatar: null
  },
  participants: [
    {
      id: "user-1",
      name: "田中太郎",
      email: "tanaka@example.com",
      avatar: null
    },
    {
      id: "user-2",
      name: "鈴木花子",
      email: "suzuki@example.com",
      avatar: null
    },
    {
      id: "user-3",
      name: "佐藤次郎",
      email: "sato@example.com",
      avatar: null
    }
  ],
  progress: [
    {
      user_id: "user-1",
      minutes_completed: 450
    },
    {
      user_id: "user-2",
      minutes_completed: 320
    },
    {
      user_id: "user-3",
      minutes_completed: 180
    }
  ]
};

const mockComments = [
  {
    id: "comment-1",
    user: {
      id: "user-1",
      name: "田中太郎",
      email: "tanaka@example.com",
      avatar: null
    },
    text: "今日も頑張りましょう！目標達成に向けて一歩ずつ進んでいきましょう。",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "comment-2",
    user: {
      id: "user-2",
      name: "鈴木花子",
      email: "suzuki@example.com",
      avatar: null
    },
    text: "新しい教材を見つけました！みんなにもおすすめです。",
    created_at: new Date(Date.now() - 43200000).toISOString()
  }
];

// チャレンジ詳細ページコンポーネント
export default function ChallengeDetailPage({ onBack }: ChallengeDetailPageProps) {
  // 状態
  const [activeTab, setActiveTab] = useState('overview');
  const [showLogModal, setShowLogModal] = useState(false);
  const [minutesToLog, setMinutesToLog] = useState('');
  const [newComment, setNewComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // フックの代わりにモックデータを使用
  const challenge = mockChallenge;
  const comments = mockComments;  
  // 進捗記録のハンドラー
  const handleLogProgress = () => {
    const minutes = parseInt(minutesToLog, 10);
    if (isNaN(minutes) || minutes <= 0) {
      setErrorMessage('有効な学習時間を入力してください');
      return;
    }
    
    // 実際のアプリではAPIを呼び出して進捗を更新
    alert(`${minutes}分の学習を記録しました`);
    setShowLogModal(false);
    setMinutesToLog('');
  };
  
  // コメント投稿のハンドラー
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    // 実際のアプリではAPIを呼び出してコメントを保存
    alert(`コメントを投稿しました: ${newComment}`);
    setNewComment('');
  };

  // 進捗バーコンポーネント
  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-teal-600 h-2.5 rounded-full"
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* エラーメッセージ */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
          <button 
            className="float-right font-bold"
            onClick={() => setErrorMessage(null)}
          >
            ×
          </button>
        </div>
      )}
      
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{challenge.title}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="flex items-center text-sm text-gray-600">
            <Calendar size={16} className="mr-1" />
            {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
          </span>
          <span className="flex items-center text-sm text-gray-600 ml-4">
            <Clock size={16} className="mr-1" />
            目標: {challenge.target_minutes}分
          </span>
          <span className="flex items-center text-sm text-gray-600 ml-4">
            <Users size={16} className="mr-1" />
            {challenge.participants.length}人参加中
          </span>
        </div>
        
        <div className="flex mb-6 space-x-2">
          <Button onClick={() => setShowLogModal(true)}>
            進捗を記録する
          </Button>
          <Button onClick={onBack} variant="secondary">
            一覧に戻る
          </Button>
        </div>
      </div>
      
      {/* タブ */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex -mb-px">
          {[
            { id: 'overview', label: '概要' },
            { id: 'progress', label: '進捗' },
            { id: 'discussion', label: 'ディスカッション' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">チャレンジ詳細</h2>
              <p className="mb-4">{challenge.description}</p>
              
              <h3 className="font-medium mb-2">カテゴリー</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-md text-sm">
                  {challenge.category}
                </span>
              </div>
              
              <h3 className="font-medium mb-2">作成者</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                  {challenge.creator.avatar ? (
                    <img src={challenge.creator.avatar} alt="Creator" className="w-8 h-8 rounded-full" />
                  ) : (
                    <UserIcon size={16} />
                  )}
                </div>
                <span>{challenge.creator.name || challenge.creator.email}</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">参加者</h2>
              <div className="space-y-4">
                {challenge.participants.map(participant => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <UserIcon size={16} />
                        )}
                      </div>
                      <span>{participant.name || participant.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1 text-gray-500" />
                      <span>
                        {(challenge.progress.find(p => p.user_id === participant.id)?.minutes_completed || 0)}分
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'progress' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold mb-4">進捗状況</h2>
            {challenge.participants.map(participant => {
              const userProgress = challenge.progress.find(p => p.user_id === participant.id);
              const minutesLogged = userProgress?.minutes_completed || 0;
              const progressPercent = Math.min(100, Math.round((minutesLogged / challenge.target_minutes) * 100));
              
              return (
                <div key={participant.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <UserIcon size={16} />
                        )}
                      </div>
                      <span>{participant.name || participant.email}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {minutesLogged}分 / {challenge.target_minutes}分 ({progressPercent}%)
                    </span>
                  </div>
                  
                  <ProgressBar value={progressPercent} />
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'discussion' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">ディスカッション</h2>
            
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="コメントを追加..."
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <Button type="submit" disabled={!newComment.trim()}>
                      投稿
                    </Button>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2 mt-1">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{comment.user.name || comment.user.email}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  まだコメントはありません。最初のコメントを投稿しましょう！
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 進捗記録モーダル */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">学習時間を記録</h3>
            <div className="mb-4">
              <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-1">
                学習時間（分）
              </label>
              <input
                id="minutes"
                type="number"
                min="1"
                value={minutesToLog}
                onChange={(e) => setMinutesToLog(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="例：30"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setShowLogModal(false)} variant="secondary">
                キャンセル
              </Button>
              <Button onClick={handleLogProgress}>
                記録する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 