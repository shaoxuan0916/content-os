"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkSetTopicFeedbackAction } from "@/app/actions";
import { TopicCard } from "@/components/content-os/topic-card";
import { Button } from "@/components/ui/button";
import type { FeedbackAction, TopicListItem } from "@/server/db/types";

const bulkActions: { action: FeedbackAction; label: string; variant: "outline" | "ghost" | "default" }[] = [
  { action: "favorite", label: "Mark Favorite", variant: "outline" },
  { action: "used", label: "Mark Used", variant: "outline" },
  { action: "ignored", label: "Mark Ignore", variant: "ghost" }
];

export function DashboardTopicList({ topics }: { topics: TopicListItem[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = topics.length > 0 && selectedIds.length === topics.length;

  function toggleTopic(topicId: string) {
    setSelectedIds((current) =>
      current.includes(topicId) ? current.filter((id) => id !== topicId) : [...current, topicId]
    );
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : topics.map((topic) => topic.id));
  }

  function applyBulkAction(action: FeedbackAction) {
    if (selectedIds.length === 0) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("action", action);

      for (const topicId of selectedIds) {
        formData.append("topic_ids", topicId);
      }

      await bulkSetTopicFeedbackAction(formData);
      setSelectedIds([]);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-card/70 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <label className="inline-flex items-center gap-2 font-medium text-foreground">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={isPending || topics.length === 0} />
            Select all visible
          </label>
          <span>{selectedIds.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {bulkActions.map((option) => (
            <Button
              key={option.action}
              type="button"
              size="sm"
              variant={option.variant}
              disabled={isPending || selectedIds.length === 0}
              onClick={() => applyBulkAction(option.action)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {topics.map((topic) => {
          const checked = selectedSet.has(topic.id);

          return (
            <div key={topic.id} className="relative">
              <label className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-2 text-xs font-semibold shadow-sm">
                <input type="checkbox" checked={checked} onChange={() => toggleTopic(topic.id)} disabled={isPending} />
                Select
              </label>
              <TopicCard topic={topic} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
