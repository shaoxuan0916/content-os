"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/shared";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, publishableKey } = getSupabasePublicConfig();
    client = createBrowserClient(url, publishableKey);
  }

  return client;
}
