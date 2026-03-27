create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;

create or replace function private.schedule_content_os_job(
  job_name text,
  schedule text,
  app_url text,
  internal_api_secret text,
  path text,
  body jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, cron, net
as $$
declare
  command text;
  normalized_app_url text;
begin
  if app_url is null or btrim(app_url) = '' then
    raise exception 'app_url cannot be empty';
  end if;

  if internal_api_secret is null or btrim(internal_api_secret) = '' then
    raise exception 'internal_api_secret cannot be empty';
  end if;

  normalized_app_url := regexp_replace(btrim(app_url), '/+$', '');

  command := format(
    $cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || %L
        ),
        body := %L::jsonb,
        timeout_milliseconds := 10000
      ) as request_id;
    $cmd$,
    normalized_app_url || path,
    btrim(internal_api_secret),
    body::text
  );

  return cron.schedule(job_name, schedule, command);
end;
$$;

create or replace function public.unschedule_content_os_cron()
returns void
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  job record;
begin
  for job in
    select jobid
    from cron.job
    where jobname in (
      'content-os-ingest',
      'content-os-process-topics',
      'content-os-enrich-topics'
    )
  loop
    perform cron.unschedule(job.jobid);
  end loop;
end;
$$;

create or replace function public.configure_content_os_cron(app_url text, internal_api_secret text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.unschedule_content_os_cron();

  perform private.schedule_content_os_job(
    'content-os-ingest',
    '30 21 * * *',
    app_url,
    internal_api_secret,
    '/api/cron/ingest',
    '{}'::jsonb
  );

  perform private.schedule_content_os_job(
    'content-os-process-topics',
    '40 21 * * *',
    app_url,
    internal_api_secret,
    '/api/internal/process-topics',
    '{}'::jsonb
  );

  perform private.schedule_content_os_job(
    'content-os-enrich-topics',
    '50 21 * * *',
    app_url,
    internal_api_secret,
    '/api/internal/enrich-topics',
    '{}'::jsonb
  );
end;
$$;

grant execute on function public.configure_content_os_cron(text, text) to postgres;
grant execute on function public.unschedule_content_os_cron() to postgres;
