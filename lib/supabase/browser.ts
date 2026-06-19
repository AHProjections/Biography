'use client';

import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserConfigError() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return 'Supabase is not configured for this deployment yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.';
  }

  try {
    new URL(supabaseUrl);
  } catch {
    return 'The Supabase URL in Vercel is not a valid URL. It should look like https://your-project-id.supabase.co.';
  }

  return null;
}

export function createClient() {
  const configError = getSupabaseBrowserConfigError();
  if (configError) {
    throw new Error(configError);
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
