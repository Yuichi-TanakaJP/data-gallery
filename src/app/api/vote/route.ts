import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { workId } = await req.json();
    if (!workId) return NextResponse.json({ error: 'workId required' }, { status: 400 });

    const supa = supabaseServer();

    // 票イベントを1件追加（トリガでworks.votes_countが+1される）
    const { error } = await supa.from('vote_events').insert({ work_id: workId });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // 最新の票数を返す
    const { data, error: e2 } = await supa
      .from('works').select('votes_count').eq('id', workId).single();
    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 });

    return NextResponse.json({ ok: true, votesCount: data?.votes_count ?? null });
    } catch (e: unknown) {
       const msg = e instanceof Error ? e.message : 'bad request';
    return NextResponse.json({ error: msg }, { status: 400 });
    }
}