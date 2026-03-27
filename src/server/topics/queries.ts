import { getSupabaseAdmin } from "@/server/db/client";
import type {
  ArticleRow,
  FeedbackAction,
  IngestionRunRow,
  PromptPackageRow,
  PromptTemplateRow,
  SourceRow,
  TopicDetail,
  TopicFeedbackRow,
  TopicListItem,
  TopicRow
} from "@/server/db/types";

async function getTopicArticles(topicIds: string[]) {
  const supabase = getSupabaseAdmin();
  const { data: topicLinks, error: linkError } = await supabase
    .from("topic_articles")
    .select("topic_id, article_id, similarity, is_primary, is_weak_match")
    .in("topic_id", topicIds);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const articleIds = [...new Set((topicLinks ?? []).map((row) => row.article_id as string))];
  const { data: articles, error: articleError } = articleIds.length
    ? await supabase.from("articles").select("*").in("id", articleIds)
    : await supabase.from("articles").select("*").in("id", ["00000000-0000-0000-0000-000000000000"]);

  if (articleError) {
    throw new Error(articleError.message);
  }

  const sourceIds = [...new Set((articles ?? []).map((article) => article.source_id as string))];
  const { data: sources, error: sourceError } = sourceIds.length
    ? await supabase.from("sources").select("*").in("id", sourceIds)
    : await supabase.from("sources").select("*").in("id", ["00000000-0000-0000-0000-000000000000"]);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  const articleMap = new Map((articles ?? []).map((article) => [article.id as string, article as ArticleRow]));
  const sourceMap = new Map((sources ?? []).map((source) => [source.id as string, source as SourceRow]));

  return {
    topicLinks: topicLinks ?? [],
    articleMap,
    sourceMap
  };
}

async function getTopicFeedbackMap(topicIds: string[]) {
  if (topicIds.length === 0) {
    return new Map<string, FeedbackAction>();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("topic_feedback")
    .select("topic_id, action, created_at")
    .in("topic_id", topicIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const feedbackMap = new Map<string, FeedbackAction>();

  for (const row of (data ?? []) as TopicFeedbackRow[]) {
    if (!feedbackMap.has(row.topic_id)) {
      feedbackMap.set(row.topic_id, row.action);
    }
  }

  return feedbackMap;
}

function composeTopicListItem(
  topic: TopicRow,
  rows: Awaited<ReturnType<typeof getTopicArticles>>,
  feedbackMap: Map<string, FeedbackAction>
): TopicListItem {
  const articles = rows.topicLinks
    .filter((link) => link.topic_id === topic.id)
    .map((link) => rows.articleMap.get(link.article_id as string))
    .filter(Boolean) as ArticleRow[];

  const sources = [...new Set(articles.map((article) => article.source_id))]
    .map((sourceId) => rows.sourceMap.get(sourceId))
    .filter(Boolean) as SourceRow[];

  return {
    ...topic,
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      canonical_url: article.canonical_url,
      published_at: article.published_at
    })),
    sources: sources.map((source) => ({
      id: source.id,
      name: source.name,
      tier: source.tier
    })),
    feedback_action: feedbackMap.get(topic.id) ?? null
  };
}

export async function listTopicCategories() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("topics").select("category").not("category", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  return [...new Set((data ?? []).map((row) => row.category).filter(Boolean) as string[])].sort((left, right) =>
    left.localeCompare(right)
  );
}

export async function listTopics(filters?: {
  category?: string;
  feedback?: FeedbackAction | "unreviewed";
}) {
  const supabase = getSupabaseAdmin();
  let topicIds: string[] | null = null;

  if (filters?.feedback) {
    if (filters.feedback === "unreviewed") {
      const { data: reviewedRows, error: reviewedError } = await supabase.from("topic_feedback").select("topic_id");

      if (reviewedError) {
        throw new Error(reviewedError.message);
      }

      const reviewedIds = [...new Set((reviewedRows ?? []).map((row) => row.topic_id as string).filter(Boolean))];
      topicIds = reviewedIds;
    } else {
      const { data: feedbackRows, error: feedbackError } = await supabase
        .from("topic_feedback")
        .select("topic_id")
        .eq("action", filters.feedback);

      if (feedbackError) {
        throw new Error(feedbackError.message);
      }

      topicIds = [...new Set((feedbackRows ?? []).map((row) => row.topic_id as string).filter(Boolean))];

      if (topicIds.length === 0) {
        return [];
      }
    }
  }

  let query = supabase.from("topics").select("*").order("final_score", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  if (filters?.feedback === "unreviewed" && topicIds && topicIds.length > 0) {
    const escapedIds = topicIds.map((id) => `"${id}"`).join(",");
    query = query.not("id", "in", `(${escapedIds})`);
  } else if (filters?.feedback && filters.feedback !== "unreviewed" && topicIds) {
    query = query.in("id", topicIds);
  }

  const { data: topics, error } = await query;

  if (error || !topics) {
    throw new Error(error?.message ?? "Could not read topics");
  }

  const topicRows = topics as TopicRow[];
  const feedbackMap = await getTopicFeedbackMap(topicRows.map((topic) => topic.id));
  const rows = await getTopicArticles(topicRows.map((topic) => topic.id));
  return topicRows.map((topic) => composeTopicListItem(topic, rows, feedbackMap));
}

export async function getTopicDetail(topicId: string): Promise<TopicDetail | null> {
  const supabase = getSupabaseAdmin();
  const { data: topic, error } = await supabase.from("topics").select("*").eq("id", topicId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(error.message);
  }

  const rows = await getTopicArticles([topicId]);
  const feedbackMap = await getTopicFeedbackMap([topicId]);
  const base = composeTopicListItem(topic as TopicRow, rows, feedbackMap);

  const { data: promptPackages, error: packageError } = await supabase
    .from("prompt_packages")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false });

  if (packageError) {
    throw new Error(packageError.message);
  }

  const templateIds = [...new Set((promptPackages ?? []).map((entry) => entry.template_id as string))];
  const { data: templates, error: templateError } = await supabase
    .from("prompt_templates")
    .select("*")
    .in("id", templateIds.length > 0 ? templateIds : ["00000000-0000-0000-0000-000000000000"]);

  if (templateError) {
    throw new Error(templateError.message);
  }

  const templateMap = new Map((templates ?? []).map((entry) => [entry.id as string, entry as PromptTemplateRow]));

  return {
    ...base,
    prompt_packages: (promptPackages ?? []).map((entry) => ({
      ...(entry as PromptPackageRow),
      template: (() => {
        const template = templateMap.get(entry.template_id as string);
        return {
          id: template?.id ?? "",
          key: template?.key ?? "",
          name: template?.name ?? ""
        };
      })()
    }))
  };
}

export async function listPromptTemplates() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("prompt_templates").select("*").order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PromptTemplateRow[];
}

export async function savePromptTemplate(input: {
  id?: string;
  key: string;
  name: string;
  system_prompt: string;
  instruction_prompt: string;
}) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prompt_templates")
    .upsert(input, { onConflict: "key" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save prompt template");
  }

  return data as PromptTemplateRow;
}

export async function listPromptPackages(): Promise<
  (PromptPackageRow & {
    topic: { id: string; headline: string } | null;
    template: { id: string; key: string; name: string } | null;
  })[]
> {
  const supabase = getSupabaseAdmin();
  const { data: packages, error } = await supabase
    .from("prompt_packages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const topicIds = [...new Set((packages ?? []).map((entry) => entry.topic_id as string))];
  const templateIds = [...new Set((packages ?? []).map((entry) => entry.template_id as string))];
  const [{ data: topics }, { data: templates }] = await Promise.all([
    supabase.from("topics").select("id, headline").in("id", topicIds.length ? topicIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("prompt_templates")
      .select("id, key, name")
      .in("id", templateIds.length ? templateIds : ["00000000-0000-0000-0000-000000000000"])
  ]);

  const topicMap = new Map((topics ?? []).map((entry) => [entry.id as string, entry]));
  const templateMap = new Map((templates ?? []).map((entry) => [entry.id as string, entry]));

  return (packages ?? []).map((entry) => ({
    ...(entry as PromptPackageRow),
    topic: topicMap.get(entry.topic_id as string) ?? null,
    template: templateMap.get(entry.template_id as string) ?? null
  }));
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

export async function setTopicFeedback(topicId: string, action: FeedbackAction) {
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from("topic_feedback").delete().eq("topic_id", topicId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error } = await supabase.from("topic_feedback").insert({ topic_id: topicId, action });

  if (error) {
    throw new Error(error.message);
  }

  return { topicId, action };
}

export async function bulkSetTopicFeedback(topicIds: string[], action: FeedbackAction) {
  if (topicIds.length === 0) {
    return { updated: 0 };
  }

  const dedupedIds = [...new Set(topicIds)];
  const supabase = getSupabaseAdmin();
  const { error: deleteError } = await supabase.from("topic_feedback").delete().in("topic_id", dedupedIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error } = await supabase.from("topic_feedback").insert(
    dedupedIds.map((topicId) => ({
      topic_id: topicId,
      action
    }))
  );

  if (error) {
    throw new Error(error.message);
  }

  return { updated: dedupedIds.length };
}
