import { DashboardArticleList } from "@/components/content-os/dashboard-article-list";
import { EmptyState } from "@/components/ui/empty-state";
import type { FeedbackAction } from "@/server/db/types";
import { listArticles, listArticleSources } from "@/server/articles/queries";

export const dynamic = "force-dynamic";

const feedbackOptions: { value: FeedbackAction | "unreviewed"; label: string }[] = [
  { value: "unreviewed", label: "Unreviewed" },
  { value: "favorite", label: "Favorite" },
  { value: "used", label: "Used" },
  { value: "ignored", label: "Ignored" }
];

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ source?: string; feedback?: FeedbackAction | "unreviewed" }>;
}) {
  const params = await searchParams;
  const activeFeedback = params.feedback ?? "unreviewed";
  const [articles, sources] = await Promise.all([
    listArticles({
      sourceId: params.source,
      feedback: activeFeedback
    }),
    listArticleSources()
  ]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Latest Articles</p>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
          </div>
          <p className="text-sm text-muted-foreground">{articles.length} visible articles</p>
        </div>

        <form
          className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card/70 p-4 md:grid-cols-[1fr_1fr_auto]"
          action="/dashboard"
        >
          <label className="space-y-2 text-sm">
            <span className="font-medium">Source</span>
            <select
              name="source"
              defaultValue={params.source ?? ""}
              className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            >
              <option value="">All sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Status</span>
            <select
              name="feedback"
              defaultValue={activeFeedback}
              className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            >
              {feedbackOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="h-10 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Apply
            </button>
            <a
              href="/dashboard?feedback=unreviewed"
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold"
            >
              Reset
            </a>
          </div>
        </form>

        {articles.length === 0 ? (
          <EmptyState
            title="No articles yet"
            description="Run ingestion to pull the latest posts into the dashboard, or widen the current filters."
          />
        ) : (
          <DashboardArticleList articles={articles} />
        )}
      </section>
    </div>
  );
}
