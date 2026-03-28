# Content OS

Internal article ingestion and review workspace built with Next.js, Bun, and Supabase.

## What It Does

- Ingests AI and technology articles from a curated source list.
- Stores articles and ingestion run history in Supabase.
- Enriches weak feed entries by fetching the article page directly.
- Lets authenticated users review articles and mark them as `favorite`, `used`, or `ignored`.
- Runs on a daily cron schedule and can also be triggered manually from the UI.

## Current Product Scope

- `Dashboard`: article review surface with source/status filters, multi-select bulk actions, and run-friendly browsing.
- `Runs`: manual ingestion trigger plus recent ingestion history.
- No topic clustering, enrichment pipeline, prompt packages, or AI-generated processing remain in the app.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase Auth + Postgres
- Bun for package management and scripts
- Tailwind CSS

## Environment Variables

See [.env.example](/Users/shaoxuan/Documents/nolan-innovation/content-os/.env.example).

- `NEXT_PUBLIC_APP_URL`: local or deployed app URL
- `SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_URL`: public Supabase URL for the browser client
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: browser publishable key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser anon key
- `SUPABASE_SERVICE_ROLE_KEY`: server-side admin key used for ingestion and writes
- `CRON_SECRET`: shared secret for the protected cron ingestion endpoint

## Local Development

1. Install dependencies:

```bash
bun install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Make sure your Supabase schema is up to date.

4. Start the app:

```bash
bun run dev
```

5. Open `http://localhost:3000`.

## Useful Commands

```bash
bun run dev
bun run build
bun run start
bun run typecheck
```

`bun run lint` is listed in `package.json`, but the repo still needs a completed ESLint setup migration before that command becomes non-interactive.

## Ingestion Flow

1. Read source definitions from [src/server/ingestion/defaults.ts](/Users/shaoxuan/Documents/nolan-innovation/content-os/src/server/ingestion/defaults.ts).
2. Fetch RSS or fallback page content.
3. Normalize article URL, text, and metadata.
4. If feed content is weak, fetch the article page and extract better `content_text` and `excerpt`.
5. Skip existing articles by normalized `canonical_url`.
6. Update older rows if a later run finds better content for the same article.
7. Record run stats in `ingestion_runs`.

The cron endpoint lives at [src/app/api/cron/ingest/route.ts](/Users/shaoxuan/Documents/nolan-innovation/content-os/src/app/api/cron/ingest/route.ts) and is protected by `CRON_SECRET`.

## Scheduled Runs

[vercel.json](/Users/shaoxuan/Documents/nolan-innovation/content-os/vercel.json) schedules ingestion at:

- `0 21 * * *` UTC

That corresponds to `5:30 AM` in Malaysia time.

## Data Model

Main tables:

- `sources`
- `articles`
- `ingestion_runs`

Key article fields:

- `title`: headline
- `content_text`: fuller article text when available
- `excerpt`: shorter preview summary
- `canonical_url`: dedupe key
- `review_action`: `favorite | used | ignored | null`

## Authentication

Protected routes require a valid Supabase-authenticated user session. Unauthenticated users are redirected to `/login`.

## Notes

- The UI is intentionally optimized for article triage, not publishing workflow automation.
- No AI API key is required for ingestion. Content enrichment is currently deterministic page fetching plus HTML parsing.
