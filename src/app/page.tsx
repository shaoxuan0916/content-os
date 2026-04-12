import { PublicNewsFeed } from "@/components/content-os/public-news-feed";
import { ThemeToggle } from "@/components/content-os/theme-toggle";
import { listArticleSources, listPublicArticles } from "@/server/articles/queries";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const params = await searchParams;
  const activeSourceSlug = params.source;
  const [sources, publicArticles] = await Promise.all([
    listArticleSources(),
    listPublicArticles({ sourceSlug: activeSourceSlug, limit: 24 })
  ]);

  const activeSource = sources.find((source) => source.slug === activeSourceSlug);

  return (
    <main className="relative mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-8 space-y-8">
        <nav className="flex items-center justify-between gap-4 border-b border-border/70 pb-5">
          <div className="inline-flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              T
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold leading-tight">Tech Pulse</p>
              <p className="text-xs text-muted-foreground">Tech news, refreshed daily</p>
            </div>
          </div>
          <ThemeToggle />
        </nav>

        <section className="max-w-4xl space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">Latest</p>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-[1.05] text-foreground sm:text-6xl">
              {activeSource ? activeSource.name : "Latest tech news"}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Fresh stories from curated sources.
            </p>
          </div>
        </section>
      </header>

      <PublicNewsFeed
        initialArticles={publicArticles.articles}
        initialHasMore={publicArticles.hasMore}
        sources={sources}
        activeSourceSlug={activeSourceSlug}
      />
    </main>
  );
}
