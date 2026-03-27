import { savePromptTemplateAction } from "@/app/actions";
import { CreateTemplateDialog } from "@/components/content-os/create-template-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPromptTemplates } from "@/server/topics/queries";

export const dynamic = "force-dynamic";

function TemplateForm({
  id,
  keyValue = "",
  nameValue = "",
  systemPrompt = "",
  instructionPrompt = "",
  submitLabel,
  title,
  description
}: {
  id?: string;
  keyValue?: string;
  nameValue?: string;
  systemPrompt?: string;
  instructionPrompt?: string;
  submitLabel: string;
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <form action={savePromptTemplateAction} className="space-y-4">
          <input type="hidden" name="id" value={id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Key</span>
              <input
                name="key"
                defaultValue={keyValue}
                placeholder="short_video_interview"
                className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                required
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Name</span>
              <input
                name="name"
                defaultValue={nameValue}
                placeholder="Short Video — Interview Angle"
                className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                required
              />
            </label>
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">System Prompt</span>
            <textarea
              name="system_prompt"
              defaultValue={systemPrompt}
              rows={8}
              className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
              required
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Instruction Prompt</span>
            <textarea
              name="instruction_prompt"
              defaultValue={instructionPrompt}
              rows={12}
              className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
              required
            />
          </label>
          <Button type="submit">{submitLabel}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default async function PromptsPage() {
  const templates = await listPromptTemplates();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt Templates</p>
          <h2 className="text-2xl font-semibold">Template Management</h2>
        </div>
        <CreateTemplateDialog />
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <TemplateForm
            key={template.id}
            id={template.id}
            keyValue={template.key}
            nameValue={template.name}
            systemPrompt={template.system_prompt}
            instructionPrompt={template.instruction_prompt}
            submitLabel="Save Template"
            title={template.name}
          />
        ))}
      </div>
    </div>
  );
}
