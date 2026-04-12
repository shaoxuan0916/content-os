"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { PublicArticleCard } from "@/components/content-os/public-article-card";
import { newsStaleTimeMs } from "@/components/content-os/query-provider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PublicArticleListItem, SourceRow } from "@/server/db/types";

const pageSize = 24;

type PublicSource = Pick<SourceRow, "id" | "name" | "slug" | "source_type" | "tier">;
type ArticlesPage = {
  articles: PublicArticleListItem[];
  hasMore: boolean;
};

async function fetchArticlesPage({
  sourceSlug,
  offset
}: {
  sourceSlug?: string;
  offset: number;
}): Promise<ArticlesPage> {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(pageSize)
  });

  if (sourceSlug) {
    params.set("source", sourceSlug);
  }

  const response = await fetch(`/api/articles?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Unable to load articles.");
  }

  return (await response.json()) as ArticlesPage;
}

export function PublicNewsFeed({
  initialArticles,
  initialHasMore,
  sources,
  activeSourceSlug
}: {
  initialArticles: PublicArticleListItem[];
  initialHasMore: boolean;
  sources: PublicSource[];
  activeSourceSlug?: string;
}) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const showBackToTopRef = useRef(false);
  const initialDataUpdatedAtRef = useRef(Date.now());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["public-articles", activeSourceSlug ?? "all"],
    queryFn: ({ pageParam }) =>
      fetchArticlesPage({
        sourceSlug: activeSourceSlug,
        offset: pageParam
      }),
    initialPageParam: 0,
    initialData: {
      pages: [{ articles: initialArticles, hasMore: initialHasMore }],
      pageParams: [0]
    },
    initialDataUpdatedAt: initialDataUpdatedAtRef.current,
    staleTime: newsStaleTimeMs,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((total, page) => total + page.articles.length, 0);

      return lastPage.hasMore && loadedCount > 0 ? loadedCount : undefined;
    }
  });

  const articles = data.pages.flatMap((page) => page.articles);

  const loadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasNextPage, loadMore]);

  useEffect(() => {
    function updateBackToTopVisibility() {
      const shouldShow = window.scrollY > 240;

      if (showBackToTopRef.current === shouldShow) {
        return;
      }

      showBackToTopRef.current = shouldShow;
      setShowBackToTop(shouldShow);
    }

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateBackToTopVisibility);
  }, []);

  function handleSourceChange(sourceSlug: string) {
    const params = new URLSearchParams();

    if (sourceSlug !== "all") {
      params.set("source", sourceSlug);
    }

    startTransition(() => {
      router.push(params.size > 0 ? `/?${params.toString()}` : "/");
    });
  }

  return (
    <section className="space-y-6">
      <div className="sticky top-0 z-10 -mx-4 border-y border-border/70 bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">Source</span>
            <Select
              value={activeSourceSlug ?? "all"}
              onValueChange={handleSourceChange}
              disabled={isPending}
            >
              <SelectTrigger className="sm:w-72">
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All sources</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.slug}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>
          <p className="text-sm text-muted-foreground">
            {articles.length} {articles.length === 1 ? "article" : "articles"} loaded
          </p>
        </div>
      </div>

      <div className="grid gap-x-5 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <PublicArticleCard key={article.id} article={article} />
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border border-border/70 bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">No articles found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another source.</p>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error.message}</div>
      ) : null}

      <div ref={sentinelRef} className="flex justify-center py-6">
        {hasNextPage ? (
          <Button type="button" variant="outline" disabled={isFetchingNextPage} onClick={loadMore}>
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        ) : articles.length > 0 ? (
          <p className="text-sm text-muted-foreground">You reached the end.</p>
        ) : null}
      </div>

      {showBackToTop ? (
        <Button
          type="button"
          className="fixed bottom-5 right-5 z-40 h-11 w-11 px-0 shadow-lg shadow-black/15"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </Button>
      ) : null}
    </section>
  );
}
