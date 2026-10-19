# Data Gallery

作品一覧を票数順に表示し、投票できるシンプルなギャラリーアプリです。Next.js 15 (App Router) + MUI v7 で構築し、SupabaseとローカルSQLiteを切り替えて学べます。

## アプリ概要

- トップページでは Supabase から作品一覧を取得し、票数順にカード表示します。
- 各作品カードから投票でき、投票は `/api/vote` の Route Handler 経由で Supabase に記録されます（Supabase 側のトリガーで票数を集計）。
- 閲覧には Supabase の公開キー、投票 API では service_role キーを使い分けています。

## 技術スタック

- [Next.js](https://nextjs.org) 15 (App Router, Turbopack)
- React 19
- [MUI](https://mui.com/) v7 (`@mui/material`, `@mui/icons-material`, `@mui/system`)
- [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- [Zod](https://zod.dev/) による入力/レスポンスのスキーマ定義
- TypeScript, ESLint, Tailwind CSS (PostCSS)

## ローカルSQLiteでの学習用起動

Node.js 22.13以降を使用します（Node内蔵SQLiteは実験的API）。追加のDBサービスやDockerは不要です。
`.env.local` に `GALLERY_DATABASE=sqlite` と `GALLERY_SQLITE_PATH`（作業用DBの絶対パス）を設定します。
Supabase接続は `GALLERY_DATABASE=supabase` で従来どおり利用できます。

復旧済みSQLiteから別ファイルを作る例（既存の出力は上書きしません）：

```powershell
python scripts/init-local-db.py --source C:/backup/data-gallery-recovered.sqlite3 --target C:/local-data/gallery.sqlite
npm run dev -- --hostname 127.0.0.1 --port 3002
```

作品一覧と投票は選択したDBだけを使用します。SQLiteでは投票履歴の追加と票数更新を同一トランザクションで処理します。
原本を直接指定せず、初期化した作業コピーを使ってください。DB未作成時はエラーになり、空DBを自動生成しません。
公開運用・新しいデータの完全復旧とは別の、PC内での学習用構成です。ポートを外部公開しないでください。

検証：`node --test tests/sqlite-store.test.mjs`、`npx tsc --noEmit`、`npm run lint`、`npm run build`。

## セットアップ

```bash
npm install
```

`.env.local` などに以下の環境変数を設定してください（値は各自の Supabase プロジェクトのものを使用し、リポジトリにはコミットしないでください）。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase 側には `works` テーブル、`vote_events` テーブル、および票数を集計するトリガーが必要です。詳細は [docs/ONBOARDING.md](./docs/ONBOARDING.md) を参照してください。

## 開発コマンド

```bash
npm run dev    # 開発サーバー起動 (Turbopack)
npm run build  # 本番ビルド (Turbopack)
npm run start  # ビルド済みアプリの起動
npm run lint   # ESLint
```

開発サーバー起動後は [http://localhost:3000](http://localhost:3000) で確認できます。

## ドキュメント

- [docs/ONBOARDING.md](./docs/ONBOARDING.md): アプリの全体像、主要コンポーネント、開発の進め方
- [docs/decisions/](./docs/decisions/): 技術的な意思決定の記録
- [docs/dev-logs/](./docs/dev-logs/): 開発中に発生した問題の調査ログ
