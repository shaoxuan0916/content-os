import { getSupabaseAdmin } from "@/server/db/client";
import type { ArticleRow, MatchTopicRow, SourceRow, TopicRow } from "@/server/db/types";
import { llmScoreSchema } from "@/server/enrichment/schemas";
import { runStructuredCompletion } from "@/server/utils/ai";
import { isWithinDays } from "@/server/utils/dates";
import { parseVector, toPgVector } from "@/server/utils/vector";

function computeSourceQualityScore(sources: SourceRow[]) {
  let score = 0;

  if (sources.some((source) => source.tier === "A")) {
    score += 5;
  }

  if (sources.length >= 3) {
    score += 3;
  }

  if (sources.length >= 5) {
    score += 2;
  }

  return Math.min(10, score);
}

function computeDiscussionScore(sourceCount: number) {
  return Math.min(10, sourceCount * 2);
}

function finalScore(input: {
  novelty: number;
  story: number;
  relevance: number;
  sourceQuality: number;
  discussion: number;
}) {
  const weightedSum =
    input.novelty * 0.18 +
    input.story * 0.26 +
    input.relevance * 0.2 +
    input.sourceQuality * 0.16 +
    input.discussion * 0.08;

  return Number((weightedSum / 0.88).toFixed(2));
}

async function readTopicContext(topicId: string) {
  const supabase = getSupabaseAdmin();
  const { data: topic, error: topicError } = await supabase.from("topics").select("*").eq("id", topicId).single();

  if (topicError || !topic) {
    throw new Error(topicError?.message ?? "Topic not found");
  }

  const { data: links, error: linkError } = await supabase
    .from("topic_articles")
    .select("article_id")
    .eq("topic_id", topicId);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const articleIds = (links ?? []).map((entry) => entry.article_id as string);
  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("*")
    .in("id", articleIds);

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

async function noveltyPenalty(topic: TopicRow) {
  if (!topic.centroid_embedding) {
    return 0;
  }

  const supabase = getSupabaseAdmin();
  const { data: neighbors, error } = await supabase.rpc("match_topic_neighbors", {
    query_embedding: toPgVector(parseVector(topic.centroid_embedding)),
    excluded_topic_id: topic.id,
    match_count: 5
  });

  if (error) {
    throw new Error(error.message);
  }

  const recentNeighbor = ((neighbors ?? []) as MatchTopicRow[]).find((row: MatchTopicRow) => {
    const latest = row.latest_article_published_at as string | null;
    return latest ? isWithinDays(latest, topic.latest_article_published_at ?? new Date().toISOString(), 14) : false;
  });

  const similarity = recentNeighbor ? Number(recentNeighbor.similarity) : 0;

  if (similarity >= 0.9) return 3;
  if (similarity >= 0.84) return 2;
  if (similarity >= 0.78) return 1;
  return 0;
}

export async function recomputeTopicScore(topicId: string) {
  const { topic, articles, sources } = await readTopicContext(topicId);
  const headlines = articles.map((article) => article.title);

  const llmScores = await runStructuredCompletion({
    schema: llmScoreSchema,
    schemaName: "topic_scoring",
    system: `你是一个内容选题评估助手。

请根据以下信息，为一个科技事件打分：

评分维度：

1. novelty（新颖性）
- 是否是新事件
- 是否重复已有话题

2. story（可讲性）
- 是否有清晰过程
- 是否有钩子 / 反直觉

3. relevance（匹配度）
- 是否适合普通观众理解
- 是否属于 AI / 科技内容

每项 0-10 分。

只返回 JSON。`,
    user: JSON.stringify(
      {
        topicSummary: topic.short_summary,
        headlines,
        tags: topic.tags,
        sources: sources.map((source) => ({
          name: source.name,
          tier: source.tier
        }))
      },
      null,
      2
    ),
    fallback: () => ({
      novelty: 6,
      story: 6,
      relevance: 7,
      reasoning: "Fallback score used because structured scoring output failed validation."
    })
  });

  const novelty = Math.max(0, llmScores.novelty - (await noveltyPenalty(topic)));
  const story = llmScores.story;
  const relevance = llmScores.relevance;
  const sourceQuality = computeSourceQualityScore(sources);
  const discussion = computeDiscussionScore(sources.length);
  const score = finalScore({
    novelty,
    story,
    relevance,
    sourceQuality,
    discussion
  });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("topics")
    .update({
      novelty_score: novelty,
      story_score: story,
      relevance_score: relevance,
      freshness_score: 0,
      source_quality_score: sourceQuality,
      discussion_score: discussion,
      final_score: score,
      score_reasoning: llmScores.reasoning
    })
    .eq("id", topicId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    novelty,
    story,
    relevance,
    sourceQuality,
    discussion,
    finalScore: score
  };
}
