update public.sources
set rss_url = case
    when name = 'TechCrunch AI' then 'https://techcrunch.com/category/artificial-intelligence/'
    else rss_url
  end,
  tier = 'A',
  is_active = true
where name in (
  'OpenAI blog',
  'Anthropic blog',
  'Google DeepMind',
  'Meta AI',
  'TechCrunch AI',
  'The Verge AI',
  'Reuters Technology',
  'WIRED AI',
  'BBC Technology',
  'CNBC Technology'
);
