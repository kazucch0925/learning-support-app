import React, { useState, useEffect } from 'react';
import { useSharedChallenges } from '../hooks/useSharedChallenges';
import { useAuth } from '../contexts/AuthContext';
import ChallengeCard from '../components/ChallengeCard';
import CreateChallengeForm from '../components/CreateChallengeForm';
import ChallengeDetailPage from './ChallengeDetailPage';
import Button from '../components/ui/Button';
import { Plus, RefreshCw } from 'lucide-react';
import Modal from '../components/ui/Modal';

type ProcessedChallenge = {
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

export default function ChallengePage() {
  const { user } = useAuth();
  const { 
    challenges, 
    loading, 
    error, 
    createChallenge, 
    joinChallenge, 
    leaveChallenge, 
    logChallengeSession, 
    refreshChallenges: fetchChallenges 
  } = useSharedChallenges();
  
  const [processedChallenges, setProcessedChallenges] = useState<ProcessedChallenge[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showMyOnly, setShowMyOnly] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [viewingChallengeId, setViewingChallengeId] = useState<string | null>(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [minutesToLog, setMinutesToLog] = useState(30);

  useEffect(() => {
    // URLからchallengeIdを取得
    const path = window.location.pathname;
    if (path.startsWith('/challenge/')) {
      const id = path.split('/challenge/')[1];
      if (id) {
        setSelectedChallengeId(id);
      }
    }
  }, []);

  // 取得したチャレンジデータをChallengeCardコンポーネントに合う形式に変換
  useEffect(() => {
    if (!challenges || challenges.length === 0) return;

    const processed: ProcessedChallenge[] = challenges.map(challenge => {
      // 参加者リストを変換
      const participantsList = challenge.participant_details ? 
        challenge.participant_details.map(p => ({
          id: p.id,
          name: p.name,
          avatar_url: p.avatar_url || undefined // nullをundefinedに変換
        })) : 
        challenge.participants.map(id => ({ 
          id, 
          name: '参加者', 
          avatar_url: undefined 
        }));

      // 進捗情報を変換
      const progressList = challenge.progress.map(p => ({
        user_id: p.user_id,
        minutes_completed: p.minutes_completed
      }));

      return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        start_date: challenge.start_date,
        end_date: challenge.end_date,
        target_minutes: challenge.target_minutes,
        creator_id: challenge.creator_id,
        created_at: challenge.created_at,
        participants: participantsList,
        progress: progressList
      };
    });

    setProcessedChallenges(processed);
  }, [challenges]);

  const handleCreateChallenge = async (
    title: string,
    description: string,
    category: string,
    startDate: Date,
    endDate: Date,
    targetMinutes: number,
    participants: string[]
  ) => {
    try {
      await createChallenge(
        title, 
        description, 
        category, 
        startDate, 
        endDate, 
        targetMinutes, 
        participants
      );
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('チャレンジの作成に失敗しました', error);
    }
  };

  const handleViewDetails = (challengeId: string) => {
    setViewingChallengeId(challengeId);
  };

  const handleBackToList = () => {
    setViewingChallengeId(null);
  };

  const handleLogProgress = async () => {
    if (!selectedChallengeId) return;
    
    try {
      await logChallengeSession(selectedChallengeId, minutesToLog);
      setLogModalOpen(false);
      setSelectedChallengeId(null);
    } catch (error) {
      console.error('進捗の記録に失敗しました', error);
    }
  };

  const openLogModal = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setLogModalOpen(true);
  };

  // チャレンジ詳細ページを表示中の場合
  if (viewingChallengeId) {
    return (
      <ChallengeDetailPage 
        challengeId={viewingChallengeId} 
        onBack={handleBackToList} 
      />
    );
  }

  // フィルタリングされたチャレンジのリスト
  const filteredChallenges = showMyOnly && user 
    ? processedChallenges.filter(c => c.participants.some(p => p.id === user.id)) 
    : processedChallenges;
  
  // アクティブ、今後、完了済みのチャレンジに分類
  const now = new Date();
  const activeChallenges = filteredChallenges.filter(
    c => new Date(c.start_date) <= now && new Date(c.end_date) >= now
  );
  const upcomingChallenges = filteredChallenges.filter(
    c => new Date(c.start_date) > now
  );
  const completedChallenges = filteredChallenges.filter(
    c => new Date(c.end_date) < now
  );

  // ページのコンテンツを変更するための条件
  const specificChallenge = selectedChallengeId ? processedChallenges.find(c => c.id === selectedChallengeId) : null;

  // ユーザーがチャレンジに参加しているかどうかを確認する関数
  const userHasJoined = (challenge: ProcessedChallenge) => {
    return challenge.participants.some(participant => participant.id === user?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">チャレンジ</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchChallenges()}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            更新
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            新規作成
          </Button>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <label className="flex items-center text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showMyOnly}
            onChange={(e) => setShowMyOnly(e.target.checked)}
            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mr-2"
          />
          参加中のチャレンジのみ表示
        </label>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">チャレンジを読み込み中...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <p>エラーが発生しました: {error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchChallenges()}
            className="mt-2"
          >
            再試行
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {specificChallenge ? (
            // 特定のチャレンジが選択されている場合の表示
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">{specificChallenge.title}</h2>
              <p className="mb-4">{specificChallenge.description}</p>
              <div className="mb-4">
                <span className="font-semibold">期間:</span> {new Date(specificChallenge.start_date).toLocaleDateString()} から {new Date(specificChallenge.end_date).toLocaleDateString()}
              </div>
              <div className="mb-4">
                <span className="font-semibold">目標:</span> {specificChallenge.target_minutes} 分
              </div>
              <div className="mb-4">
                <span className="font-semibold">参加者:</span> {specificChallenge.participants.length}人
              </div>
              <div className="flex space-x-4 mt-6">
                {userHasJoined(specificChallenge) ? (
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setSelectedChallengeId(specificChallenge.id);
                      setLogModalOpen(true);
                    }}
                  >
                    進捗を記録
                  </Button>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={() => joinChallenge(specificChallenge.id)}
                  >
                    参加する
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  onClick={() => setSelectedChallengeId(null)}
                >
                  戻る
                </Button>
              </div>
            </div>
          ) : (
            <>
              {activeChallenges.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">進行中のチャレンジ</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeChallenges.map(challenge => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        userId={user?.id || ''}
                        onJoin={() => joinChallenge(challenge.id)}
                        onLeave={() => leaveChallenge(challenge.id)}
                        onLogProgress={() => openLogModal(challenge.id)}
                        onViewDetails={() => handleViewDetails(challenge.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {upcomingChallenges.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">今後のチャレンジ</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingChallenges.map(challenge => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        userId={user?.id || ''}
                        onJoin={() => joinChallenge(challenge.id)}
                        onLeave={() => leaveChallenge(challenge.id)} 
                        onLogProgress={() => openLogModal(challenge.id)}
                        onViewDetails={() => handleViewDetails(challenge.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {completedChallenges.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">完了したチャレンジ</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedChallenges.map(challenge => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        userId={user?.id || ''}
                        onJoin={() => joinChallenge(challenge.id)}
                        onLeave={() => leaveChallenge(challenge.id)}
                        onLogProgress={() => openLogModal(challenge.id)}
                        onViewDetails={() => handleViewDetails(challenge.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filteredChallenges.length === 0 && !loading && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-4">
                    {showMyOnly 
                      ? "参加中のチャレンジはありません"
                      : "表示できるチャレンジがありません"}
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    新しいチャレンジを作成
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* チャレンジ作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="新しいチャレンジの作成"
      >
        <CreateChallengeForm
          onSubmit={handleCreateChallenge}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* 進捗記録モーダル */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        title="学習時間の記録"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            今回の学習時間（分）を入力してください。
          </p>
          <input
            type="number"
            min={1}
            max={1440}
            value={minutesToLog}
            onChange={(e) => setMinutesToLog(parseInt(e.target.value) || 30)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setLogModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              onClick={handleLogProgress}
            >
              記録する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 