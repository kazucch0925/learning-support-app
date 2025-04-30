import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { 
  ClerkProvider, 
  SignedIn, 
  SignedOut, 
  RedirectToSignIn, 
  useUser
} from '@clerk/clerk-react';
import Dashboard from './pages/Dashboard';
import ChallengePage from './pages/ChallengePage';
import { FriendlyCompetitionPage } from './features/friendlyCompetition/pages/FriendlyCompetitionPage';
import ClerkAuthComponent from './components/auth/ClerkAuthComponent';
import Navigation from './components/layout/Navigation';
import Button from './components/ui/Button';
import './index.css';
import { Toaster } from 'react-hot-toast';

function AuthenticatedApp() {
  const { user, isLoaded } = useUser();
  const [currentPath, setCurrentPath] = useState('/');
  const navigate = useNavigate();

  // 現在のパスを追跡
  useEffect(() => {
    const onHashChange = () => {
      const path = window.location.hash.substring(1) || '/';
      setCurrentPath(path);
    };

    // 初期パスを設定
    onHashChange();

    // ハッシュ変更イベントをリッスン
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">読み込み中...</h2>
        </div>
      </div>
    );
  }

  // パスによるコンポーネントのレンダリング
  let content;
  const isMainPath = currentPath === '/';
  
  if (currentPath === '/') {
    content = <Dashboard onNavigate={(path) => window.location.hash = path} />;
  } else if (currentPath.startsWith('/friends')) {
    content = <FriendlyCompetitionPage />;
  } else if (currentPath.startsWith('/challenge')) {
    content = <ChallengePage />;
  } else {
    // デフォルトはダッシュボード
    content = <Dashboard onNavigate={(path) => window.location.hash = path} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPath={currentPath} onNavigate={(path) => window.location.hash = path} />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {!isMainPath && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.hash = '/'} 
            className="mb-4"
          >
            ← 戻る
          </Button>
        )}
        {content}
      </main>
    </div>
  );
}

function PublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-teal-700 mb-3">学習支援アプリ</h1>
          <p className="text-xl text-gray-600">あなたの学習をより効果的に</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">効率的な学習をサポート</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="bg-teal-100 text-teal-700 p-1 rounded mr-2">✓</span>
                <span>学習時間と進捗の可視化</span>
              </li>
              <li className="flex items-start">
                <span className="bg-teal-100 text-teal-700 p-1 rounded mr-2">✓</span>
                <span>AIによる学習予測とアドバイス</span>
              </li>
              <li className="flex items-start">
                <span className="bg-teal-100 text-teal-700 p-1 rounded mr-2">✓</span>
                <span>友達との楽しい競争機能</span>
              </li>
              <li className="flex items-start">
                <span className="bg-teal-100 text-teal-700 p-1 rounded mr-2">✓</span>
                <span>目標達成のためのチャレンジ管理</span>
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2">
            <ClerkAuthComponent />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50">
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          <Route path="/*" element={
            <>
              <SignedIn>
                <AuthenticatedApp />
              </SignedIn>
              <SignedOut>
                <PublicPage />
              </SignedOut>
            </>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;