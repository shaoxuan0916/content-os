create extension if not exists pgcrypto;
create extension if not exists vector;

create type source_type_enum as enum ('official', 'media', 'aggregator');
create type source_tier_enum as enum ('A', 'B', 'C');
create type run_status_enum as enum ('running', 'completed', 'failed');
create type feedback_action_enum as enum ('favorite', 'used', 'ignored');

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  rss_url text not null,
  source_type source_type_enum not null,
  tier source_tier_enum not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status run_status_enum not null default 'running',
  stats jsonb not null default '{}'::jsonb,
  error_message text
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  title text not null,
  title_hash text,
  canonical_url text not null unique,
  content_text text not null default '',
  excerpt text not null default '',
  category text,
  published_at timestamptz not null,
  embedding vector(3072),
  duplicate_of_article_id uuid references public.articles(id) on delete set null,
  is_duplicate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists articles_title_hash_unique
  on public.articles (title_hash)
  where title_hash is not null;

create index if not exists articles_source_id_idx on public.articles(source_id);
create index if not exists articles_published_at_idx on public.articles(published_at desc);
create index if not exists articles_is_duplicate_idx on public.articles(is_duplicate);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  headline text not null,
  short_summary text,
  why_interesting text,
  key_points jsonb not null default '[]'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  category text,
  centroid_embedding vector(3072),
  representative_article_id uuid references public.articles(id) on delete set null,
  latest_article_published_at timestamptz,
  article_count integer not null default 0,
  novelty_score numeric(4,2) not null default 0,
  story_score numeric(4,2) not null default 0,
  relevance_score numeric(4,2) not null default 0,
  source_quality_score numeric(4,2) not null default 0,
  freshness_score numeric(4,2) not null default 0,
  discussion_score numeric(4,2) not null default 0,
  final_score numeric(5,2) not null default 0,
  score_reasoning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists topics_latest_article_published_at_idx
  on public.topics(latest_article_published_at desc nulls last);

create index if not exists topics_final_score_idx on public.topics(final_score desc);

create table if not exists public.topic_articles (
  topic_id uuid not null references public.topics(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  similarity numeric(5,4) not null,
  is_primary boolean not null default false,
  is_weak_match boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (topic_id, article_id)
);

create index if not exists topic_articles_article_id_idx on public.topic_articles(article_id);

create table if not exists public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  system_prompt text not null,
  instruction_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prompt_packages (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  template_id uuid not null references public.prompt_templates(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  final_prompt text not null,
  created_at timestamptz not null default now()
);

create index if not exists prompt_packages_topic_id_idx on public.prompt_packages(topic_id);
create index if not exists prompt_packages_created_at_idx on public.prompt_packages(created_at desc);

create table if not exists public.topic_feedback (
  topic_id uuid not null references public.topics(id) on delete cascade,
  action feedback_action_enum not null,
  created_at timestamptz not null default now(),
  primary key (topic_id, action)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sources_touch_updated_at on public.sources;
create trigger sources_touch_updated_at
before update on public.sources
for each row execute procedure public.touch_updated_at();

drop trigger if exists articles_touch_updated_at on public.articles;
create trigger articles_touch_updated_at
before update on public.articles
for each row execute procedure public.touch_updated_at();

drop trigger if exists topics_touch_updated_at on public.topics;
create trigger topics_touch_updated_at
before update on public.topics
for each row execute procedure public.touch_updated_at();

drop trigger if exists prompt_templates_touch_updated_at on public.prompt_templates;
create trigger prompt_templates_touch_updated_at
before update on public.prompt_templates
for each row execute procedure public.touch_updated_at();

create or replace function public.match_topics(
  query_embedding vector(3072),
  match_count integer default 8
)
returns table (
  topic_id uuid,
  similarity double precision,
  category text,
  latest_article_published_at timestamptz,
  headline text
)
language sql
stable
as $$
  select
    topics.id as topic_id,
    1 - (topics.centroid_embedding <=> query_embedding) as similarity,
    topics.category,
    topics.latest_article_published_at,
    topics.headline
  from public.topics
  where topics.centroid_embedding is not null
  order by topics.centroid_embedding <=> query_embedding
  limit match_count;
$$;

create or replace function public.match_topic_neighbors(
  query_embedding vector(3072),
  excluded_topic_id uuid default null,
  match_count integer default 5
)
returns table (
  topic_id uuid,
  similarity double precision,
  category text,
  latest_article_published_at timestamptz,
  headline text
)
language sql
stable
as $$
  select
    topics.id as topic_id,
    1 - (topics.centroid_embedding <=> query_embedding) as similarity,
    topics.category,
    topics.latest_article_published_at,
    topics.headline
  from public.topics
  where topics.centroid_embedding is not null
    and (excluded_topic_id is null or topics.id <> excluded_topic_id)
  order by topics.centroid_embedding <=> query_embedding
  limit match_count;
$$;

insert into public.sources (name, rss_url, source_type, tier)
values
  ('OpenAI blog', 'https://openai.com/news/rss.xml', 'official', 'A'),
  ('Anthropic blog', 'https://www.anthropic.com/news', 'official', 'A'),
  ('Google DeepMind', 'https://deepmind.google/blog/', 'official', 'A'),
  ('Meta AI', 'https://ai.meta.com/blog/', 'official', 'A'),
  ('TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/', 'media', 'A'),
  ('The Verge AI', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'media', 'A'),
  ('Reuters Technology', 'https://www.reuters.com/technology/', 'media', 'A'),
  ('WIRED AI', 'https://www.wired.com/category/artificial-intelligence/', 'media', 'A'),
  ('BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'media', 'A'),
  ('CNBC Technology', 'https://www.cnbc.com/technology/', 'media', 'A')
on conflict (name) do update set
  rss_url = excluded.rss_url,
  source_type = excluded.source_type,
  tier = excluded.tier,
  is_active = true;
