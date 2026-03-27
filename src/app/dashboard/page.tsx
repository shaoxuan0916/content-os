import { DashboardTopicList } from "@/components/content-os/dashboard-topic-list";
import { EmptyState } from "@/components/ui/empty-state";
import type { FeedbackAction } from "@/server/db/types";
import { listTopicCategories, listTopics } from "@/server/topics/queries";

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
  searchParams: Promise<{ category?: string; feedback?: FeedbackAction | "unreviewed" }>;
}) {
  const params = await searchParams;
  const activeFeedback = params.feedback ?? "unreviewed";
  const [topics, categories] = await Promise.all([
    listTopics({
      category: params.category,
      feedback: activeFeedback
    }),
    listTopicCategories()
  ]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Ranked Topics</p>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
          </div>
          <p className="text-sm text-muted-foreground">{topics.length} topics</p>
        </div>
        <form className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card/70 p-4 md:grid-cols-[1fr_1fr_auto]" action="/dashboard">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Category</span>
            <select
              name="category"
              defaultValue={params.category ?? ""}
              className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
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
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold"
            >
              Reset
            </a>
          </div>
        </form>
        {topics.length === 0 ? (
          <EmptyState
            title="No topics yet"
            description="Run ingestion, clustering, and enrichment to populate the dashboard, or widen the current filters."
          />
        ) : (
          <DashboardTopicList topics={topics} />
        )}
      </section>
    </div>
  );
}
