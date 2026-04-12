-- Fresh public-feed schema.
-- Destructive by design: drops the app-owned public schema objects and recreates
-- only what the current app needs for public browsing and Vercel-triggered ingestion.

drop schema if exists private cascade;
drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;

create extension if not exists pgcrypto with schema public;

create type public.source_type_enum as enum ('official', 'media', 'aggregator');
create type public.source_tier_enum as enum ('A', 'B', 'C');
create type public.run_status_enum as enum ('running', 'completed', 'failed');

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  rss_url text not null,
  source_type public.source_type_enum not null,
  tier public.source_tier_enum not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status public.run_status_enum not null default 'running',
  stats jsonb not null default '{}'::jsonb,
  error_message text
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  title text not null,
  canonical_url text not null unique,
  content_text text not null default '',
  excerpt text not null default '',
  thumbnail_url text,
  published_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_source_id_idx on public.articles(source_id);
create index articles_published_at_idx on public.articles(published_at desc);
create index articles_created_at_published_at_idx on public.articles(created_at desc, published_at desc);
create index ingestion_runs_started_at_idx on public.ingestion_runs(started_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.source_slug_from_name(source_name text)
returns text
language sql
immutable
as $$
  select trim(
    both '-'
    from regexp_replace(
      regexp_replace(lower(coalesce(source_name, 'source')), '[^a-z0-9]+', '-', 'g'),
      '-+',
      '-',
      'g'
    )
  );
$$;

create or replace function public.ensure_source_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug = public.source_slug_from_name(new.name);
  end if;

  return new;
end;
$$;

create trigger sources_ensure_slug
before insert or update on public.sources
for each row execute procedure public.ensure_source_slug();

create trigger sources_touch_updated_at
before update on public.sources
for each row execute procedure public.touch_updated_at();

create trigger articles_touch_updated_at
before update on public.articles
for each row execute procedure public.touch_updated_at();

insert into public.sources (name, slug, rss_url, source_type, tier)
values
  ('OpenAI blog', 'openai-blog', 'https://openai.com/news/rss.xml', 'official', 'A'),
  ('Anthropic blog', 'anthropic-blog', 'https://www.anthropic.com/news', 'official', 'A'),
  ('Google DeepMind', 'google-deepmind', 'https://deepmind.google/blog/', 'official', 'A'),
  ('Meta AI', 'meta-ai', 'https://ai.meta.com/blog/', 'official', 'A'),
  ('TechCrunch AI', 'techcrunch-ai', 'https://techcrunch.com/category/artificial-intelligence/', 'media', 'A'),
  ('The Verge AI', 'the-verge-ai', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', 'media', 'A'),
  ('Reuters Technology', 'reuters-technology', 'https://www.reuters.com/technology/', 'media', 'A'),
  ('WIRED AI', 'wired-ai', 'https://www.wired.com/category/artificial-intelligence/', 'media', 'A'),
  ('BBC Technology', 'bbc-technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'media', 'A'),
  ('CNBC Technology', 'cnbc-technology', 'https://www.cnbc.com/technology/', 'media', 'A')
on conflict (name) do update set
  slug = excluded.slug,
  rss_url = excluded.rss_url,
  source_type = excluded.source_type,
  tier = excluded.tier,
  is_active = true;
