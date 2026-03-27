import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import Parser from "rss-parser";
import { getSupabaseAdmin } from "@/server/db/client";
import { ensureSeedData } from "@/server/db/bootstrap";
import type { ArticleRow, SourceRow } from "@/server/db/types";
import { excerptText, normalizeUrl, stripHtml } from "@/server/utils/text";

const parser = new Parser();

interface FeedCandidate {
  title: string;
  canonical_url: string;
  excerpt: string;
  content_text: string;
  published_at: string;
  category: string | null;
}

function hashTitle(title: string) {
  return createHash("sha256").update(title.trim().toLowerCase()).digest("hex");
}

function inferCategory(source: SourceRow, raw: string | null) {
  if (raw) {
    return raw;
  }

  if (source.name.includes("Meta")) {
    return "Open models";
  }

  if (source.name.includes("DeepMind")) {
    return "Research";
  }

  if (source.name.includes("Anthropic") || source.name.includes("OpenAI")) {
    return "Models";
  }

  return "AI news";
}

function normalizeCandidate(source: SourceRow, item: FeedCandidate): FeedCandidate {
  const content = stripHtml(item.content_text || item.excerpt || item.title);
  const excerpt = excerptText(stripHtml(item.excerpt || content || item.title), 280);

  return {
    title: item.title.trim(),
    canonical_url: normalizeUrl(item.canonical_url),
    excerpt,
    content_text: content,
    published_at: new Date(item.published_at).toISOString(),
    category: inferCategory(source, item.category)
  };
}

function readJsonLdArticles(html: string) {
  const $ = cheerio.load(html);
  const items: FeedCandidate[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).text();
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const queue = Array.isArray(parsed) ? parsed : [parsed];

      for (const entry of queue) {
        walkJsonLd(entry, items);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return items;
}

function walkJsonLd(value: unknown, items: FeedCandidate[]) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => walkJsonLd(entry, items));
    return;
  }

  const record = value as Record<string, unknown>;
  const typeValue = record["@type"];
  const typeList = Array.isArray(typeValue) ? typeValue : [typeValue];
  const isArticle = typeList.some((item) =>
    ["Article", "NewsArticle", "BlogPosting"].includes(String(item))
  );

  if (isArticle && typeof record.headline === "string" && typeof record.url === "string") {
    items.push({
      title: record.headline,
      canonical_url: record.url,
      excerpt:
        typeof record.description === "string"
          ? record.description
          : typeof record.alternativeHeadline === "string"
            ? record.alternativeHeadline
            : record.headline,
      content_text:
        typeof record.articleBody === "string"
          ? record.articleBody
          : typeof record.description === "string"
            ? record.description
            : record.headline,
      published_at:
        typeof record.datePublished === "string" ? record.datePublished : new Date().toISOString(),
      category: typeof record.articleSection === "string" ? record.articleSection : null
    });
  }

  for (const child of Object.values(record)) {
    walkJsonLd(child, items);
  }
}

function fallbackExtractLinks(source: SourceRow, html: string) {
  const $ = cheerio.load(html);
  const items: FeedCandidate[] = [];
  const seen = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const title = $(element).text().trim();

    if (!href || title.length < 12) {
      return;
    }

    const url = href.startsWith("http") ? href : new URL(href, source.rss_url).toString();

    if (seen.has(url)) {
      return;
    }

    if (!url.includes("/blog/") && !url.includes("/news/")) {
      return;
    }

    seen.add(url);
    items.push({
      title,
      canonical_url: url,
      excerpt: title,
      content_text: title,
      published_at: new Date().toISOString(),
      category: null
    });
  });

  return items;
}

async function fetchFeedCandidates(source: SourceRow) {
  try {
    const feed = await parser.parseURL(source.rss_url);
    return (feed.items ?? [])
      .map((item) => ({
        title: item.title ?? "",
        canonical_url:
          item.link ??
          item.guid ??
          (typeof item.id === "string" ? item.id : "") ??
          source.rss_url,
        excerpt: item.contentSnippet ?? item.summary ?? item.content ?? item.title ?? "",
        content_text: item["content:encoded"] ?? item.content ?? item.contentSnippet ?? item.title ?? "",
        published_at:
          item.isoDate ?? item.pubDate ?? item.pubdate ?? item.date ?? new Date().toISOString(),
        category:
          Array.isArray(item.categories) && item.categories.length > 0 ? item.categories[0] ?? null : null
      }))
      .filter((item) => item.title && item.canonical_url);
  } catch {
    const response = await fetch(source.rss_url, {
      headers: {
        "user-agent": "Content OS Bot/1.0"
      },
      next: { revalidate: 0 }
    });

    const html = await response.text();
    const jsonLdItems = readJsonLdArticles(html);

    if (jsonLdItems.length > 0) {
      return jsonLdItems;
    }

    return fallbackExtractLinks(source, html);
  }
}

export async function runIngestion() {
  await ensureSeedData();
  const supabase = getSupabaseAdmin();

  const { data: run, error: runError } = await supabase
    .from("ingestion_runs")
    .insert({ status: "running", stats: {} })
    .select("*")
    .single();

  if (runError || !run) {
    throw new Error(`Failed to start ingestion run: ${runError?.message ?? "unknown error"}`);
  }

  const stats = {
    sources: 0,
    fetched: 0,
    inserted: 0,
    duplicates: 0,
    failedSources: 0
  };

  try {
    const { data: sources, error: sourceError } = await supabase
      .from("sources")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (sourceError || !sources) {
      throw new Error(sourceError?.message ?? "Could not read sources");
    }

    stats.sources = sources.length;

    for (const source of sources as SourceRow[]) {
      try {
        const rawItems = await fetchFeedCandidates(source);
        const normalized = rawItems.map((item) => normalizeCandidate(source, item)).slice(0, 20);
        stats.fetched += normalized.length;

        if (normalized.length === 0) {
          continue;
        }

        const canonicalUrls = normalized.map((item) => item.canonical_url);
        const titleHashes = normalized.map((item) => hashTitle(item.title));

        const { data: existingArticles, error: existingError } = await supabase
          .from("articles")
          .select("id, canonical_url, title_hash")
          .or(
            `canonical_url.in.(${canonicalUrls.map((url) => `"${url}"`).join(",")}),title_hash.in.(${titleHashes
              .map((hash) => `"${hash}"`)
              .join(",")})`
          );

        if (existingError) {
          throw new Error(existingError.message);
        }

        const existingByUrl = new Map(
          (existingArticles ?? []).map((article) => [article.canonical_url as string, article.id as string])
        );
        const existingByHash = new Map(
          (existingArticles ?? [])
            .filter((article) => article.title_hash)
            .map((article) => [article.title_hash as string, article.id as string])
        );

        const inserts = normalized
          .filter((item) => !existingByUrl.has(item.canonical_url))
          .map((item) => {
            const duplicateId = existingByHash.get(hashTitle(item.title));

            if (duplicateId) {
              stats.duplicates += 1;
            }

            return {
              source_id: source.id,
              title: item.title,
              title_hash: hashTitle(item.title),
              canonical_url: item.canonical_url,
              content_text: item.content_text,
              excerpt: item.excerpt,
              category: item.category,
              published_at: item.published_at,
              duplicate_of_article_id: duplicateId ?? null,
              is_duplicate: Boolean(duplicateId)
            };
          });

        if (inserts.length === 0) {
          continue;
        }

        const { error: insertError } = await supabase.from("articles").insert(inserts);

        if (insertError) {
          throw new Error(insertError.message);
        }

        stats.inserted += inserts.length;
      } catch {
        stats.failedSources += 1;
      }
    }

    await supabase
      .from("ingestion_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        stats
      })
      .eq("id", run.id);

    return { runId: run.id, stats };
  } catch (error) {
    await supabase
      .from("ingestion_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        stats,
        error_message: error instanceof Error ? error.message : "Unknown ingestion error"
      })
      .eq("id", run.id);

    throw error;
  }
}
