insert into public.sources (name, rss_url, source_type, tier)
values
  ('Reuters Technology', 'https://www.reuters.com/technology/', 'media', 'A'),
  ('WIRED AI', 'https://www.wired.com/category/artificial-intelligence/', 'media', 'A'),
  ('BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'media', 'A'),
  ('CNBC Technology', 'https://www.cnbc.com/technology/', 'media', 'A')
on conflict (name) do update set
  rss_url = excluded.rss_url,
  source_type = excluded.source_type,
  tier = excluded.tier,
  is_active = true;
