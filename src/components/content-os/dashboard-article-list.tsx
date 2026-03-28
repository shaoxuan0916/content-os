"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { bulkSetArticleReviewAction } from "@/app/actions";
import { ArticleCard } from "@/components/content-os/article-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ArticleListItem, FeedbackAction } from "@/server/db/types";

const bulkActions: { action: FeedbackAction; label: string; variant: "outline" | "ghost" | "default" }[] = [
  { action: "favorite", label: "Mark Favorite", variant: "default" },
  { action: "used", label: "Mark Used", variant: "outline" },
  { action: "ignored", label: "Mark Ignore", variant: "ghost" }
];

export function DashboardArticleList({ articles }: { articles: ArticleListItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const hasSelection = selectedIds.length > 0;
  const allSelected = articles.length > 0 && selectedIds.length === articles.length;

  useEffect(() => {
    function handleScroll() {
      setShowBackToTop(window.scrollY > 640);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => articles.some((article) => article.id === id)));
  }, [articles]);

  function toggleArticle(articleId: string) {
    setSelectedIds((current) =>
      current.includes(articleId) ? current.filter((id) => id !== articleId) : [...current, articleId]
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : articles.map((article) => article.id));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  function applyBulkAction(action: FeedbackAction) {
    if (!hasSelection) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("action", action);

      for (const articleId of selectedIds) {
        formData.append("article_ids", articleId);
      }

      await bulkSetArticleReviewAction(formData);
      setSelectedIds([]);
      router.refresh();
    });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="grid gap-4 pb-24 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            checked={selectedSet.has(article.id)}
            disabled={isPending}
            onToggleSelection={() => toggleArticle(article.id)}
          />
        ))}
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 transition duration-200",
          hasSelection ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        )}
      >
        <div className="flex w-full max-w-4xl flex-col gap-3 rounded-[1.75rem] border border-border/80 bg-card/95 p-4 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">
              {selectedIds.length} selected
            </span>
            <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={toggleAll}>
              {allSelected ? "Unselect all" : "Select all visible"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={clearSelection}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {bulkActions.map((option) => (
              <Button
                key={option.action}
                type="button"
                size="sm"
                variant={option.variant}
                disabled={isPending || !hasSelection}
                onClick={() => applyBulkAction(option.action)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-6 right-6 z-20 h-12 w-12 rounded-full border-border/80 bg-card/95 p-0 shadow-[0_16px_48px_-24px_rgba(15,23,42,0.5)] backdrop-blur transition duration-200",
          showBackToTop ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
          hasSelection ? "bottom-32 md:bottom-24" : ""
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </>
  );
}
