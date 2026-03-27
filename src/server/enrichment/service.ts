import { getSupabaseAdmin } from "@/server/db/client";
import type { ArticleRow, SourceRow, TopicRow } from "@/server/db/types";
import { enrichmentSchema } from "@/server/enrichment/schemas";
import { recomputeTopicScore } from "@/server/scoring/service";
import { runStructuredCompletion } from "@/server/utils/ai";

async function readTopicBundle(topicId: string) {
  const supabase = getSupabaseAdmin();
  const { data: topic, error: topicError } = await supabase.from("topics").select("*").eq("id", topicId).single();

  if (topicError || !topic) {
    throw new Error(topicError?.message ?? "Topic not found");
  }

  const { data: links, error: linkError } = await supabase
    .from("topic_articles")
    .select("article_id, similarity")
    .eq("topic_id", topicId)
    .order("similarity", { ascending: false });

  if (linkError) {
    throw new Error(linkError.message);
  }

  const articleIds = (links ?? []).map((entry) => entry.article_id as string);
  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .in("id", articleIds)
    .order("published_at", { ascending: false });

  if (articleError) {
    throw new Error(articleError.message);
  }

  const sourceIds = [...new Set((articles ?? []).map((article) => article.source_id as string))];
  const { data: sources, error: sourceError } = await supabase
    .from("sources")
    .select("*")
    .in("id", sourceIds);

  if (sourceError) {
    throw new Error(sourceError.message);
  }

  return {
    topic: topic as TopicRow,
    articles: (articles ?? []) as ArticleRow[],
    sources: (sources ?? []) as SourceRow[]
  };
}

function fallbackEnrichment(bundle: { topic: TopicRow; articles: ArticleRow[]; sources: SourceRow[] }) {
  const primaryArticle = bundle.articles[0];

  return {
    headline: bundle.topic.headline || primaryArticle?.title || "Emerging AI story",
    shortSummary:
      primaryArticle?.excerpt ||
      "A fresh AI or tech development surfaced across multiple sources and needs manual review.",
    whyInteresting:
      "This story appears to have enough movement, source quality, or creator relevance to review in the dashboard.",
    keyPoints: bundle.articles.slice(0, 4).map((article) => article.title),
    timeline: bundle.articles
      .slice()
      .reverse()
      .slice(0, 4)
      .map((article) => `${article.published_at.slice(0, 10)} — ${article.title}`),
    tags: [bundle.topic.category ?? "AI", ...bundle.sources.slice(0, 2).map((source) => source.name)],
    category: bundle.topic.category ?? primaryArticle?.category ?? "AI news"
  };
}

export async function enrichTopics(options?: { topicId?: string; force?: boolean }) {
  const supabase = getSupabaseAdmin();
  const query = supabase.from("topics").select("*").order("latest_article_published_at", { ascending: false });
  const { data: topics, error: topicError } = options?.topicId
    ? await query.eq("id", options.topicId)
    : await query.or("short_summary.is.null,why_interesting.is.null");

  if (topicError || !topics) {
    throw new Error(topicError?.message ?? "Could not load topics");
  }

  let processed = 0;

  for (const topic of topics as TopicRow[]) {
    if (!options?.force && topic.short_summary && topic.why_interesting && !options?.topicId) {
      continue;
    }

    const bundle = await readTopicBundle(topic.id);
    const payload = await runStructuredCompletion({
      schema: enrichmentSchema,
      schemaName: "topic_enrichment",
      system: `You are enriching clustered AI / tech news topics for a single creator's internal content dashboard.

Return JSON only.

Requirements:
- headline: event-level, concrete, and clear
- shortSummary: 3-5 sentences
- whyInteresting: explain why creators and audience care right now
- keyPoints: concise factual bullets
- timeline: ordered sequence of what happened
- tags: short tags
- category: a clear topic bucket such as Models, Research, Chips, Apps, Policy, Open Source`,
      user: JSON.stringify(
        {
          currentHeadline: bundle.topic.headline,
          categoryHint: bundle.topic.category,
          articles: bundle.articles.map((article) => ({
            title: article.title,
            excerpt: article.excerpt,
            publishedAt: article.published_at,
            sourceId: article.source_id
          })),
          sources: bundle.sources.map((source) => ({
            name: source.name,
            tier: source.tier,
            type: source.source_type
          }))
        },
        null,
        2
      ),
      fallback: () => fallbackEnrichment(bundle)
    });

    const { error: updateError } = await supabase
      .from("topics")
      .update({
        headline: payload.headline,
        short_summary: payload.shortSummary,
        why_interesting: payload.whyInteresting,
        key_points: payload.keyPoints,
        timeline: payload.timeline,
        tags: payload.tags,
        category: payload.category
      })
      .eq("id", topic.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await recomputeTopicScore(topic.id);
    processed += 1;
  }

  return { processed };
}
