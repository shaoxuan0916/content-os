import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/server/config";
let client: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseAdmin() {
  if (!client) {
    const env = getEnv();
    client = createClient<any>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  }

  return client;
}
