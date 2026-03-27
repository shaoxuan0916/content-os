import { triggerEnrichmentAction, triggerIngestionAction, triggerProcessingAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { listRuns } from "@/server/topics/queries";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await listRuns();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Runs & Controls</p>
          <h2 className="text-2xl font-semibold">Pipeline Logs</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={triggerIngestionAction}>
            <Button>Run Ingestion</Button>
          </form>
          <form action={triggerProcessingAction} className="flex gap-2">
            <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 text-sm">
              <input type="checkbox" name="reset" />
              Reset topics
            </label>
            <Button variant="outline">Process Topics</Button>
          </form>
          <form action={triggerEnrichmentAction} className="flex gap-2">
            <label className="inline-flex items-center gap-2 rounded-full border border-border px-3 text-sm">
              <input type="checkbox" name="force" />
              Force
            </label>
            <Button variant="outline">Enrich Topics</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4">
        {runs.map((run) => (
          <Card key={run.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>{formatDate(run.started_at)}</span>
                <span className="text-sm text-muted-foreground">{run.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">Finished: {run.finished_at ? formatDate(run.finished_at) : "Still running"}</p>
              <pre className="overflow-x-auto rounded-3xl bg-muted p-4 text-xs leading-6">
                {JSON.stringify(run.stats, null, 2)}
              </pre>
              {run.error_message ? <p className="text-sm text-danger">{run.error_message}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
