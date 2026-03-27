"use client";

import { useEffect, useState } from "react";
import { savePromptTemplateAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function CreateTemplateDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create Template</Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-sm font-medium">New Template</p>
                <p className="text-sm text-muted-foreground">Add a reusable prompt template for package generation.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <form action={savePromptTemplateAction} className="space-y-4 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Key</span>
                  <input
                    name="key"
                    placeholder="short_video_explainer_zh"
                    className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium">Name</span>
                  <input
                    name="name"
                    placeholder="讲解类短影音"
                    className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-medium">System Prompt</span>
                <textarea
                  name="system_prompt"
                  rows={8}
                  className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
                  required
                />
              </label>

              <label className="block space-y-2 text-sm">
                <span className="font-medium">Instruction Prompt</span>
                <textarea
                  name="instruction_prompt"
                  rows={12}
                  className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
                  required
                />
              </label>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Template</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
