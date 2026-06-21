# Supabase（data-gallery）

このディレクトリは、data-gallery が使う Supabase プロジェクトを**作り直せるように**スキーマを残すためのもの。
旧プロジェクト（無料枠で 90 日以上 paused になり、ダッシュボードから復帰不可になったため削除予定）の代替。

## 中身

- [`schema.sql`](./schema.sql) … `works` / `vote_events` テーブル、`inc_votes_count()` トリガ、RLS

## 作り直す手順

1. 新しい Supabase プロジェクトを作成する。
2. SQL Editor で [`schema.sql`](./schema.sql) を実行する。
3. Project Settings → API から URL と各キーを取得し、`.env.local` に設定する。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用・非公開）
4. 必要なら作品データ（`works` の行）を投入する。

## 注意

- `schema.sql` はアプリ実装と旧 pg_dump から再構成したもので、一部カラムは推定を含む。
- 旧プロジェクトの**実データ**を厳密に残したい場合は、削除前に Supabase の "Download backups" で
  バックアップを取得しておくこと（このリポジトリにはスキーマのみ残す）。
