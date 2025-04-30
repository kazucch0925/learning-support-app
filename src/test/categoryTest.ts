import { CATEGORIES } from '../types';

// テスト用のデータ
const mockGoals = [
  {
    id: '1',
    title: '日本語学習',
    description: 'JLPT N3を目指す',
    categories: ['language', 'reading'],
    target_minutes_per_day: 30,
    current_minutes_per_day: 15,
    streak_days: 3
  },
  {
    id: '2',
    title: 'プログラミング練習',
    description: 'TypeScriptを身につける',
    categories: ['programming', 'writing'],
    target_minutes_per_day: 45,
    current_minutes_per_day: 20,
    streak_days: 5
  },
  {
    id: '3',
    title: '数学の勉強',
    description: '線形代数の基礎を固める',
    categories: ['math', 'science', 'programming'],
    target_minutes_per_day: 60,
    current_minutes_per_day: 30,
    streak_days: 8
  }
];

// カテゴリIDから名前と色の情報を取得する
function getCategoryDetails(categoryIds: string[]) {
  return categoryIds.map(id => {
    const category = CATEGORIES.find(c => c.id === id);
    return category ? { id, name: category.name, color: category.color } : null;
  }).filter(Boolean);
}

// テスト実行
function runTest() {
  console.log('=== 複数カテゴリ選択機能のテスト ===');
  
  mockGoals.forEach(goal => {
    console.log(`\n目標: ${goal.title}`);
    console.log(`説明: ${goal.description}`);
    console.log('カテゴリ:');
    
    const categoryDetails = getCategoryDetails(goal.categories);
    categoryDetails.forEach(category => {
      if (category) {
        console.log(`- ${category.name} (${category.id}, 色: ${category.color})`);
      }
    });
    
    console.log(`選択されたカテゴリ数: ${goal.categories.length}`);
    
    // 表示ロジックのテスト
    const displayCategoryCount = 3;
    const displayCategories = categoryDetails.slice(0, displayCategoryCount);
    const remainingCount = Math.max(0, categoryDetails.length - displayCategoryCount);
    
    console.log('\n表示カテゴリ:');
    displayCategories.forEach(category => {
      if (category) {
        console.log(`- ${category.name}`);
      }
    });
    
    if (remainingCount > 0) {
      console.log(`※その他 +${remainingCount}カテゴリ`);
    }
  });
  
  console.log('\n=== テスト完了 ===');
}

// テストを実行
runTest();

export { mockGoals, getCategoryDetails, runTest }; 