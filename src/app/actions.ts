"use server";

import { revalidatePath } from "next/cache";
import { enrichTopics } from "@/server/enrichment/service";
import { runIngestion } from "@/server/ingestion/service";
import { generatePromptPackage } from "@/server/prompt-packages/service";
import { processTopics } from "@/server/clustering/service";
import { bulkSetTopicFeedback, savePromptTemplate, setTopicFeedback } from "@/server/topics/queries";
import type { FeedbackAction } from "@/server/db/types";

export async function triggerIngestionAction() {
  await runIngestion();
  revalidatePath("/dashboard");
  revalidatePath("/runs");
}

export async function triggerProcessingAction(formData: FormData) {
  await processTopics({
    reset: formData.get("reset") === "on"
  });
  revalidatePath("/dashboard");
  revalidatePath("/runs");
}

export async function triggerEnrichmentAction(formData: FormData) {
  await enrichTopics({
    force: formData.get("force") === "on"
  });
  revalidatePath("/dashboard");
  revalidatePath("/runs");
}

export async function generatePackageAction(topicId: string, formData: FormData) {
  const templateId = String(formData.get("template_id") ?? "");

  await generatePromptPackage({
    topicId,
    templateId: templateId || undefined
  });

  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/packages");
}

export async function setTopicFeedbackAction(topicId: string, action: FeedbackAction) {
  await setTopicFeedback(topicId, action);
  revalidatePath(`/topics/${topicId}`);
  revalidatePath("/dashboard");
}

export async function bulkSetTopicFeedbackAction(formData: FormData) {
  const action = String(formData.get("action") ?? "") as FeedbackAction;
  const topicIds = formData
    .getAll("topic_ids")
    .map((value) => String(value))
    .filter(Boolean);

  if (!topicIds.length) {
    return { updated: 0 };
  }

  await bulkSetTopicFeedback(topicIds, action);
  revalidatePath("/dashboard");

  return { updated: topicIds.length };
}

export async function savePromptTemplateAction(formData: FormData) {
  await savePromptTemplate({
    id: String(formData.get("id") ?? ""),
    key: String(formData.get("key") ?? ""),
    name: String(formData.get("name") ?? ""),
    system_prompt: String(formData.get("system_prompt") ?? ""),
    instruction_prompt: String(formData.get("instruction_prompt") ?? "")
  });

  revalidatePath("/prompts");
}
