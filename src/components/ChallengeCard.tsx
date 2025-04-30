import React from 'react';
import { Calendar, Clock, Target, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import ProgressBar from './ui/ProgressBar';
import Button from './ui/Button';

type SharedChallenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  target_minutes: number;
  creator_id: string;
  participants: {
    id: string;
    name: string;
    avatar_url?: string;
  }[];
  progress: {
    user_id: string;
    minutes_completed: number;
  }[];
  created_at: string;
};

type ChallengeCategoryInfo = {
  [key: string]: {
    name: string;
    color: string;
  };
};

const CATEGORIES: ChallengeCategoryInfo = {
  language: { name: '語学', color: 'blue' },
  programming: { name: 'プログラミング', color: 'emerald' },
  math: { name: '数学', color: 'purple' },
  science: { name: '科学', color: 'cyan' },
  art: { name: '芸術', color: 'pink' },
  music: { name: '音楽', color: 'indigo' },
  sports: { name: 'スポーツ', color: 'orange' },
  business: { name: 'ビジネス', color: 'yellow' },
  other: { name: 'その他', color: 'gray' }
};

type ChallengeCardProps = {
  challenge: SharedChallenge;
  userId: string;
  onJoin: (challengeId: string) => Promise<void>;
  onLeave: (challengeId: string) => Promise<void>;
  onLogProgress: (challengeId: string) => void;
  onViewDetails: (challengeId: string) => void;
};

export default function ChallengeCard({
  challenge,
  userId,
  onJoin,
  onLeave,
  onLogProgress,
  onViewDetails
}: ChallengeCardProps) {
  const isParticipating = challenge.participants.some(p => p.id === userId);
  const isCreator = challenge.creator_id === userId;
  const categoryInfo = CATEGORIES[challenge.category] || CATEGORIES.other;
  
  // 開始日と終了日
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  
  // チャレンジの状態
  const now = new Date();
  const isActive = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isCompleted = now > endDate;
  
  // 進捗状況の計算
  const userProgress = challenge.progress.find(p => p.user_id === userId)?.minutes_completed || 0;
  const progressPercentage = Math.min(100, Math.round((userProgress / challenge.target_minutes) * 100));
  
  // 残り時間の計算
  let timeRemaining = '';
  if (isUpcoming) {
    timeRemaining = `${formatDistanceToNow(startDate, { locale: ja })}後に開始`;
  } else if (isActive) {
    timeRemaining = `あと${formatDistanceToNow(endDate, { locale: ja })}`;
  } else {
    timeRemaining = '終了';
  }
  
  // 参加ボタンの処理
  const handleJoin = async () => {
    try {
      await onJoin(challenge.id);
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };
  
  // 脱退ボタンの処理
  const handleLeave = async () => {
    if (window.confirm('このチャレンジから脱退しますか？進捗状況は失われます。')) {
      try {
        await onLeave(challenge.id);
      } catch (error) {
        console.error('Failed to leave challenge:', error);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{challenge.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800`}>
              {categoryInfo.name}
            </span>
          </div>
          
          {isParticipating && isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLogProgress(challenge.id)}
              className="text-xs"
            >
              学習を記録
            </Button>
          )}
        </div>
        
        {challenge.description && (
          <p className="text-sm text-gray-600 mt-2 mb-3">{challenge.description}</p>
        )}
        
        <div className="space-y-3 mt-4">
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span>
              {startDate.toLocaleDateString()} 〜 {endDate.toLocaleDateString()}
              {' '}
              <span className={`font-medium ${isActive ? 'text-green-600' : isUpcoming ? 'text-blue-600' : 'text-gray-600'}`}>
                ({timeRemaining})
              </span>
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Target className="h-3.5 w-3.5 mr-1.5" />
            <span>目標: {challenge.target_minutes}分</span>
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span>参加者: {challenge.participants.length}人</span>
          </div>
          
          {isParticipating && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-gray-600">あなたの進捗</span>
                <span className="font-medium">
                  {userProgress}/{challenge.target_minutes}分 ({progressPercentage}%)
                </span>
              </div>
              <ProgressBar value={progressPercentage} max={100} size="sm" />
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
        {!isParticipating ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleJoin}
            disabled={isCompleted}
            className="w-full"
          >
            参加する
          </Button>
        ) : (
          <div className="flex space-x-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(challenge.id)}
              className="flex-1"
            >
              詳細
            </Button>
            
            {!isCreator && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLeave}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                脱退
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 