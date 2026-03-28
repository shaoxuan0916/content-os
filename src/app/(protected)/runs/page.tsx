import { triggerIngestionAction } from "@/app/actions";
import { RunSubmitButton } from "@/components/content-os/run-submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardSnapshot, listRuns } from "@/server/articles/queries";
import type { IngestionRunRow } from "@/server/db/types";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Still running";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDuration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) {
    return "In progress";
  }

  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();

  if (!Number.isFinite(durationMs) || durationMs < 1000) {
    return "<1s";
  }

  const seconds = Math.round(durationMs / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

function getStatsSummary(run: IngestionRunRow) {
  if (!run.stats || typeof run.stats !== "object" || Array.isArray(run.stats)) {
    return "No stats";
  }

  const stats = run.stats as Record<string, unknown>;
  const parts = [
    ["sources", stats.sources],
    ["fetched", stats.fetched],
    ["inserted", stats.inserted],
    ["skipped", stats.skipped],
    ["failed", stats.failedSources]
  ]
    .filter(([, value]) => typeof value === "number")
    .map(([label, value]) => `${label} ${value}`);

  return parts.length > 0 ? parts.join(" • ") : "No stats";
}

function StatusBadge({ status }: { status: IngestionRunRow["status"] }) {
  if (status === "completed") {
    return <Badge variant="success">Completed</Badge>;
  }

  if (status === "failed") {
    return <Badge variant="danger">Failed</Badge>;
  }

  return <Badge>Running</Badge>;
}

export default async function RunsPage() {
  const [runs, snapshot] = await Promise.all([listRuns(), getDashboardSnapshot()]);
  const latestRun = runs[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Ingestion Runs</p>
          <h2 className="text-2xl font-semibold">Run Controls</h2>
        </div>
        <p className="text-sm text-muted-foreground">{runs.length} recent ingestion runs</p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daily Flow</CardTitle>
            <CardDescription>One job, one table of articles, one review surface.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-border/70 bg-background/40 p-4">
              <p className="text-sm font-medium">Schedule</p>
              <p className="mt-1 text-base font-semibold">5:30 AM daily</p>
              <p className="mt-2 text-sm text-muted-foreground">Configured as `0 21 * * *` in UTC, which is 5:30 AM MYT.</p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/40 p-4">
              <p className="text-sm font-medium">Latest run</p>
              <p className="mt-1 text-base font-semibold">{latestRun ? formatDateTime(latestRun.started_at) : "Not run yet"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {latestRun ? `${latestRun.status} · ${getStatsSummary(latestRun)}` : "Trigger ingestion once to create the first run."}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-border/70 bg-background/40 p-4">
              <p className="text-sm font-medium">Review queue</p>
              <p className="mt-1 text-base font-semibold">
                {Math.max(0, snapshot.articleCount - snapshot.favoriteCount - snapshot.usedCount - snapshot.ignoredCount)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Articles still waiting for a review action.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Ingestion</CardTitle>
            <CardDescription>Use this whenever you want to refresh the article feed on demand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={triggerIngestionAction}>
              <RunSubmitButton idleLabel="Run ingestion" pendingLabel="Running ingestion..." />
            </form>
            <p className="text-sm text-muted-foreground">
              This is the same ingestion flow as the scheduled 5:30 AM run. No clustering, enrichment, or prompt generation remains.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Recent Runs</h3>
          <p className="text-sm text-muted-foreground">Manual and scheduled ingestion runs appear here.</p>
        </div>

        {runs.length === 0 ? (
          <EmptyState title="No runs yet" description="Trigger ingestion once to create the first run record." />
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <Card key={run.id}>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={run.status} />
                      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {run.id.slice(0, 8)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Started {formatDateTime(run.started_at)}</p>
                    <p className="text-sm text-muted-foreground">Finished {formatDateTime(run.finished_at)}</p>
                    <p className="text-sm text-muted-foreground">{getStatsSummary(run)}</p>
                    {run.error_message ? <p className="text-sm text-danger">{run.error_message}</p> : null}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration {formatDuration(run.started_at, run.finished_at)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
