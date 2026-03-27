export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SourceTier = "A" | "B" | "C";
export type SourceType = "official" | "media" | "aggregator";
export type RunStatus = "running" | "completed" | "failed";
export type FeedbackAction = "favorite" | "used" | "ignored";

export interface SourceRow {
  id: string;
  name: string;
  rss_url: string;
  source_type: SourceType;
  tier: SourceTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IngestionRunRow {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: RunStatus;
  stats: Json;
  error_message: string | null;
}

export interface ArticleRow {
  id: string;
  source_id: string;
  title: string;
  title_hash: string | null;
  canonical_url: string;
  content_text: string;
  excerpt: string;
  category: string | null;
  published_at: string;
  embedding: string | null;
  duplicate_of_article_id: string | null;
  is_duplicate: boolean;
  created_at: string;
  updated_at: string;
}

export interface TopicRow {
  id: string;
  headline: string;
  short_summary: string | null;
  why_interesting: string | null;
  key_points: Json;
  timeline: Json;
  tags: Json;
  category: string | null;
  centroid_embedding: string | null;
  representative_article_id: string | null;
  latest_article_published_at: string | null;
  article_count: number;
  novelty_score: number;
  story_score: number;
  relevance_score: number;
  source_quality_score: number;
  freshness_score: number;
  discussion_score: number;
  final_score: number;
  score_reasoning: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopicArticleRow {
  topic_id: string;
  article_id: string;
  similarity: number;
  is_primary: boolean;
  is_weak_match: boolean;
  created_at: string;
}

export interface PromptTemplateRow {
  id: string;
  key: string;
  name: string;
  system_prompt: string;
  instruction_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface PromptPackageRow {
  id: string;
  topic_id: string;
  template_id: string;
  payload: Json;
  final_prompt: string;
  created_at: string;
}

export interface TopicFeedbackRow {
  topic_id: string;
  action: FeedbackAction;
  created_at: string;
}

export interface MatchTopicRow {
  topic_id: string;
  similarity: number;
  category: string | null;
  latest_article_published_at: string | null;
  headline: string;
}

export interface TopicListItem extends TopicRow {
  articles: Pick<ArticleRow, "id" | "title" | "canonical_url" | "published_at">[];
  sources: Pick<SourceRow, "id" | "name" | "tier">[];
  feedback_action: FeedbackAction | null;
}

export interface TopicDetail extends TopicListItem {
  prompt_packages: (PromptPackageRow & {
    template: Pick<PromptTemplateRow, "id" | "key" | "name">;
  })[];
}

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Pick<SourceRow, "name" | "rss_url" | "source_type" | "tier"> & Partial<Pick<SourceRow, "id" | "is_active">>;
        Update: Partial<SourceRow>;
      };
      ingestion_runs: {
        Row: IngestionRunRow;
        Insert: Partial<Pick<IngestionRunRow, "started_at" | "finished_at" | "status" | "stats" | "error_message">>;
        Update: Partial<IngestionRunRow>;
      };
      articles: {
        Row: ArticleRow;
        Insert: Omit<ArticleRow, "id" | "created_at" | "updated_at" | "embedding"> & { embedding?: string | null };
        Update: Partial<ArticleRow>;
      };
      topics: {
        Row: TopicRow;
        Insert: Omit<
          TopicRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "short_summary"
          | "why_interesting"
          | "key_points"
          | "timeline"
          | "tags"
          | "novelty_score"
          | "story_score"
          | "relevance_score"
          | "source_quality_score"
          | "freshness_score"
          | "discussion_score"
          | "final_score"
          | "score_reasoning"
        > &
          Partial<
            Pick<
              TopicRow,
              | "short_summary"
              | "why_interesting"
              | "key_points"
              | "timeline"
              | "tags"
              | "novelty_score"
              | "story_score"
              | "relevance_score"
              | "source_quality_score"
              | "freshness_score"
              | "discussion_score"
              | "final_score"
              | "score_reasoning"
            >
          >;
        Update: Partial<TopicRow>;
      };
      topic_articles: {
        Row: TopicArticleRow;
        Insert: Omit<TopicArticleRow, "created_at">;
        Update: Partial<TopicArticleRow>;
      };
      prompt_templates: {
        Row: PromptTemplateRow;
        Insert: Omit<PromptTemplateRow, "id" | "created_at" | "updated_at"> & Partial<Pick<PromptTemplateRow, "id">>;
        Update: Partial<PromptTemplateRow>;
      };
      prompt_packages: {
        Row: PromptPackageRow;
        Insert: Omit<PromptPackageRow, "id" | "created_at">;
        Update: Partial<PromptPackageRow>;
      };
      topic_feedback: {
        Row: TopicFeedbackRow;
        Insert: Omit<TopicFeedbackRow, "created_at"> & Partial<Pick<TopicFeedbackRow, "created_at">>;
        Update: Partial<TopicFeedbackRow>;
      };
    };
    Functions: {
      match_topics: {
        Args: {
          query_embedding: string;
          match_count?: number;
        };
        Returns: MatchTopicRow[];
      };
      match_topic_neighbors: {
        Args: {
          query_embedding: string;
          excluded_topic_id?: string | null;
          match_count?: number;
        };
        Returns: MatchTopicRow[];
      };
    };
    Enums: {
      source_type_enum: SourceType;
      source_tier_enum: SourceTier;
      run_status_enum: RunStatus;
      feedback_action_enum: FeedbackAction;
    };
  };
}
