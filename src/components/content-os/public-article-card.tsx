import { ExternalLink, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PublicArticleListItem } from "@/server/db/types";

export function PublicArticleCard({ article }: { article: PublicArticleListItem }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border/70 bg-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40">
      <a href={article.canonical_url} target="_blank" rel="noreferrer" className="block aspect-[16/9] overflow-hidden bg-muted">
        {article.thumbnail_url ? (
          <img
            src={article.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted text-muted-foreground transition duration-300 group-hover:text-primary">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background">
              <Newspaper className="h-6 w-6" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium">No thumbnail</span>
          </div>
        )}
      </a>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{article.source.name}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(article.published_at)}</span>
        </div>

        <div className="space-y-3">
          <h2 className="line-clamp-3 text-lg font-semibold leading-tight text-foreground">
            <a href={article.canonical_url} target="_blank" rel="noreferrer" className="transition group-hover:text-primary">
              {article.title}
            </a>
          </h2>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {article.excerpt || "No summary was available from the source feed."}
          </p>
        </div>

        <a
          href={article.canonical_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Read
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
