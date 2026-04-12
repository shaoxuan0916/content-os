export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type SourceTier = "A" | "B" | "C";
export type SourceType = "official" | "media" | "aggregator";
export type RunStatus = "running" | "completed" | "failed";

export interface SourceRow {
  id: string;
  name: string;
  slug: string;
  rss_url: string;
  source_type: SourceType;
  tier: SourceTier;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export type PublicArticleListItem = Pick<
  ArticleRow,
  "id" | "source_id" | "title" | "canonical_url" | "excerpt" | "thumbnail_url" | "published_at"
> & {
  source: Pick<SourceRow, "id" | "name" | "slug" | "source_type" | "tier">;
};

export interface Database {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Pick<SourceRow, "name" | "slug" | "rss_url" | "source_type" | "tier"> &
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
        Insert: Omit<ArticleRow, "id" | "created_at" | "updated_at"> & Partial<Pick<ArticleRow, "id">>;
        Update: Partial<ArticleRow>;
      };
    };
    Enums: {
      source_type_enum: SourceType;
      source_tier_enum: SourceTier;
      run_status_enum: RunStatus;
    };
  };
}
