-- data-gallery: Supabase スキーマ（復元用）
--
-- このファイルは、Supabase プロジェクトを削除しても作品ギャラリー＋投票機能を
-- 作り直せるように、DB スキーマをコードとして残すもの。
--
-- 出典:
--   - アプリ実装（src/schemas/index.ts, src/app/page.tsx, src/app/api/vote/route.ts,
--     src/lib/supabaseServer.ts, src/lib/supabaseClient.ts）
--   - 旧プロジェクトの pg_dump に含まれていた public.inc_votes_count() 関数
-- 注意:
--   テーブルの一部カラム（vote_events.id / fingerprint / created_at、id のデフォルト等）は
--   アプリの利用状況から再構成した推定を含む。元データを厳密に復元したい場合は、
--   Supabase ダッシュボードの "Download backups" で取得したバックアップを正とすること。
--
-- 使い方: 新しい Supabase プロジェクトの SQL Editor に貼り付けて実行する。

-- 作品テーブル。一覧は anon キーで votes_count 降順に読み出す。
create table if not exists public.works (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  votes_count integer     not null default 0,
  tags        text[]
);

-- 投票イベント。1 投票 = 1 行 INSERT。トリガで works.votes_count を +1 する。
-- 書き込みはサーバー側の service_role キーで行う（src/app/api/vote/route.ts）。
create table if not exists public.vote_events (
  id          uuid        primary key default gen_random_uuid(),
  work_id     uuid        not null references public.works (id) on delete cascade,
  fingerprint text,
  created_at  timestamptz not null default now()
);

-- works.votes_count を集計するトリガ関数（pg_dump からの実体）。
create or replace function public.inc_votes_count() returns trigger
  language plpgsql
  as $$
begin
  update public.works set votes_count = votes_count + 1 where id = new.work_id;
  return new;
end $$;

drop trigger if exists trg_inc_votes_count on public.vote_events;
create trigger trg_inc_votes_count
  after insert on public.vote_events
  for each row execute function public.inc_votes_count();

-- RLS（アプリ挙動からの再構成）
-- - works: 一覧表示のため anon の SELECT を許可
-- - vote_events: 書き込みは service_role（RLS バイパス）で行うため、匿名ポリシーは置かない
alter table public.works enable row level security;
drop policy if exists "works public read" on public.works;
create policy "works public read"
  on public.works for select
  using (true);

alter table public.vote_events enable row level security;
