import { getSupabaseAdmin } from "@/server/db/client";
import type { ArticleRow, MatchTopicRow, TopicRow } from "@/server/db/types";
import { buildEmbeddingText, embedText } from "@/server/embeddings/service";
import { MERGE_THRESHOLD, RELATED_MATCH, STRICT_MATCH } from "@/server/topics/constants";
import { isWithinDays } from "@/server/utils/dates";
import { keywordOverlap } from "@/server/utils/text";
import { averageVectors, cosineSimilarity, parseVector, toPgVector } from "@/server/utils/vector";

async function refreshTopicState(topicId: string) {
  const supabase = getSupabaseAdmin();
  const { data: topicArticles, error: linkError } = await supabase
    .from("topic_articles")
    .select("article_id, similarity")
    .eq("topic_id", topicId);

  if (linkError || !topicArticles || topicArticles.length === 0) {
    throw new Error(linkError?.message ?? "Topic has no article links");
  }

  const articleIds = topicArticles.map((entry) => entry.article_id);
  const { data: articleRows, error: articleError } = await supabase
    .from("articles")
    .select("id, title, published_at, embedding")
    .in("id", articleIds);

  if (articleError || !articleRows || articleRows.length === 0) {
    throw new Error(articleError?.message ?? "Could not read topic articles");
  }

  const centroid = averageVectors(articleRows.map((article) => parseVector(article.embedding)).filter((value) => value.length > 0));
  const representative =
    topicArticles
      .map((entry) => ({
        similarity: Number(entry.similarity),
        article: articleRows.find((article) => article.id === entry.article_id)
      }))
      .filter((entry) => Boolean(entry.article))
      .sort((left, right) => right.similarity - left.similarity)[0]?.article ?? articleRows[0];

  const latestPublishedAt = articleRows
    .map((article) => article.published_at)
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

  const { error: updateError } = await supabase
    .from("topics")
    .update({
      headline: representative.title,
      representative_article_id: representative.id,
      latest_article_published_at: latestPublishedAt,
      article_count: articleRows.length,
      centroid_embedding: centroid.length > 0 ? toPgVector(centroid) : null
    })
    .eq("id", topicId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function createTopic(article: ArticleRow) {
  const supabase = getSupabaseAdmin();
  const vector = parseVector(article.embedding);
  const { data, error } = await supabase
    .from("topics")
    .insert({
      headline: article.title,
      category: article.category,
      representative_article_id: article.id,
      latest_article_published_at: article.published_at,
      article_count: 1,
      centroid_embedding: vector.length > 0 ? toPgVector(vector) : null
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create topic");
  }

  await supabase.from("topic_articles").insert({
    topic_id: data.id,
    article_id: article.id,
    similarity: 1,
    is_primary: true,
    is_weak_match: false
  });

  return data as TopicRow;
}

async function assignArticleToTopic(article: ArticleRow, topicId: string, similarity: number, weak: boolean) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from("topic_articles").upsert(
    {
      topic_id: topicId,
      article_id: article.id,
      similarity,
      is_primary: false,
      is_weak_match: weak
    },
    {
      onConflict: "topic_id,article_id"
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  await refreshTopicState(topicId);
}

async function mergeTopics() {
  const supabase = getSupabaseAdmin();
  const { data: topics, error } = await supabase
    .from("topics")
    .select("*")
    .order("article_count", { ascending: false });

  if (error || !topics) {
    throw new Error(error?.message ?? "Could not read topics for merge");
  }

  const handled = new Set<string>();

  for (let i = 0; i < topics.length; i += 1) {
    const left = topics[i] as TopicRow;
    if (handled.has(left.id) || !left.centroid_embedding) {
      continue;
    }

    for (let j = i + 1; j < topics.length; j += 1) {
      const right = topics[j] as TopicRow;

      if (
        handled.has(right.id) ||
        !right.centroid_embedding ||
        left.category !== right.category ||
        !left.latest_article_published_at ||
        !right.latest_article_published_at
      ) {
        continue;
      }

      if (!isWithinDays(left.latest_article_published_at, right.latest_article_published_at, 5)) {
        continue;
      }

      if (keywordOverlap(left.headline, right.headline) === 0) {
        continue;
      }

      const similarity = cosineSimilarity(parseVector(left.centroid_embedding), parseVector(right.centroid_embedding));

      if (similarity < MERGE_THRESHOLD) {
        continue;
      }

      const target = left.article_count >= right.article_count ? left : right;
      const source = target.id === left.id ? right : left;

      const { data: links, error: linkError } = await supabase
        .from("topic_articles")
        .select("*")
        .eq("topic_id", source.id);

      if (linkError) {
        throw new Error(linkError.message);
      }

      if (links && links.length > 0) {
        await supabase.from("topic_articles").upsert(
          links.map((link) => ({
            topic_id: target.id,
            article_id: link.article_id,
            similarity: link.similarity,
            is_primary: false,
            is_weak_match: link.is_weak_match
          })),
          { onConflict: "topic_id,article_id" }
        );
      }

      await supabase.from("topic_articles").delete().eq("topic_id", source.id);
      await supabase.from("topic_feedback").delete().eq("topic_id", source.id);
      await supabase.from("prompt_packages").delete().eq("topic_id", source.id);
      await supabase.from("topics").delete().eq("id", source.id);
      await refreshTopicState(target.id);

      handled.add(source.id);
    }
  }
}

export async function processTopics(options?: { reset?: boolean }) {
  const supabase = getSupabaseAdmin();

  if (options?.reset) {
    await supabase.from("prompt_packages").delete().neq("id", "");
    await supabase.from("topic_feedback").delete().neq("topic_id", "");
    await supabase.from("topic_articles").delete().neq("topic_id", "");
    await supabase.from("topics").delete().neq("id", "");
  }

  const [{ data: articles, error: articleError }, { data: links, error: linkError }] = await Promise.all([
    supabase
      .from("articles")
      .select("*")
      .eq("is_duplicate", false)
      .order("published_at", { ascending: true }),
    supabase.from("topic_articles").select("article_id")
  ]);

  if (articleError || !articles) {
    throw new Error(articleError?.message ?? "Could not read articles");
  }

  if (linkError) {
    throw new Error(linkError.message);
  }

  const assignedArticleIds = new Set((links ?? []).map((entry) => entry.article_id as string));
  let processed = 0;

  for (const article of articles as ArticleRow[]) {
    if (assignedArticleIds.has(article.id) && !options?.reset) {
      continue;
    }

    let embedding = parseVector(article.embedding);

    if (embedding.length === 0) {
      embedding = await embedText(buildEmbeddingText(article));
      await supabase
        .from("articles")
        .update({ embedding: toPgVector(embedding) })
        .eq("id", article.id);
    }

    const { data: matches, error: matchError } = await supabase.rpc("match_topics", {
      query_embedding: toPgVector(embedding),
      match_count: 5
    });

    if (matchError) {
      throw new Error(matchError.message);
    }

    const bestMatch = ((matches ?? []) as MatchTopicRow[])
      .map((row: MatchTopicRow) => ({
        topicId: row.topic_id as string,
        similarity: Number(row.similarity),
        category: row.category as string | null,
        latestArticlePublishedAt: row.latest_article_published_at as string | null,
        headline: row.headline as string
      }))
      .find((candidate: {
        topicId: string;
        similarity: number;
        category: string | null;
        latestArticlePublishedAt: string | null;
        headline: string;
      }) => {
        if (candidate.similarity >= STRICT_MATCH) {
          return true;
        }

        if (candidate.similarity < RELATED_MATCH) {
          return false;
        }

        if (candidate.category && article.category && candidate.category !== article.category) {
          return false;
        }

        if (candidate.latestArticlePublishedAt && !isWithinDays(candidate.latestArticlePublishedAt, article.published_at, 5)) {
          return false;
        }

        return keywordOverlap(candidate.headline, article.title) > 0;
      });

    if (!bestMatch) {
      await createTopic(article);
    } else {
      await assignArticleToTopic(
        article,
        bestMatch.topicId,
        bestMatch.similarity,
        bestMatch.similarity < STRICT_MATCH
      );
    }

    processed += 1;
  }

  await mergeTopics();

  return { processed };
}
