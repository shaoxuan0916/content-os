import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Pipeline Runs</p>
        <h2 className="text-2xl font-semibold">Coming Soon</h2>
      </div>
      <EmptyState
        title="Background automation only"
        description="Pipeline runs are scheduled through Supabase Cron. Manual run controls and run history will return in a later pass."
      />
    </div>
  );
}
