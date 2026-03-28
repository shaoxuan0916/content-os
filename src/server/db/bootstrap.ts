import { getSupabaseAdmin } from "@/server/db/client";
import { SOURCE_SEEDS } from "@/server/ingestion/defaults";

let bootstrapped = false;

export async function ensureSeedData() {
  if (bootstrapped) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error: sourceError } = await supabase.from("sources").upsert(SOURCE_SEEDS, { onConflict: "name" });

  if (sourceError) {
    throw new Error(`Failed to seed sources: ${sourceError.message}`);
  }

  bootstrapped = true;
}
