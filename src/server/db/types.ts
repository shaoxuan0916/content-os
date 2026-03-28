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
  canonical_url: string;
  content_text: string;
  excerpt: string;
  thumbnail_url: string | null;
  published_at: string;
  review_action: FeedbackAction | null;
  created_at: string;
  updated_at: string;
}

export interface ArticleListItem extends ArticleRow {
  source: Pick<SourceRow, "id" | "name" | "source_type" | "tier">;
}

export interface DashboardSnapshot {
  articleCount: number;
  favoriteCount: number;
  usedCount: number;
  ignoredCount: number;
}

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Pick<SourceRow, "name" | "rss_url" | "source_type" | "tier"> &
          Partial<Pick<SourceRow, "id" | "is_active">>;
        Update: Partial<SourceRow>;
      };
      ingestion_runs: {
        Row: IngestionRunRow;
        Insert: Partial<
          Pick<IngestionRunRow, "started_at" | "finished_at" | "status" | "stats" | "error_message">
        >;
        Update: Partial<IngestionRunRow>;
      };
      articles: {
        Row: ArticleRow;
        Insert: Omit<ArticleRow, "id" | "created_at" | "updated_at" | "review_action"> &
          Partial<Pick<ArticleRow, "id" | "review_action">>;
        Update: Partial<ArticleRow>;
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
