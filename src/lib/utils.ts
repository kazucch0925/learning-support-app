/**
 * ClassNameをマージするユーティリティ関数
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// convertClerkIdToUuid 関数全体を削除 