# Tech Pulse

Public tech-news feed built with Next.js, Bun, and Supabase.

## What It Does

- Ingests AI and technology articles from active sources every day.
- Stores articles and ingestion run history in Supabase.
- Lets anyone visit the homepage to browse, filter by source, and open original articles.
- Keeps ingestion protected behind a cron-only API endpoint.

## Current Product Scope

- `/`: public article feed with source filtering and infinite scroll.
- `/api/articles`: read-only public article API used by the homepage.
- `/api/cron/ingest`: protected ingestion endpoint called by Vercel Cron.
- No admin screens, login, manual ingestion UI, or article review/status workflow.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase Postgres
- Vercel Cron
- Bun for package management and scripts
- Tailwind CSS

## Environment Variables

See [.env.example](/Users/shaoxuan/Documents/nolan-innovation/content-os/.env.example).

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key used by API routes and ingestion
- `CRON_SECRET`: shared bearer secret for `/api/cron/ingest`

## Local Development

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
bun run dev
bun run build
bun run start
bun run typecheck
```

`bun run lint` is listed in `package.json`, but the repo still needs a completed ESLint setup migration before that command becomes non-interactive.

## Ingestion Flow

1. Read active sources from `sources`.
2. Fetch RSS or fallback page content.
3. Normalize article URL, text, image, and published date.
4. If feed content is weak, fetch the article page and extract stronger content.
5. Insert new articles by unique `canonical_url`.
6. Update older rows if a later run finds better excerpt/content/image data.
7. Record run stats in `ingestion_runs`.

## Scheduled Runs

[vercel.json](/Users/shaoxuan/Documents/nolan-innovation/content-os/vercel.json) schedules ingestion at:

```txt
0 21 * * *
```

That is 5:00 AM Malaysia time.

