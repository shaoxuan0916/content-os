alter table public.articles
  add column if not exists thumbnail_url text,
  add column if not exists review_action feedback_action_enum;

create index if not exists articles_review_action_idx on public.articles(review_action);

drop index if exists articles_title_hash_unique;
drop index if exists articles_is_duplicate_idx;
drop index if exists topic_articles_article_id_idx;
drop index if exists topics_latest_article_published_at_idx;
drop index if exists topics_final_score_idx;
drop index if exists prompt_packages_topic_id_idx;
drop index if exists prompt_packages_created_at_idx;

alter table public.articles
  drop column if exists title_hash,
  drop column if exists category,
  drop column if exists embedding,
  drop column if exists duplicate_of_article_id,
  drop column if exists is_duplicate;

drop trigger if exists topics_touch_updated_at on public.topics;
drop trigger if exists prompt_templates_touch_updated_at on public.prompt_templates;

drop function if exists public.match_topic_neighbors(vector(3072), uuid, integer);
drop function if exists public.match_topics(vector(3072), integer);

drop table if exists public.prompt_packages;
drop table if exists public.prompt_templates;
drop table if exists public.topic_articles;
drop table if exists public.topic_feedback;
drop table if exists public.topics;

drop function if exists public.configure_content_os_cron(text, text);
drop function if exists public.unschedule_content_os_cron();
drop function if exists private.schedule_content_os_job(text, text, text, text, text, jsonb);

drop schema if exists private;

drop extension if exists pg_net;
drop extension if exists pg_cron;
drop extension if exists vector;
