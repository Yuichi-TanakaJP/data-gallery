# 2026-01-11 開発ログ（data-gallery）

## 今日やったこと（要約）

- codex を使って改善を試した結果、PR が複数積み上がり、どれが何をしているか把握できていなかった状態を整理した
- PR の差分を一つずつ確認し、実際に意味のある変更を理解しながら取り込んだ
- その流れで Git / PR / ブランチの状態を整理し、main を最新状態に揃えた
- 以前から放置していた Vercel の実行時エラーに向き合い、Supabase を含めて復旧した

---

## 背景

- codex を使ってコード改善を試みていたが、PR が増える一方で中身をきちんと読めていなかった
- Vercel 上でエラーが出ている状態が続いており、気にはなっていたが後回しにしていた
- 今日あらためて「中身を理解する」前提で整理することにした

---

## 実際にやったこと（時系列）

### 1. ブランチ / PR 状態の確認

- GitHub と Vercel を見て、以下のブランチが存在していることを確認
  - codex 系
  - vercel 系
  - debug 系
- どの PR が何を目的に作られたかを整理するところから開始

### 2. PR の差分を読む

- onboarding / layout / CSS など、動作に影響しそうな箇所をファイル単位で確認
- 「これは関係ある」「これは見た目だけ」と切り分けながら把握

### 3. Vercel のエラーをログから確認

- build は成功しているが、実行時に以下のエラーが出ていることを確認
  - `Failed to load works from Supabase`
  - `TypeError: fetch failed`
- build と runtime を分けて考える必要があると判断

### 4. デバッグコードを入れて切り分け

- Supabase の env が存在しているかをログで確認
- `export const dynamic = "force-dynamic"` は既に設定済みであることを再確認

### 5. Git 操作とブランチ整理

- debug ブランチを作成して検証
- 一時的に detached HEAD に入ったが、`git switch -` で復帰
- `main` は `git reset --hard origin/main` で最新に同期

### 6. コンフリクト解消とローカル検証

- `git fetch && git merge origin/main` で衝突を解消
- `npm ci` → `npm run build` でローカルビルド成功

### 7. Supabase 側の問題に気づく

- Supabase プロジェクトが 90 日以上経過し pause されていた
- 新規プロジェクトを作成し、テーブルを最低限で復旧
- Vercel の環境変数を差し替え

### 8. API Key 問題の解決

- 投票 API が `Invalid API key` で失敗
- `SUPABASE_SERVICE_ROLE_KEY` が古いことに気づき、更新して解決

### 9. 構造整理

- client / server で Supabase client を分離
- server-only な client を API Route 専用に
- デバッグ用ログを削除

### 10. ブランチ掃除

- `git remote prune origin` を実行
- 不要な codex / vercel / debug ブランチを削除

---

## 今日の気づき・学び

- codex や Vercel も **ブランチを切って PR を作っている**
- 意識していなかったが、「自分 + ツール」で **共同開発に近い形**になっていた
- PR が増えると、差分を読まない限り何が起きているか分からなくなる
- build 成功と runtime 正常動作は別物
- 外部サービス（Supabase）が止まっている可能性も最初から考慮すべき

---

## 次回の自分へのメモ

- Vercel の runtime ログを必ず確認する
- API Route では server-only client 以外を使わない
- PR は「何を確認するためのものか」を意識して作る
