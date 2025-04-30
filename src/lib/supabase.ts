import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// accessToken関数内でClerkのトークンを取得する
// Clerk SDKがロードされ、セッションがアクティブであることを期待する
// この関数はSupabaseクライアントによって必要時に呼び出される
const getClerkToken = async (): Promise<string | null> => {
  // @ts-ignore
  if (typeof window !== 'undefined' && window.Clerk?.session) {
    try {
        // @ts-ignore
        const token = await window.Clerk.session.getToken();
        return token;
    } catch (error) {
        console.error("Error getting Clerk token:", error);
        return null;
    }
  }
  return null;
};

// createClientの第3引数に直接オプションを渡す
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    // global オプションではなく、トップレベルのオプションとして accessToken を指定
    // auth: { // auth オプションは必要に応じて設定
    //   autoRefreshToken: false,
    //   persistSession: false,
    // },
    // accessToken 関数を提供
    db: { // db オプションを追加して、その中で設定することが推奨される場合もある
        // schema: 'public', // デフォルトは public
    },
    auth: { // auth オプション内で accessToken を設定するパターンもあるが、ドキュメントに合わせてトップレベルに配置
        // persistSession: true, // デフォルトは true
    },
    // createClientの直下にaccessTokenオプションを配置するのが最近のドキュメントの例
    // 参考: https://clerk.com/docs/integrations/databases/supabase#fetch-supabase-data-in-your-code
    // 注意: supabase-js v2 のドキュメントでは global.headers や fetch をカスタマイズする例もあるが、
    // Clerk連携では accessToken がより直接的。
    // global: { headers: {} }, // これは不要かもしれない
    // dynamic access token
    async accessToken() {
        return getClerkToken();
    }
});