import type { SourceType, SourceTier } from "@/server/db/types";

export interface SourceSeed {
  name: string;
  rss_url: string;
  source_type: SourceType;
  tier: SourceTier;
}

export const SOURCE_SEEDS: SourceSeed[] = [
  {
    name: "OpenAI blog",
    rss_url: "https://openai.com/news/rss.xml",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Anthropic blog",
    rss_url: "https://www.anthropic.com/news",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Google DeepMind",
    rss_url: "https://deepmind.google/blog/",
    source_type: "official",
    tier: "A"
  },
  {
    name: "Meta AI",
    rss_url: "https://ai.meta.com/blog/",
    source_type: "official",
    tier: "A"
  },
  {
    name: "TechCrunch AI",
    rss_url: "https://techcrunch.com/category/artificial-intelligence/",
    source_type: "media",
    tier: "A"
  },
  {
    name: "The Verge AI",
    rss_url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    source_type: "media",
    tier: "A"
  },
  {
    name: "Reuters Technology",
    rss_url: "https://www.reuters.com/technology/",
    source_type: "media",
    tier: "A"
  },
  {
    name: "WIRED AI",
    rss_url: "https://www.wired.com/category/artificial-intelligence/",
    source_type: "media",
    tier: "A"
  },
  {
    name: "BBC Technology",
    rss_url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
    source_type: "media",
    tier: "A"
  },
  {
    name: "CNBC Technology",
    rss_url: "https://www.cnbc.com/technology/",
    source_type: "media",
    tier: "A"
  }
];
