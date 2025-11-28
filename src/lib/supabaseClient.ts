import { createClient } from '@supabase/supabase-js';

const ensureEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required to initialize Supabase.`);
  }
  return value;
};

// ブラウザ用：公開キー（NEXT_PUBLIC_）で作成
export const supabaseBrowser = () => {
  const supabaseUrl = ensureEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = ensureEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return createClient(supabaseUrl, supabaseAnonKey);
};

// サーバ用：service_role（クライアントで使わない）
export const supabaseServer = () => {
  const supabaseUrl = ensureEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseServiceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
};
