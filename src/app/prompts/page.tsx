import { savePromptTemplateAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listPromptTemplates } from "@/server/topics/queries";

export const dynamic = "force-dynamic";

export default async function PromptsPage() {
  const templates = await listPromptTemplates();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt Templates</p>
        <h2 className="text-2xl font-semibold">Template Management</h2>
      </div>
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={savePromptTemplateAction} className="space-y-4">
                <input type="hidden" name="id" value={template.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Key</span>
                    <input
                      name="key"
                      defaultValue={template.key}
                      className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Name</span>
                    <input
                      name="name"
                      defaultValue={template.name}
                      className="h-10 w-full rounded-2xl border border-border bg-card px-4 text-sm"
                    />
                  </label>
                </div>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">System Prompt</span>
                  <textarea
                    name="system_prompt"
                    defaultValue={template.system_prompt}
                    rows={8}
                    className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
                  />
                </label>
                <label className="block space-y-2 text-sm">
                  <span className="font-medium">Instruction Prompt</span>
                  <textarea
                    name="instruction_prompt"
                    defaultValue={template.instruction_prompt}
                    rows={12}
                    className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm"
                  />
                </label>
                <Button type="submit">Save Template</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
