# つまずきポイント予測とサポート機能

## 概要
ユーザーの学習パターンと進捗データを分析し、今後つまずく可能性がある箇所を予測して、事前にサポートコンテンツを提供する機能です。

## 主な特徴
1. **学習パターン分析**：過去の学習セッションと進捗データから、学習の傾向を分析
2. **つまずきポイント予測**：ストリーク中断、目標未達成、学習時間の減少などから問題点を予測
3. **パーソナライズされたサポート**：予測された問題に基づいてアドバイスやリソースを提供
4. **予防的通知**：学習習慣の中断を防ぐための適切なタイミングでの通知

## 実装コンポーネント
1. **LearningAnalyzer**: 学習データの分析クラス
   - 学習パターンの識別（時間帯、曜日、継続時間など）
   - 進捗速度の計算
   - ストリーク中断パターンの識別

2. **PredictionEngine**: つまずきポイントを予測するエンジン
   - 過去のデータに基づく将来予測
   - リスク評価アルゴリズム

3. **ContentRecommender**: サポートコンテンツの推薦システム
   - ユーザーの状況に合わせたアドバイス生成
   - モチベーション維持のためのコンテンツ提供

4. **UI Components**:
   - 予測結果の表示インターフェース
   - サポートコンテンツの提示方法

## データモデル拡張
```
prediction_insights {
  id: string
  user_id: string
  goal_id: string
  prediction_type: 'streak_risk' | 'motivation_drop' | 'time_constraint'
  risk_level: number (0-100)
  predicted_at: timestamp
  is_addressed: boolean
  suggested_actions: string[]
  metadata: JSON
}

support_contents {
  id: string
  prediction_id: string
  content_type: 'tip' | 'resource' | 'motivation' | 'adjustment'
  content: string
  is_viewed: boolean
  created_at: timestamp
  expires_at: timestamp
}
```

## 実装フロー
1. 日次バッチ処理で学習データを分析
2. リスク評価アルゴリズムによる予測生成
3. 高リスクの予測に対してサポートコンテンツを生成
4. ダッシュボードでの予測とサポート情報の表示
5. 予測に基づく通知の送信

## UI/UX設計
- ダッシュボードに「学習インサイト」セクションを追加
- リスクレベルに応じた視覚的表示（信号機方式）
- サポートコンテンツの階層的表示（概要→詳細）
- ユーザーアクションの促進デザイン 