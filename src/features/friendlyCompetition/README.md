# 友人との穏やかな競争機能

## 概要
ユーザー同士が互いのモチベーションを高めるための穏やかな競争機能です。学習の継続とモチベーション維持を促進しながら、ポジティブな交流を実現します。

## 主な特徴
1. **友人の進捗共有**：相互に進捗状況を共有
2. **週間リーダーボード**：穏やかなランキング表示
3. **チャレンジの共有**：同じ目標に取り組むことで連帯感を創出
4. **達成の称賛**：互いの成果を祝福する機能
5. **サポートメッセージ**：応援メッセージの送信機能

## 実装コンポーネント
1. **FriendSystem**: 友人関係の管理
   - 友人追加機能
   - 友人リスト表示
   - プライバシー設定

2. **ProgressComparison**: 進捗比較機能
   - 友人との進捗状況比較
   - 週間・月間の学習時間グラフ
   - 目標達成率の可視化

3. **FriendlyLeaderboard**: 穏やかなリーダーボード
   - 週間アクティビティ
   - 平均学習時間
   - 継続日数
   - ポジティブな表現（「勝ち負け」ではなく「成長」を強調）

4. **SharedChallenges**: 共有チャレンジ機能
   - 同じ目標への取り組み
   - 同時学習セッション
   - グループ目標の設定と追跡

5. **SupportSystem**: サポートシステム
   - 応援メッセージの送信
   - 達成の祝福
   - モチベーションボーナス

## データモデル拡張
```
friendships {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: timestamp
  updated_at: timestamp
  privacy_level: 'all' | 'goals_only' | 'summary_only'
}

messages {
  id: string
  sender_id: string
  receiver_id: string
  message_type: 'support' | 'congratulation' | 'challenge' | 'general'
  content: string
  is_read: boolean
  created_at: timestamp
}

shared_challenges {
  id: string
  title: string
  description: string
  creator_id: string
  start_date: timestamp
  end_date: timestamp
  target_minutes: number
  category: string
  participants: string[] // user_ids
  created_at: timestamp
  updated_at: timestamp
}

challenge_progress {
  id: string
  challenge_id: string
  user_id: string
  minutes_completed: number
  last_activity: timestamp
  created_at: timestamp
  updated_at: timestamp
}
```

## UI/UX設計
1. **友人タブ**：
   - 友人リスト
   - 友人追加機能
   - プライバシー設定

2. **リーダーボード**：
   - 友人グループ内の進捗比較
   - 週間/月間切り替え
   - ポジティブな表現と視覚的デザイン

3. **チャレンジ**：
   - チャレンジ作成/参加フォーム
   - 進行中チャレンジのカード表示
   - チャレンジ詳細ビュー（参加者の進捗など）

4. **サポート機能**：
   - メッセージ送信インターフェース
   - 通知システム
   - 達成お祝い機能

## プライバシーとエチケット
- すべての競争は完全にオプトイン式
- 詳細な進捗共有はユーザーが許可した友人のみに
- ネガティブな競争を避けるための設計（「負け」の概念を排除）
- ポジティブなフィードバックを中心とした交流設計 