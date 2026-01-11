import "server-only";
import { createClient } from "@supabase/supabase-js";

function ensureEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// 読み取り用（RLS前提なら anon でOKだが、serverから使いたい時に）
export function supabaseServerPublic() {
  const url = ensureEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = ensureEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anon, { auth: { persistSession: false } });
}

// 書き込み/管理用（絶対にクライアントに出さない）
export function supabaseServerAdmin() {
  const url = ensureEnv("NEXT_PUBLIC_SUPABASE_URL");
  const service = ensureEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, service, { auth: { persistSession: false } });
}
