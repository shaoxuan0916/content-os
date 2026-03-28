"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { ArticleListItem, FeedbackAction } from "@/server/db/types";

function ReviewBadge({ action }: { action: FeedbackAction | null }) {
  if (action === "favorite") {
    return <Badge variant="success">Favorite</Badge>;
  }

  if (action === "ignored") {
    return <Badge variant="danger">Ignored</Badge>;
  }

  if (action === "used") {
    return <Badge>Used</Badge>;
  }

  return <Badge>Unreviewed</Badge>;
}

export function ArticleCard({
  article,
  checked,
  disabled,
  onToggleSelection
}: {
  article: ArticleListItem;
  checked: boolean;
  disabled: boolean;
  onToggleSelection: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={checked}
      onClick={disabled ? undefined : onToggleSelection}
      onKeyDown={
        disabled
          ? undefined
          : (event) => {
              if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                onToggleSelection();
              }
            }
      }
      className={cn(
        "group relative overflow-hidden border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        checked
          ? "border-primary/60 bg-primary/[0.06] shadow-[0_18px_50px_-28px_rgba(14,116,144,0.5)]"
          : "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)]"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/0 via-primary/70 to-primary/0 transition",
          checked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      />

      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge>{article.source.name}</Badge>
          <ReviewBadge action={article.review_action} />
        </div>
        <div
          className={cn(
            "inline-flex min-w-16 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition",
            checked
              ? "border-primary/40 bg-primary text-primary-foreground"
              : "border-border bg-background/80 text-muted-foreground"
          )}
        >
          {checked ? "Selected" : "Select"}
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-xl font-semibold leading-tight">{article.title}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDate(article.published_at)} · {article.source.tier} tier {article.source.source_type}
          </p>
        </div>
        <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
          {article.excerpt || "No summary was available from the source feed."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 px-5 py-4">
        <label
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
          onClick={(event) => event.stopPropagation()}
        >
          <input type="checkbox" checked={checked} onChange={onToggleSelection} disabled={disabled} />
          Selected
        </label>
        <a
          href={article.canonical_url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Open source
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}
