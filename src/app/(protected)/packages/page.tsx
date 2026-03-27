import { PromptPackageCard } from "@/components/content-os/prompt-package-card";
import { listPromptPackages } from "@/server/topics/queries";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await listPromptPackages();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt Packages</p>
        <h2 className="text-2xl font-semibold">Generated History</h2>
      </div>
      <div className="grid gap-4">
        {packages.map((entry) => (
          <PromptPackageCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
