import { getSupabaseAdmin } from "@/server/db/client";
import { SOURCE_SEEDS, TEMPLATE_SEEDS } from "@/server/ingestion/defaults";

let bootstrapped = false;

export async function ensureSeedData() {
  if (bootstrapped) {
    return;
  }

  const supabase = getSupabaseAdmin();

  const [{ error: sourceError }, { error: templateError }] = await Promise.all([
    supabase.from("sources").upsert(SOURCE_SEEDS, { onConflict: "name" }),
    supabase.from("prompt_templates").upsert(TEMPLATE_SEEDS, { onConflict: "key" })
  ]);

  if (sourceError) {
    throw new Error(`Failed to seed sources: ${sourceError.message}`);
  }

  if (templateError) {
    throw new Error(`Failed to seed prompt templates: ${templateError.message}`);
  }

  bootstrapped = true;
}
