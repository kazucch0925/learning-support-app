import React, { useState } from 'react';
import { TrendingUp, Clock, Award, Flame, Calendar, Sparkles } from 'lucide-react';
import { useFriendSystem } from '../hooks/useFriendSystem';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserData } from '../../../hooks/useUserData';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

type LeaderboardPeriod = 'week' | 'month';
type LeaderboardMetric = 'totalMinutes' | 'averageMinutesPerDay' | 'streakDays' | 'activeDays';

type LeaderboardUser = {
  id: string;
  name: string;
  avatar_url: string | null;
  metric: number;
  rank: number;
  isCurrentUser: boolean;
};

export const FriendlyLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const { userData } = useUserData();
  const { friends, loading } = useFriendSystem();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [metric, setMetric] = useState<LeaderboardMetric>('totalMinutes');

  // メトリクス名の変換
  const metricLabels = {
    totalMinutes: '総学習時間',
    averageMinutesPerDay: '平均学習時間/日',
    streakDays: '連続学習日数',
    activeDays: 'アクティブ日数'
  };

  // メトリクスのアイコン
  const metricIcons = {
    totalMinutes: <Clock className="h-4 w-4" />,
    averageMinutesPerDay: <TrendingUp className="h-4 w-4" />,
    streakDays: <Flame className="h-4 w-4" />,
    activeDays: <Calendar className="h-4 w-4" />
  };

  // データを集計してリーダーボードを作成
  const getLeaderboardData = (): LeaderboardUser[] => {
    if (!user || !userData || !friends.length) return [];
    
    // 友人データを集計（統計情報がある友人のみ）
    const friendsWithStats = friends.filter(friend => friend.stats).map(friend => {
      let metricValue = 0;
      
      switch (metric) {
        case 'totalMinutes':
          metricValue = friend.stats?.totalMinutes || 0;
          break;
        case 'averageMinutesPerDay':
          metricValue = friend.stats?.averageMinutesPerDay || 0;
          break;
        case 'streakDays':
          metricValue = friend.stats?.streakDays || 0;
          break;
        case 'activeDays':
          metricValue = friend.stats?.activeDays || 0;
          break;
      }
      
      return {
        id: friend.id,
        name: friend.name,
        avatar_url: friend.avatar_url,
        metric: metricValue,
        rank: 0, // ランクは後で計算
        isCurrentUser: false
      };
    });
    
    // 自分自身のデータを追加
    // 注: 実際の実装では自分の統計も同様に取得する必要があります
    const currentUserMetricValue = getUserMetricValue();
    
    const allUsers = [
      ...friendsWithStats,
      {
        id: user.id,
        name: userData.name,
        avatar_url: userData.avatar_url,
        metric: currentUserMetricValue,
        rank: 0,
        isCurrentUser: true
      }
    ];
    
    // メトリック値でソート（降順）
    const sortedUsers = allUsers.sort((a, b) => b.metric - a.metric);
    
    // ランクを計算
    return sortedUsers.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  };

  // 自分のメトリック値を取得（実際のアプリではデータから取得）
  const getUserMetricValue = (): number => {
    switch (metric) {
      case 'totalMinutes':
        // 実際のアプリでは、ユーザーの統計から取得
        return 120; // ダミー値
      case 'averageMinutesPerDay':
        return 20; // ダミー値
      case 'streakDays':
        return userData?.streak_days || 0;
      case 'activeDays':
        return 5; // ダミー値
      default:
        return 0;
    }
  };

  // 表示するランキングデータ
  const leaderboardData = getLeaderboardData();

  // メトリック選択ボタン
  const renderMetricButton = (metricKey: LeaderboardMetric) => (
    <button
      className={`flex items-center py-1 px-2 text-xs rounded ${
        metric === metricKey
          ? 'bg-blue-100 text-blue-800 font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      onClick={() => setMetric(metricKey)}
    >
      {metricIcons[metricKey]}
      <span className="ml-1.5">{metricLabels[metricKey]}</span>
    </button>
  );

  // ユーザーのランキング表示
  const renderUserRank = (user: LeaderboardUser) => {
    let rankColor = 'text-gray-800';
    let badgeVariant = 'default';
    
    if (user.rank === 1) {
      rankColor = 'text-amber-600';
      badgeVariant = 'warning';
    } else if (user.rank === 2) {
      rankColor = 'text-gray-500';
      badgeVariant = 'secondary';
    } else if (user.rank === 3) {
      rankColor = 'text-amber-700';
      badgeVariant = 'warning';
    }
    
    const metricSuffix = metric === 'totalMinutes' || metric === 'averageMinutesPerDay' 
      ? '分' 
      : '日';
    
    return (
      <div 
        key={user.id} 
        className={`flex items-center justify-between p-2 ${
          user.isCurrentUser ? 'bg-blue-50 rounded-lg' : ''
        } ${user.rank <= 3 ? 'border-l-4 ' + (user.rank === 1 ? 'border-amber-400' : user.rank === 2 ? 'border-gray-400' : 'border-amber-600') : ''}`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 w-7 text-center">
            <span className={`font-semibold ${rankColor}`}>{user.rank}</span>
          </div>
          
          <div className="flex items-center ml-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full mr-2"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <span className={`text-sm ${user.isCurrentUser ? 'font-medium' : ''}`}>
                {user.name} {user.isCurrentUser && <span className="text-xs text-gray-500">(あなた)</span>}
              </span>
              {user.rank === 1 && (
                <div className="flex items-center mt-0.5">
                  <Sparkles className="h-3 w-3 text-amber-500 mr-1" />
                  <span className="text-xs text-amber-600">リーダー</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm font-medium">
            {metric === 'averageMinutesPerDay' 
              ? Math.round(user.metric * 10) / 10 
              : Math.round(user.metric)}
            {metricSuffix}
          </span>
          
          {user.rank <= 3 && (
            <Badge variant={badgeVariant as any} size="sm" className="ml-2">
              {user.rank === 1 ? '1位' : user.rank === 2 ? '2位' : '3位'}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2 text-amber-500" />
          <span>友だちとの進捗</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">まだ友だちがいません</p>
            <p className="text-xs text-gray-500 mt-1">
              友だちを追加して一緒に学習を進めましょう
            </p>
          </div>
        ) : (
          <>
            {/* 期間選択 */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2 text-sm">
                <button
                  className={`py-1 px-3 rounded ${
                    period === 'week'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setPeriod('week')}
                >
                  今週
                </button>
                <button
                  className={`py-1 px-3 rounded ${
                    period === 'month'
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  onClick={() => setPeriod('month')}
                >
                  今月
                </button>
              </div>
            </div>
            
            {/* メトリック選択 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {renderMetricButton('totalMinutes')}
              {renderMetricButton('averageMinutesPerDay')}
              {renderMetricButton('streakDays')}
              {renderMetricButton('activeDays')}
            </div>
            
            {/* ランキングリスト */}
            <div className="space-y-1 mt-4">
              {leaderboardData.map(renderUserRank)}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                競争ではなく、お互いの成長を応援しましょう！
              </p>
              <p className="text-xs text-gray-500 mt-1">
                データは{period === 'week' ? '今週' : '今月'}の学習アクティビティに基づいています
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}; 