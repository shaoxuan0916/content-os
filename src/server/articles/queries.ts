import { getSupabaseAdmin } from "@/server/db/client";
import type { ArticleRow, PublicArticleListItem, SourceRow } from "@/server/db/types";

const publicArticleLookbackDays = 30;

function isSourceSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function getPublicArticleCreatedAfter() {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - publicArticleLookbackDays);
  return cutoff.toISOString();
}

export async function listArticleSources() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, slug, source_type, tier")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Pick<SourceRow, "id" | "name" | "slug" | "source_type" | "tier">[];
}

export async function listPublicArticles(filters?: {
  sourceSlug?: string;
  offset?: number;
  limit?: number;
}): Promise<{ articles: PublicArticleListItem[]; hasMore: boolean }> {
  if (filters?.sourceSlug && !isSourceSlug(filters.sourceSlug)) {
    return { articles: [], hasMore: false };
  }

  const supabase = getSupabaseAdmin();
  const offset = Math.max(0, filters?.offset ?? 0);
  const limit = Math.min(50, Math.max(1, filters?.limit ?? 24));

  let query = supabase
    .from("articles")
    .select("id, source_id, title, canonical_url, excerpt, thumbnail_url, published_at")
    .gte("created_at", getPublicArticleCreatedAfter())
    .order("published_at", { ascending: false })
    .range(offset, offset + limit);

  if (filters?.sourceSlug) {
    const { data: source, error: sourceLookupError } = await supabase
      .from("sources")
      .select("id")
      .eq("slug", filters.sourceSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (sourceLookupError) {
      throw new Error(sourceLookupError.message);
    }

    if (!source) {
      return { articles: [], hasMore: false };
    }

    query = query.eq("source_id", source.id);
  }

  const { data: articles, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const articleRows = (articles ?? []).slice(0, limit) as Array<
    Pick<ArticleRow, "id" | "source_id" | "title" | "canonical_url" | "excerpt" | "thumbnail_url" | "published_at">
  >;
  const sourceIds = [...new Set(articleRows.map((article) => article.source_id))];
  const { data: sources, error: sourceError } = sourceIds.length
    ? await supabase.from("sources").select("id, name, slug, source_type, tier").in("id", sourceIds).eq("is_active", true)
    : await supabase.from("sources").select("id, name, slug, source_type, tier").limit(0);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const sourceMap = new Map(
    ((sources ?? []) as Pick<SourceRow, "id" | "name" | "slug" | "source_type" | "tier">[]).map((source) => [
      source.id,
      source
    ])
  );

  return {
    articles: articleRows
      .map((article) => {
        const source = sourceMap.get(article.source_id);

        if (!source) {
          return null;
        }

        return {
          ...article,
          source
        } satisfies PublicArticleListItem;
      })
      .filter(Boolean) as PublicArticleListItem[],
    hasMore: (articles ?? []).length > limit
  };
}
