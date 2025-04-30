# 学習支援アプリケーション

効率的な学習習慣を身につけるためのAI搭載学習支援アプリケーションです。学習目標の設定・管理、進捗の可視化、習慣形成のサポート機能など、持続可能な学習のための包括的なツールを提供します。

## 主な機能

- **学習目標管理**: 複数の学習目標を設定し、進捗を追跡
- **学習の木**: 日々の学習をゲーム感覚で可視化
- **AIアシスタント**: パーソナライズされた学習アドバイス
- **リマインダー・習慣アンカリング**: 効果的な習慣形成をサポート
- **チャレンジ機能**: 期間限定の学習目標で集中的に学ぶ
- **フレンドリーコンペティション**: 友達と一緒に学ぶモチベーション向上機能

## 技術スタック

- フロントエンド: React, TypeScript, Vite
- スタイリング: Tailwind CSS
- UIコンポーネント: Radix UI
- バックエンド: Supabase (PostgreSQL)
- 認証: Supabase Auth
- グラフ可視化: Recharts
- ルーティング: React Router

## 開発環境のセットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/yourusername/learning-support-app.git
cd learning-support-app
```

2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

3. 環境変数の設定
   - `.env.example`ファイルを`.env`にコピー
   ```bash
   cp .env.example .env
   ```
   - Supabaseプロジェクトの認証情報を`.env`ファイルに設定
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

## Supabaseセットアップ

1. [Supabase](https://supabase.com/)でアカウントを作成
2. 新しいプロジェクトを作成
3. SQLエディタで`supabase/migrations`ディレクトリ内のSQLファイルを実行して、必要なテーブルとポリシーを設定
4. プロジェクトのURLと匿名キーを`.env`ファイルに設定

## デプロイ

```bash
npm run build
# または
yarn build
```

ビルドされたファイルは`dist`ディレクトリに出力されます。これらのファイルは任意のスタティックホスティングサービス（Netlify、Vercel、Firebase Hostingなど）でホストできます。

## ライセンス

MITライセンス 