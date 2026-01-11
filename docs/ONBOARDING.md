# Data Gallery Onboarding Guide

## アプリの全体像
- Next.js 15 (App Router) を使ったシンプルなギャラリーアプリです。トップページ (`src/app/page.tsx`) で Supabase から作品一覧を読み込み、票数順にカード表示します。
- UI は MUI v7 コンポーネントで組み立てられており、グローバルスタイルは `src/app/globals.css` で設定しています。
- Supabase をデータストアとして使用し、閲覧用は公開キー、投票 API では service_role キーを使い分けています。

## 重要な構成要素
- `src/app/page.tsx`: サーバーコンポーネントで作品を取得し、グリッドに `WorkCard` を並べます。
- `src/components/WorkCard.tsx`: クライアントコンポーネント。票数表示と投票ボタンを持ち、`/api/vote` に POST して楽観的に票数を更新します。
- `src/app/api/vote/route.ts`: Next.js Route Handler。`vote_events` に挿入し、Supabase のトリガーで `works.votes_count` を増やした後、最新票数を返します。
- `src/lib/supabaseClient.ts`: Supabase クライアント生成をブラウザ用とサーバー用で分離しています（service_role 用と、公開キーでの参照専用クライアントを用意）。
- `src/schemas/index.ts`: Supabase のレスポンスや API 入力のスキーマを Zod で定義しています。

## 環境変数
`.env.local` などで以下を設定してください（公開キーと非公開キーを分離）。
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 開発の進め方
1. `npm install` で依存を導入し、`npm run dev` で開発サーバーを起動します。
2. Supabase に `works` と `vote_events` テーブル、票数を集計するトリガーを用意してください。
3. 型やデータ構造を追加する場合は Zod スキーマ（`src/schemas/index.ts`）を更新し、API と UI 双方で整合性を確認します。
4. 新しい UI 要素は MUI コンポーネントを基本に構築し、`WorkCard` のパターンを参考にしてください。

## 次に学ぶとよいこと
- Next.js App Router のサーバーコンポーネントとクライアントコンポーネントの役割分担。
- Supabase JS クライアントの使い方と Row Level Security/トリガーの設計。
- MUI v7 のレイアウト・スタイリング（`Grid`, `Card`, `Stack` など）。
- Zod を使った入力検証と型推論の活用。
