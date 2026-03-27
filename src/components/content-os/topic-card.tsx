import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatScore } from "@/lib/utils";
import type { TopicListItem } from "@/server/db/types";

function feedbackBadge(topic: TopicListItem) {
  if (topic.feedback_action === "favorite") {
    return <Badge variant="success">Favorite</Badge>;
  }

  if (topic.feedback_action === "ignored") {
    return <Badge variant="danger">Ignored</Badge>;
  }

  if (topic.feedback_action === "used") {
    return <Badge>Used</Badge>;
  }

  return null;
}

export function TopicCard({ topic }: { topic: TopicListItem }) {
  return (
    <Link href={`/topics/${topic.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge>{topic.category ?? "AI news"}</Badge>
                <Badge variant="success">Score {formatScore(topic.final_score)}</Badge>
                {feedbackBadge(topic)}
              </div>
              <CardTitle className="text-xl leading-tight">{topic.headline}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {topic.why_interesting ?? topic.short_summary ?? "Pending enrichment."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Articles</p>
              <p className="text-sm font-semibold">{topic.articles.length}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sources</p>
              <p className="line-clamp-2 text-sm font-semibold">{topic.sources.map((source) => source.name).join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
