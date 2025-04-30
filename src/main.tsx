import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Clerk公開キーを環境変数から取得
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// キーがない場合の開発環境用エラー
if (!publishableKey) {
  console.error('Clerk公開キーが設定されていません。');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>
);
