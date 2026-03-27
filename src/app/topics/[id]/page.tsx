import { notFound } from "next/navigation";
import { generatePackageAction, setTopicFeedbackAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatScore } from "@/lib/utils";
import { getTopicDetail, listPromptTemplates } from "@/server/topics/queries";

export const dynamic = "force-dynamic";

function feedbackBadge(action: "favorite" | "used" | "ignored" | null) {
  if (action === "favorite") {
    return <Badge variant="success">Favorite</Badge>;
  }

  if (action === "ignored") {
    return <Badge variant="danger">Ignored</Badge>;
  }

  if (action === "used") {
    return <Badge>Used</Badge>;
  }

  return null;
}

export default async function TopicDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [topic, templates] = await Promise.all([getTopicDetail(id), listPromptTemplates()]);

  if (!topic) {
    notFound();
  }

  const favoriteAction = setTopicFeedbackAction.bind(null, topic.id, "favorite");
  const usedAction = setTopicFeedbackAction.bind(null, topic.id, "used");
  const ignoredAction = setTopicFeedbackAction.bind(null, topic.id, "ignored");
  const packageAction = generatePackageAction.bind(null, topic.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{topic.category ?? "AI news"}</Badge>
            <Badge variant="success">Final {formatScore(topic.final_score)}</Badge>
            {feedbackBadge(topic.feedback_action)}
          </div>
          <h2 className="max-w-4xl text-3xl font-semibold leading-tight">{topic.headline}</h2>
          <p className="max-w-3xl text-base text-muted-foreground">{topic.short_summary ?? "Pending enrichment."}</p>
        </div>
        <div className="flex gap-2">
          <form action={favoriteAction}>
            <Button variant={topic.feedback_action === "favorite" ? "default" : "outline"}>Favorite</Button>
          </form>
          <form action={usedAction}>
            <Button variant={topic.feedback_action === "used" ? "default" : "outline"}>Used</Button>
          </form>
          <form action={ignoredAction}>
            <Button variant={topic.feedback_action === "ignored" ? "default" : "ghost"}>Ignore</Button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Why Interesting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {topic.why_interesting ?? "This topic has not been enriched yet."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Key Points</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(topic.key_points) ? topic.key_points : []).map((point) => (
                    <li key={String(point)}>• {String(point)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(Array.isArray(topic.timeline) ? topic.timeline : []).map((step) => (
                    <li key={String(step)}>• {String(step)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ScoreRow label="Novelty" value={topic.novelty_score} />
            <ScoreRow label="Story" value={topic.story_score} />
            <ScoreRow label="Relevance" value={topic.relevance_score} />
            <ScoreRow label="Source Quality" value={topic.source_quality_score} />
            <ScoreRow label="Discussion" value={topic.discussion_score} />
            <div className="rounded-2xl bg-accent/60 p-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Reasoning</p>
              <p className="mt-2 text-sm text-muted-foreground">{topic.score_reasoning ?? "No score reasoning yet."}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topic.articles.map((article) => (
              <div key={article.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{article.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(article.published_at)}</p>
                  </div>
                  <a
                    href={article.canonical_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Prompt Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={packageAction} className="space-y-3">
              <select
                name="template_id"
                defaultValue={templates[0]?.id}
                className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button type="submit" className="w-full">
                Generate Package
              </Button>
            </form>
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">History</p>
              {topic.prompt_packages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No prompt packages yet.</p>
              ) : (
                topic.prompt_packages.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-border/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{entry.template.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                      </div>
                      <Badge>Saved</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold">{formatScore(value)}</p>
    </div>
  );
}
