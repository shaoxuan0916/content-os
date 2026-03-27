alter table public.sources enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.articles enable row level security;
alter table public.topics enable row level security;
alter table public.topic_articles enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.prompt_packages enable row level security;
alter table public.topic_feedback enable row level security;

revoke execute on function public.match_topics(vector(3072), integer) from public;
revoke execute on function public.match_topics(vector(3072), integer) from anon;
revoke execute on function public.match_topics(vector(3072), integer) from authenticated;
grant execute on function public.match_topics(vector(3072), integer) to service_role;

revoke execute on function public.match_topic_neighbors(vector(3072), uuid, integer) from public;
revoke execute on function public.match_topic_neighbors(vector(3072), uuid, integer) from anon;
revoke execute on function public.match_topic_neighbors(vector(3072), uuid, integer) from authenticated;
grant execute on function public.match_topic_neighbors(vector(3072), uuid, integer) to service_role;
