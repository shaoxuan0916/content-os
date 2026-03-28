import { getSupabaseAdmin } from "@/server/db/client";
import type {
  ArticleListItem,
  ArticleRow,
  DashboardSnapshot,
  FeedbackAction,
  IngestionRunRow,
  SourceRow
} from "@/server/db/types";

function isMissingReviewActionColumn(error: { message: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  return error.code === "42703" || /review_action/i.test(error.message);
}

export async function listArticleSources() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, source_type, tier")
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Pick<SourceRow, "id" | "name" | "source_type" | "tier">[];
}

export async function listArticles(filters?: {
  sourceId?: string;
  feedback?: FeedbackAction | "unreviewed" | "all";
}) {
  const supabase = getSupabaseAdmin();

  let query = supabase.from("articles").select("*").order("published_at", { ascending: false }).limit(200);

  if (filters?.sourceId) {
    query = query.eq("source_id", filters.sourceId);
  }

  if (filters?.feedback === "unreviewed") {
    query = query.is("review_action", null);
  } else if (filters?.feedback && filters.feedback !== "all") {
    query = query.eq("review_action", filters.feedback);
  }

  let { data: articles, error } = await query;

  if (isMissingReviewActionColumn(error)) {
    if (filters?.feedback && filters.feedback !== "all" && filters.feedback !== "unreviewed") {
      return [];
    }

    const fallback = await supabase.from("articles").select("*").order("published_at", { ascending: false }).limit(200);
    articles = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const articleRows = (articles ?? []) as ArticleRow[];
  const sourceIds = [...new Set(articleRows.map((article) => article.source_id))];
  const { data: sources, error: sourceError } = sourceIds.length
    ? await supabase.from("sources").select("id, name, source_type, tier").in("id", sourceIds)
    : await supabase.from("sources").select("id, name, source_type, tier").limit(0);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const sourceMap = new Map(
    ((sources ?? []) as Pick<SourceRow, "id" | "name" | "source_type" | "tier">[]).map((source) => [source.id, source])
  );

  return articleRows
    .map((article) => {
      const source = sourceMap.get(article.source_id);

      if (!source) {
        return null;
      }

      return {
        ...article,
        source
      } satisfies ArticleListItem;
    })
    .filter(Boolean) as ArticleListItem[];
}

export async function listRuns(): Promise<IngestionRunRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ingestion_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as IngestionRunRow[];
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabase = getSupabaseAdmin();
  const { count: articleCount, error: articleError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true });

  if (articleError) {
    throw new Error(articleError.message);
  }

  const [
    { count: favoriteCount, error: favoriteError },
    { count: usedCount, error: usedError },
    { count: ignoredCount, error: ignoredError }
  ] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("review_action", "favorite"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("review_action", "used"),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("review_action", "ignored")
  ]);

  if (isMissingReviewActionColumn(favoriteError) || isMissingReviewActionColumn(usedError) || isMissingReviewActionColumn(ignoredError)) {
    return {
      articleCount: articleCount ?? 0,
      favoriteCount: 0,
      usedCount: 0,
      ignoredCount: 0
    };
  }

  for (const error of [favoriteError, usedError, ignoredError]) {
    if (error) {
      throw new Error(error.message);
    }
  }

  return {
    articleCount: articleCount ?? 0,
    favoriteCount: favoriteCount ?? 0,
    usedCount: usedCount ?? 0,
    ignoredCount: ignoredCount ?? 0
  };
}

export async function setArticleReview(articleId: string, action: FeedbackAction) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("articles").update({ review_action: action }).eq("id", articleId);

  if (error) {
    if (isMissingReviewActionColumn(error)) {
      throw new Error("Database migration is required before article review actions can be saved.");
    }

    throw new Error(error.message);
  }

  return { articleId, action };
}

export async function bulkSetArticleReview(articleIds: string[], action: FeedbackAction) {
  if (articleIds.length === 0) {
    return { updated: 0 };
  }

  const supabase = getSupabaseAdmin();
  const dedupedIds = [...new Set(articleIds)];
  const { error } = await supabase.from("articles").update({ review_action: action }).in("id", dedupedIds);

  if (error) {
    if (isMissingReviewActionColumn(error)) {
      throw new Error("Database migration is required before article review actions can be saved.");
    }

    throw new Error(error.message);
  }

  return { updated: dedupedIds.length };
}
