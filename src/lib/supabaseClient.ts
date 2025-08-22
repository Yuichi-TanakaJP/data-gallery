import { createClient } from '@supabase/supabase-js';

// ブラウザ用：公開キー（NEXT_PUBLIC_）で作成
export const supabaseBrowser = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

// サーバ用：service_role（クライアントで使わない）
export const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ←公開禁止
    { auth: { persistSession: false } }
  );
