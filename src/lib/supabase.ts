import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let cachedAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }

  cachedAdmin = createSupabaseClient(url, key, {
    auth: { persistSession: false },
  });
  return cachedAdmin;
}

export async function upsertUser(profile: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<string> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .upsert(
      {
        email: profile.email,
        name: profile.name ?? null,
        image: profile.image ?? null,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Failed to upsert user: " + (error?.message ?? "unknown"));
  }
  return data.id;
}
