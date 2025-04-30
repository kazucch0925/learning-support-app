import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Check, 
  X, 
  Clock, 
  MessageCircle, 
  UserMinus, 
  Settings, 
  // ChevronDown, 
  // Medal,
  Star
} from 'lucide-react';
import { useFriendSystem, PrivacyLevel } from '../hooks/useFriendSystem';
import Card, { CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

export const FriendsList: React.FC = () => {
  const { 
    friends, 
    pendingRequests, 
    sentRequests, 
    loading, 
    error, 
    searchResults, 
    searchLoading, 
    searchUsers, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest, 
    cancelFriendRequest, 
    removeFriend, 
    updatePrivacySettings 
  } = useFriendSystem();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [showSearchSection, setShowSearchSection] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean>>({});

  // 検索ハンドラー
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      searchUsers(searchQuery);
    }
  };

  // プライバシー設定の切り替え
  const togglePrivacySettings = (friendshipId: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [friendshipId]: !prev[friendshipId]
    }));
  };

  // プライバシーレベルの更新
  const handleUpdatePrivacy = async (friendshipId: string, level: PrivacyLevel) => {
    await updatePrivacySettings(friendshipId, level);
    togglePrivacySettings(friendshipId);
  };

  // 待機中の友人リクエスト数
  const pendingRequestsCount = pendingRequests.length;

  // 送信中の友人リクエスト数
  const sentRequestsCount = sentRequests.length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
            <span>友人</span>
            {pendingRequestsCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-2">
                {pendingRequestsCount}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearchSection(!showSearchSection)}
            icon={<UserPlus className="h-4 w-4" />}
          >
            友だちを追加
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {/* 友人検索セクション */}
        {showSearchSection && (
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-md font-medium mb-2">友だちを検索</h3>
            <form onSubmit={handleSearch} className="flex mb-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  className="w-full p-2 pl-10 border rounded-md"
                  placeholder="名前で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  minLength={2}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="ml-2"
                disabled={searchLoading || searchQuery.trim().length < 2}
              >
                検索
              </Button>
            </form>

            {searchLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">検索中...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span>{user.name}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendFriendRequest(user.id)}
                      icon={<UserPlus className="h-4 w-4" />}
                    >
                      追加
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <p className="text-gray-500 text-center py-2">ユーザーが見つかりませんでした</p>
            ) : null}
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 ${
              activeTab === 'friends'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('friends')}
          >
            友だち ({friends.length})
          </button>
          <button
            className={`py-2 px-4 flex items-center ${
              activeTab === 'requests'
                ? 'text-blue-600 border-b-2 border-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            リクエスト 
            {(pendingRequestsCount > 0 || sentRequestsCount > 0) && (
              <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {pendingRequestsCount + sentRequestsCount}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : activeTab === 'friends' ? (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">まだ友だちがいません</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSearchSection(true)}
                  icon={<UserPlus className="h-4 w-4" />}
                  className="mt-2"
                >
                  友だちを追加
                </Button>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center text-lg">
                          {friend.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{friend.name}</h3>
                          {/* ストリーク表示 */}
                          {friend.streak_days > 0 && (
                            <div className="flex items-center ml-2 text-xs text-amber-600">
                              <Star className="h-3 w-3 mr-1 text-amber-600" />
                              <span>{friend.streak_days}日連続</span>
                            </div>
                          )}
                        </div>
                        {/* 学習統計情報 */}
                        {friend.stats && (
                          <div className="text-xs text-gray-500 mt-1">
                            <span>30日間: {friend.stats.totalMinutes}分</span>
                            <span className="mx-1">•</span>
                            <span>平均: {Math.round(friend.stats.averageMinutesPerDay)}分/日</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex">
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => setSelectedFriendId(friend.id === selectedFriendId ? null : friend.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => togglePrivacySettings(friend.friendship.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* プライバシー設定ドロップダウン */}
                  {privacySettings[friend.friendship.id] && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-2">プライバシー設定</h4>
                      <div className="space-y-2">
                        <button
                          className={`w-full text-left p-2 text-sm rounded ${
                            friend.friendship.privacy_level === PrivacyLevel.ALL
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-200'
                          }`}
                          onClick={() => handleUpdatePrivacy(friend.friendship.id, PrivacyLevel.ALL)}
                        >
                          すべて共有（目標・進捗・統計）
                        </button>
                        <button
                          className={`w-full text-left p-2 text-sm rounded ${
                            friend.friendship.privacy_level === PrivacyLevel.GOALS_ONLY
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-200'
                          }`}
                          onClick={() => handleUpdatePrivacy(friend.friendship.id, PrivacyLevel.GOALS_ONLY)}
                        >
                          目標のみ共有（進捗・統計は非公開）
                        </button>
                        <button
                          className={`w-full text-left p-2 text-sm rounded ${
                            friend.friendship.privacy_level === PrivacyLevel.SUMMARY_ONLY
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-200'
                          }`}
                          onClick={() => handleUpdatePrivacy(friend.friendship.id, PrivacyLevel.SUMMARY_ONLY)}
                        >
                          サマリーのみ共有（詳細は非公開）
                        </button>
                        <div className="pt-2 border-t">
                          <button
                            className="w-full text-left p-2 text-sm text-red-600 rounded hover:bg-red-50 flex items-center"
                            onClick={() => {
                              if (window.confirm('この友人を削除しますか？')) {
                                removeFriend(friend.friendship.id);
                              }
                            }}
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            友だち関係を解除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* メッセージ入力エリア */}
                  {selectedFriendId === friend.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="flex-1 p-2 border rounded-l-md"
                          placeholder="励ましのメッセージを送る..."
                        />
                        <button className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700">
                          送信
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">受信したリクエスト</h3>
                <div className="space-y-2">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        {request.avatar_url ? (
                          <img
                            src={request.avatar_url}
                            alt={request.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                            {request.name.charAt(0)}
                          </div>
                        )}
                        <span>{request.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-full"
                          onClick={() => acceptFriendRequest(request.friendship.id)}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => declineFriendRequest(request.friendship.id)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">送信したリクエスト</h3>
                <div className="space-y-2">
                  {sentRequests.map(request => (
                    <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center">
                        {request.avatar_url ? (
                          <img
                            src={request.avatar_url}
                            alt={request.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                            {request.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span>{request.name}</span>
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>承認待ち</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"
                        onClick={() => cancelFriendRequest(request.friendship.id)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">リクエストはありません</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 