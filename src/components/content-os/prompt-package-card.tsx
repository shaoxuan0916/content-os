"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Json, PromptPackageRow } from "@/server/db/types";

const COLLAPSED_HEIGHT = 288;

function readPayload(payload: Json) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }

  return {};
}

export function PromptPackageCard({
  entry
}: {
  entry: PromptPackageRow & {
    topic: { id: string; headline: string } | null;
    template: { id: string; key: string; name: string } | null;
  };
}) {
  const payload = readPayload(entry.payload);
  const contentRef = useRef<HTMLPreElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    const measure = () => {
      setCanExpand(element.scrollHeight > COLLAPSED_HEIGHT + 1);
    };

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [entry.final_prompt]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    await navigator.clipboard.writeText(entry.final_prompt);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle className="break-words leading-tight">
              {String(payload.workingTitle ?? entry.topic?.headline ?? "Prompt package")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {entry.template?.name ?? "Template"} • {formatDate(entry.created_at)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copied" : "Copy"}
            </Button>
            {canExpand ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded((value) => !value)}>
                {expanded ? "Collapse" : "Expand"}
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="break-words text-sm text-muted-foreground">
          {String(payload.suggestedAngle ?? "No suggested angle.")}
        </p>
        <pre
          ref={contentRef}
          className={[
            "rounded-3xl bg-muted p-4 text-xs leading-6 text-foreground whitespace-pre-wrap break-all",
            expanded ? "max-h-none overflow-auto" : "max-h-72 overflow-hidden"
          ].join(" ")}
        >
          {entry.final_prompt}
        </pre>
      </CardContent>
    </Card>
  );
}
