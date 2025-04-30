// ダッシュボードと友人競争機能の連携テスト
console.log('-----連携テスト開始-----');

// Dashboardとナビゲーション機能の統合テスト
class MockNavigation {
  constructor() {
    this.currentPath = '/';
    this.history = [];
  }

  navigate(path) {
    this.history.push(this.currentPath);
    this.currentPath = path;
    console.log(`  ナビゲーション: ${this.currentPath} に移動`);
    return true;
  }

  getHistory() {
    return this.history;
  }
}

// Dashboard.tsx のonNavigate関数をモックした簡易版
class MockDashboard {
  constructor(navigation) {
    this.navigation = navigation;
  }

  onNavigate(path) {
    console.log(`  ダッシュボードからナビゲーション呼び出し: ${path}`);
    return this.navigation.navigate(path);
  }

  // 友だちボタンクリックシミュレーション
  clickFriendsButton() {
    console.log('  「友だちと学ぶ」ボタンをクリック');
    return this.onNavigate('/friends');
  }
}

// テスト実行
console.log('\n1. ダッシュボードから友だちページへの遷移テスト:');
const nav = new MockNavigation();
const dashboard = new MockDashboard(nav);
dashboard.clickFriendsButton();
console.log(`  現在のパス: ${nav.currentPath}`);
console.log(`  履歴: ${nav.getHistory().join(' -> ')}`);

// FriendlyCompetitionPageとリーダーボードのロードテスト
class MockFriendSystem {
  constructor() {
    this.friends = [
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
      }
    ];
    this.loading = false;
  }
}

class MockLeaderboard {
  constructor(friendSystem) {
    this.friendSystem = friendSystem;
    this.period = 'week';
    this.metric = 'totalMinutes';
  }

  render() {
    const { friends } = this.friendSystem;
    if (friends.length === 0) {
      console.log('  リーダーボード: 友だちがいません');
      return [];
    }

    console.log(`  リーダーボード: ${friends.length}人の友だちデータをロード`);
    console.log(`  期間: ${this.period}, 指標: ${this.metric}`);

    // ランキングを生成（自分のデータも含める）
    const rankings = [
      ...friends.map(friend => ({
        name: friend.name,
        metric: friend.stats[this.metric],
        isCurrentUser: false
      })),
      {
        name: '山田健太（あなた）',
        metric: 210,
        isCurrentUser: true
      }
    ].sort((a, b) => b.metric - a.metric);

    // ランキングを表示
    console.log('  ランキング結果:');
    rankings.forEach((user, index) => {
      console.log(`    ${index + 1}位: ${user.name} - ${user.metric}${this.metric === 'totalMinutes' ? '分' : this.metric === 'averageMinutesPerDay' ? '分/日' : '日'}`);
    });

    return rankings;
  }

  // メトリック変更シミュレーション
  changeMetric(metric) {
    console.log(`  メトリックを「${metric}」に変更`);
    this.metric = metric;
    return this.render();
  }
}

// FriendlyCompetitionPage コンポーネントのモック
class MockFriendlyCompetitionPage {
  constructor() {
    this.friendSystem = new MockFriendSystem();
    this.leaderboard = new MockLeaderboard(this.friendSystem);
  }

  render() {
    console.log('  友だちページをレンダリング');
    return this.leaderboard.render();
  }
}

// テスト実行
console.log('\n2. 友だちページとリーダーボードのテスト:');
const friendPage = new MockFriendlyCompetitionPage();
const rankings = friendPage.render();
console.log(`  ランキング数: ${rankings.length}`);

// メトリック変更テスト
console.log('\n3. リーダーボードのメトリック変更テスト:');
friendPage.leaderboard.changeMetric('averageMinutesPerDay');
friendPage.leaderboard.changeMetric('streakDays');

// ナビゲーションからDashboardに戻るテスト
console.log('\n4. 友だちページからダッシュボードに戻るテスト:');
nav.navigate('/');
console.log(`  現在のパス: ${nav.currentPath}`);
console.log(`  履歴: ${nav.getHistory().join(' -> ')}`);

console.log('\n-----連携テスト完了-----'); 