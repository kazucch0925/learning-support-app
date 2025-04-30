import { v5 as uuidv5 } from 'uuid';

// 名前空間としてアプリケーション固有のUUIDを使用
// 実際の実装では、環境変数などで管理するとよい
const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

/**
 * ClerkのユーザーIDをUUID形式に変換する
 * @param clerkId Clerkから取得したユーザーID
 * @returns UUID形式の文字列
 */
export const convertClerkIdToUuid = (clerkId: string): string => {
  try {
    // UUIDv5を使用して一貫性のあるUUIDを生成
    return uuidv5(clerkId, NAMESPACE);
  } catch (error) {
    console.error('ユーザーIDの変換に失敗しました:', error);
    throw new Error('ユーザーIDの変換に失敗しました');
  }
}; 