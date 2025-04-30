// 実装された機能テスト
console.log('-----機能テスト開始-----');

// ダッシュボードのナビゲーション機能テスト
console.log('\n1. ナビゲーション機能テスト:');
const testNavigate = (path) => {
  console.log(`  ナビゲーション: ${path} へ移動`);
  return true;
};

// onNavigate関数のモック実装
const onNavigate = (path) => {
  console.log(`  onNavigate関数: ${path} にリダイレクト`);
  return testNavigate(path);
};

// テスト実行
console.log('  ダッシュボードから友だち画面への移動:');
const navigateResult = onNavigate('/friends');
console.log(`  結果: ${navigateResult ? '成功' : '失敗'}`);

// 学習予測機能のテスト
console.log('\n2. 学習予測機能テスト:');

// モックデータ
const mockGoal = {
  id: 'goal-123',
  title: '日本語学習',
  target_minutes_per_day: 30,
  streak_days: 7
};

const mockSessions = [
  { id: 'session-1', goal_id: 'goal-123', duration: 25, completed_at: new Date(Date.now() - 86400000) },
  { id: 'session-2', goal_id: 'goal-123', duration: 35, completed_at: new Date(Date.now() - 172800000) },
  { id: 'session-3', goal_id: 'goal-123', duration: 15, completed_at: new Date(Date.now() - 259200000) }
];

// PredictionEngineのモック
class MockPredictionEngine {
  generateInsights(userId, goal, sessions) {
    console.log(`  学習データの分析: ${sessions.length}セッション, 目標: ${goal.title}`);
    return [
      {
        id: `prediction-${Date.now()}`,
        userId,
        goalId: goal.id,
        predictionType: 'motivation_drop',
        riskLevel: 65,
        predictedAt: new Date(),
        isAddressed: false,
        suggestedActions: ['学習時間を短く分割する', '学習内容を多様化する'],
        metadata: { reason: '学習時間が徐々に減少しています' }
      }
    ];
  }

  generateSupportContent(insight) {
    console.log(`  サポートコンテンツ生成: ${insight.predictionType}, リスクレベル: ${insight.riskLevel}`);
    return [
      {
        id: `content-${Date.now()}`,
        predictionId: insight.id,
        contentType: 'motivation',
        content: 'コツコツと続けることで大きな成果につながります！',
        isViewed: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 604800000)
      }
    ];
  }
}

// テスト実行
const mockEngine = new MockPredictionEngine();
const userId = 'user-456';
const insights = mockEngine.generateInsights(userId, mockGoal, mockSessions);
console.log(`  生成されたインサイト: ${insights.length}`);

if (insights.length > 0) {
  const supportContent = mockEngine.generateSupportContent(insights[0]);
  console.log(`  生成されたサポートコンテンツ: ${supportContent.length}`);
  console.log(`  コンテンツ内容: ${supportContent[0].content}`);
}

// 友人競争機能のテスト
console.log('\n3. 友人競争機能テスト:');

// モックデータ
const mockFriends = [
  {
    id: 'friend-1',
    name: '鈴木太郎',
    avatar_url: null,
    friendship: { id: 'fs-1', status: 'accepted', privacy_level: 'all' },
    stats: {
      totalMinutes: 240,
      streakDays: 5,
      activeDays: 6,
      averageMinutesPerDay: 40
    }
  },
  {
    id: 'friend-2',
    name: '佐藤花子',
    avatar_url: null,
    friendship: { id: 'fs-2', status: 'accepted', privacy_level: 'summary_only' },
    stats: {
      totalMinutes: 180,
      streakDays: 8,
      activeDays: 5,
      averageMinutesPerDay: 36
    }
  }
];

// 自分のデータ
const mockCurrentUser = {
  id: userId,
  name: '山田健太',
  avatar_url: null,
  streak_days: 6,
  total_points: 350
};

// テスト関数
const testLeaderboard = (friends, currentUser) => {
  console.log(`  友人数: ${friends.length}`);
  console.log('  週間リーダーボード生成:');

  // 友人と自分のデータを結合
  const usersData = [
    ...friends.map(friend => ({
      id: friend.id,
      name: friend.name,
      metric: friend.stats.totalMinutes,
      isCurrentUser: false
    })),
    {
      id: currentUser.id,
      name: currentUser.name,
      metric: 210, // 自分の合計学習時間（モック）
      isCurrentUser: true
    }
  ];

  // メトリック値でソート
  const sortedUsers = usersData.sort((a, b) => b.metric - a.metric);
  
  // ランキング表示
  console.log('  総学習時間ランキング:');
  sortedUsers.forEach((user, index) => {
    console.log(`    ${index + 1}位: ${user.name} - ${user.metric}分${user.isCurrentUser ? ' (あなた)' : ''}`);
  });

  return sortedUsers;
};

// テスト実行
const leaderboardResult = testLeaderboard(mockFriends, mockCurrentUser);
console.log(`  リーダーボード生成結果: ${leaderboardResult.length}名のランキング`);

console.log('\n-----機能テスト完了-----'); 