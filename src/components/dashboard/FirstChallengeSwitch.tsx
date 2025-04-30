import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust path as needed
import { useAuth } from '../../contexts/AuthContext'; // Adjust path as needed
import toast from 'react-hot-toast';

// 日本時間（JST）での今日の日付を取得するヘルパー関数
const getTodayJST = (): string => {
  const now = new Date();
  // UTCベースの日付を取得し、JSTに変換（+9時間）
  const jstDate = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  // YYYY-MM-DD形式の文字列にフォーマット
  return jstDate.toISOString().split('T')[0];
};

function DailyBonusHandler() {
  const { user } = useAuth();
  const [hasProcessed, setHasProcessed] = useState(false); // Avoid multiple calls
  const [lastProcessedDate, setLastProcessedDate] = useState<string>('');
  const checkIntervalRef = useRef<number | null>(null);

  // 新しい日付かどうかを確認する関数 - JST基準
  const isNewDay = useCallback(() => {
    const todayJST = getTodayJST();
    return todayJST !== lastProcessedDate;
  }, [lastProcessedDate]);

  const processDailyBonus = useCallback(async (force = false) => {
    if (!user) return;
    if (hasProcessed && !force) return;

    const todayJST = getTodayJST();
    
    // 既に処理済みの日付でなければ処理を実行する
    if (force || todayJST !== lastProcessedDate) {
      setHasProcessed(true); // Mark as processed for this session
      
      try {
        // Always call the function, it handles the logic internally
        const { data, error } = await supabase.rpc('complete_first_challenge');
        
        if (error) {
          // Log error but don't necessarily show to user unless critical
          console.error('Error processing daily bonus:', error);
          // Optionally show a generic error toast for critical failures
          // toast.error('ログインボーナスの処理中にエラーが発生しました。');
          return;
        }

        // 処理日を記録 - JST基準
        setLastProcessedDate(todayJST);

        // Only show toast if points were actually earned (i.e., first time today)
        if (data && data.success && data.points_earned > 0) {
          toast.success(`今日のログインボーナス！ ${data.points_earned}ポイント獲得！ 🔥連続 ${data.streak}日目！`);
          // Here you might want to trigger a refresh of user data context if total points are displayed elsewhere
          // Example: refreshUserData(); (if available from context)
        } else if (data && !data.success && data.message.includes('既に完了')) {
           // Already completed today, do nothing silently
        } else if (data && !data.success) {
          // Other non-success cases returned by the function (e.g., generic error)
          console.warn('Daily bonus function returned non-success:', data.message);
          // toast.error(data.message); // Show specific error if needed
        }

      } catch (error: any) {
        console.error('Unhandled error processing daily bonus:', error);
        // toast.error('ログインボーナスの処理中に予期せぬエラーが発生しました。');
      }
    }
  }, [user, hasProcessed, lastProcessedDate]);

  // 日付変更チェック用のインターバルを設定
  useEffect(() => {
    // 定期的に日付変更をチェック（60秒ごと）
    if (user) {
      // まず現在の日付を記録 - JST基準
      const todayJST = getTodayJST();
      if (!lastProcessedDate) {
        setLastProcessedDate(todayJST);
      }

      // インターバルを設定
      checkIntervalRef.current = window.setInterval(() => {
        if (isNewDay()) {
          processDailyBonus(true);
        }
      }, 60000); // 1分ごとにチェック
    }

    return () => {
      // コンポーネントのアンマウント時にインターバルをクリア
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, isNewDay, processDailyBonus, lastProcessedDate]);

  // 初回レンダリング時のログインボーナス処理
  useEffect(() => {
    // Process bonus once user is loaded and it hasn't been processed in this component instance
    if (user && !hasProcessed) {
      processDailyBonus();
    }
    // Dependency array ensures this runs when user loads or processDailyBonus changes
  }, [user, hasProcessed, processDailyBonus]);

  // This component now renders nothing, it just handles the logic
  return null;
}

export default DailyBonusHandler; 