import * as cheerio from "cheerio";
import Parser from "rss-parser";
import { getSupabaseAdmin } from "@/server/db/client";
import { ensureSeedData } from "@/server/db/bootstrap";
import type { SourceRow } from "@/server/db/types";
import { safeText } from "@/server/utils/http";
import { excerptText, normalizeUrl, stripHtml } from "@/server/utils/text";

const parser = new Parser();
const REQUEST_HEADERS = {
  "user-agent": "Tech Pulse Bot/1.0"
};
const ARTICLE_BODY_SELECTORS = [
  "[itemprop='articleBody']",
  "article",
  "main article",
  "main",
  ".article-content",
  ".entry-content",
  ".post-content",
  ".story-body",
  ".article__content",
  ".c-article-content",
  ".content-body"
];

interface FeedCandidate {
  title: string;
  canonical_url: string;
  excerpt: string;
  content_text: string;
  published_at: string;
  thumbnail_url: string | null;
}

interface ExistingArticleMatch {
  id: string;
  canonical_url: string;
  title: string;
  excerpt: string;
  content_text: string;
  thumbnail_url: string | null;
}

function cleanText(value: string | null | undefined) {
  return stripHtml(value).trim();
}

function isMeaningfulContent(value: string, title: string) {
  const normalizedValue = cleanText(value);
  const normalizedTitle = cleanText(title);

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === normalizedTitle) {
    return false;
  }

  return normalizedValue.length >= Math.max(160, normalizedTitle.length + 60);
}

function isMeaningfulExcerpt(value: string, title: string) {
  const normalizedValue = cleanText(value);
  const normalizedTitle = cleanText(title);

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === normalizedTitle) {
    return false;
  }

  return normalizedValue.length >= 40;
}

function buildNormalizedFields(item: Pick<FeedCandidate, "title" | "excerpt" | "content_text">) {
  const title = cleanText(item.title);
  const feedContent = cleanText(item.content_text);
  const feedExcerpt = cleanText(item.excerpt);

  const content_text = isMeaningfulContent(feedContent, title) ? feedContent : "";
  const excerptSource = isMeaningfulExcerpt(feedExcerpt, title)
    ? feedExcerpt
    : content_text
      ? content_text
      : "";

  return {
    title,
    content_text,
    excerpt: excerptSource ? excerptText(excerptSource, 220) : ""
  };
}

function normalizeImageUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function getImageFromUnknown(value: unknown, baseUrl: string): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return normalizeImageUrl(value, baseUrl);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = getImageFromUnknown(entry, baseUrl);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["url", "contentUrl", "thumbnailUrl"]) {
      if (typeof record[key] === "string") {
        return normalizeImageUrl(record[key] as string, baseUrl);
      }
    }
  }

  return null;
}

function normalizeCandidate(source: SourceRow, item: FeedCandidate): FeedCandidate {
  const normalizedFields = buildNormalizedFields(item);

  return {
    title: normalizedFields.title,
    canonical_url: normalizeUrl(item.canonical_url),
    excerpt: normalizedFields.excerpt,
    content_text: normalizedFields.content_text,
    published_at: new Date(item.published_at).toISOString(),
    thumbnail_url: normalizeImageUrl(item.thumbnail_url, source.rss_url)
  };
}

function getMetaContent($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).attr("content");

    if (value) {
      return cleanText(value);
    }
  }

  return "";
}

function getCanonicalHref($: cheerio.CheerioAPI, fallbackUrl: string) {
  const href = $("link[rel='canonical']").attr("href");

  if (!href) {
    return fallbackUrl;
  }

  try {
    return new URL(href, fallbackUrl).toString();
  } catch {
    return fallbackUrl;
  }
}

function extractContentFromRoot(root: cheerio.Cheerio<any>) {
  const blocks = root
    .find("p, li, blockquote")
    .map((_, element) => cleanText(root.find(element).text()))
    .get()
    .filter((text) => text.length >= 40);

  return blocks.join("\n\n");
}

function extractPageBody($: cheerio.CheerioAPI) {
  let bestContent = "";

  for (const selector of ARTICLE_BODY_SELECTORS) {
    $(selector).each((_, element) => {
      const candidate = extractContentFromRoot($(element));

      if (candidate.length > bestContent.length) {
        bestContent = candidate;
      }
    });
  }

  return bestContent;
}

async function enrichCandidateFromArticlePage(source: SourceRow, item: FeedCandidate): Promise<FeedCandidate> {
  const shouldFetchPage =
    !isMeaningfulContent(item.content_text, item.title) || !isMeaningfulExcerpt(item.excerpt, item.title);

  if (!shouldFetchPage) {
    return item;
  }

  try {
    const response = await fetch(item.canonical_url, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 0 }
    });
    const html = await safeText(response);
    const $ = cheerio.load(html);
    const pageContent = extractPageBody($);
    const pageExcerpt = getMetaContent($, [
      "meta[name='description']",
      "meta[property='og:description']",
      "meta[name='twitter:description']"
    ]);
    const pageThumbnail = getImageFromUnknown(
      getMetaContent($, [
        "meta[property='og:image']",
        "meta[name='twitter:image']"
      ]),
      item.canonical_url
    );

    return normalizeCandidate(source, {
      ...item,
      canonical_url: getCanonicalHref($, item.canonical_url),
      excerpt: pageExcerpt || item.excerpt,
      content_text: pageContent || item.content_text,
      thumbnail_url: pageThumbnail ?? item.thumbnail_url
    });
  } catch {
    return item;
  }
}

async function enrichCandidates(source: SourceRow, items: FeedCandidate[]) {
  return Promise.all(items.map((item) => enrichCandidateFromArticlePage(source, item)));
}

function shouldUpdateExistingArticle(existing: ExistingArticleMatch, incoming: FeedCandidate) {
  return (
    (!isMeaningfulContent(existing.content_text, existing.title) && isMeaningfulContent(incoming.content_text, incoming.title)) ||
    (!isMeaningfulExcerpt(existing.excerpt, existing.title) && isMeaningfulExcerpt(incoming.excerpt, incoming.title)) ||
    (!existing.thumbnail_url && !!incoming.thumbnail_url)
  );
}

function readJsonLdArticles(source: SourceRow, html: string) {
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
        walkJsonLd(source, entry, items);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  });

  return items;
}

function walkJsonLd(source: SourceRow, value: unknown, items: FeedCandidate[]) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => walkJsonLd(source, entry, items));
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
      thumbnail_url: getImageFromUnknown(record.image, source.rss_url)
    });
  }

  for (const child of Object.values(record)) {
    walkJsonLd(source, child, items);
  }
}

function isLikelyArticleUrl(source: SourceRow, url: string) {
  try {
    const candidate = new URL(url);
    const sourceUrl = new URL(source.rss_url);
    const candidateHost = candidate.hostname.replace(/^www\./, "");
    const sourceHost = sourceUrl.hostname.replace(/^www\./, "");

    if (candidateHost !== sourceHost) {
      return false;
    }

    const path = candidate.pathname.replace(/\/+$/, "");

    if (!path) {
      return false;
    }

    if (
      /^\/(category|tag|topic|topics|author|authors|page|latest|newsletters|podcasts|events|staff)(\/|$)/.test(path)
    ) {
      return false;
    }

    if (/\/(feed|rss)(\/|$)/.test(path)) {
      return false;
    }

    if (/\/(blog|news|story)\//.test(path)) {
      return true;
    }

    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(path)) {
      return true;
    }

    return path.split("/").filter(Boolean).length >= 2;
  } catch {
    return false;
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

    if (seen.has(url) || !isLikelyArticleUrl(source, url)) {
      return;
    }

    seen.add(url);
    items.push({
      title,
      canonical_url: url,
      excerpt: title,
      content_text: title,
      published_at: new Date().toISOString(),
      thumbnail_url: null
    });
  });

  return items;
}

async function fetchFeedCandidates(source: SourceRow) {
  try {
    const feed = await parser.parseURL(source.rss_url);

    return (feed.items ?? [])
      .map((item) => {
        const entry = item as Record<string, unknown>;
        const mediaThumbnail = getImageFromUnknown(entry["media:thumbnail"], source.rss_url);
        const mediaContent = getImageFromUnknown(entry["media:content"], source.rss_url);
        const enclosureUrl =
          typeof entry.enclosure === "object" && entry.enclosure && "url" in entry.enclosure
            ? normalizeImageUrl(String((entry.enclosure as { url?: unknown }).url ?? ""), source.rss_url)
            : null;

        return {
          title: item.title ?? "",
          canonical_url:
            item.link ??
            item.guid ??
            (typeof item.id === "string" ? item.id : "") ??
            source.rss_url,
          excerpt: item.contentSnippet ?? item.summary ?? item.content ?? item.title ?? "",
          content_text:
            (typeof entry["content:encoded"] === "string" ? entry["content:encoded"] : null) ??
            item.content ??
            item.contentSnippet ??
            item.title ??
            "",
          published_at:
            item.isoDate ?? item.pubDate ?? item.pubdate ?? item.date ?? new Date().toISOString(),
          thumbnail_url: mediaThumbnail ?? mediaContent ?? enclosureUrl
        } satisfies FeedCandidate;
      })
      .filter((item) => item.title && item.canonical_url);
  } catch {
    const response = await fetch(source.rss_url, {
      headers: REQUEST_HEADERS,
      next: { revalidate: 0 }
    });

    const html = await response.text();
    const jsonLdItems = readJsonLdArticles(source, html);

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
    skipped: 0,
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
        const enriched = await enrichCandidates(source, normalized);

        const dedupedByUrl = new Map<string, FeedCandidate>();
        for (const item of enriched) {
          dedupedByUrl.set(item.canonical_url, item);
        }

        const prepared = [...dedupedByUrl.values()];
        stats.fetched += prepared.length;

        if (prepared.length === 0) {
          continue;
        }

        const canonicalUrls = prepared.map((item) => item.canonical_url);
        const { data: existingArticles, error: existingError } = await supabase
          .from("articles")
          .select("id, canonical_url, title, excerpt, content_text, thumbnail_url")
          .in("canonical_url", canonicalUrls);

        if (existingError) {
          throw new Error(existingError.message);
        }

        const existingByUrl = new Map(
          ((existingArticles ?? []) as ExistingArticleMatch[]).map((article) => [article.canonical_url, article])
        );
        const inserts = prepared
          .filter((item) => !existingByUrl.has(item.canonical_url))
          .map((item) => ({
            source_id: source.id,
            title: item.title,
            canonical_url: item.canonical_url,
            content_text: item.content_text,
            excerpt: item.excerpt,
            thumbnail_url: item.thumbnail_url,
            published_at: item.published_at
          }));

        const updates = prepared.filter((item) => {
          const existing = existingByUrl.get(item.canonical_url);
          return existing ? shouldUpdateExistingArticle(existing, item) : false;
        });

        stats.skipped += prepared.length - inserts.length;

        if (inserts.length === 0) {
          for (const item of updates) {
            const existing = existingByUrl.get(item.canonical_url);

            if (!existing) {
              continue;
            }

            const { error: updateError } = await supabase
              .from("articles")
              .update({
                excerpt: item.excerpt,
                content_text: item.content_text,
                thumbnail_url: item.thumbnail_url
              })
              .eq("id", existing.id);

            if (updateError) {
              throw new Error(updateError.message);
            }
          }

          continue;
        }

        const { error: insertError } = await supabase.from("articles").insert(inserts);

        if (insertError) {
          throw new Error(insertError.message);
        }

        stats.inserted += inserts.length;

        for (const item of updates) {
          const existing = existingByUrl.get(item.canonical_url);

          if (!existing) {
            continue;
          }

          const { error: updateError } = await supabase
            .from("articles")
            .update({
              excerpt: item.excerpt,
              content_text: item.content_text,
              thumbnail_url: item.thumbnail_url
            })
            .eq("id", existing.id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        }
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
