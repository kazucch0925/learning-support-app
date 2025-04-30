import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Dashboard from './pages/Dashboard';
import ChallengePage from './pages/ChallengePage';
import { FriendlyCompetitionPage } from './features/friendlyCompetition/pages/FriendlyCompetitionPage';
import AuthForm from './components/auth/AuthForm';
import Navigation from './components/layout/Navigation';
import Button from './components/ui/Button';
import { useAuth } from './contexts/AuthContext';
import './index.css';
import { Toaster } from 'react-hot-toast';

function AuthenticatedApp() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');

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

  // ナビゲーション関数
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">読み込み中...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // パスによるコンポーネントのレンダリング
  let content;
  const isMainPath = currentPath === '/';
  
  if (currentPath === '/') {
    content = <Dashboard onNavigate={navigate} />;
  } else if (currentPath.startsWith('/friends')) {
    content = <FriendlyCompetitionPage />;
  } else if (currentPath.startsWith('/challenge')) {
    content = <ChallengePage />;
  } else {
    // デフォルトはダッシュボード
    content = <Dashboard onNavigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPath={currentPath} onNavigate={navigate} />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {!isMainPath && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')} 
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

function App() {
  return (
    <div className="font-sans antialiased text-gray-900 bg-gray-50">
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-center" reverseOrder={false} />
          <AuthenticatedApp />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;