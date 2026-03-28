"use server";

import { revalidatePath } from "next/cache";
import { bulkSetArticleReview } from "@/server/articles/queries";
import type { FeedbackAction } from "@/server/db/types";
import { runIngestion } from "@/server/ingestion/service";

function revalidateContentViews() {
  revalidatePath("/dashboard");
  revalidatePath("/runs");
}

export async function triggerIngestionAction() {
  await runIngestion();
  revalidateContentViews();
}

export async function bulkSetArticleReviewAction(formData: FormData) {
  const action = String(formData.get("action") ?? "") as FeedbackAction;
  const articleIds = formData
    .getAll("article_ids")
    .map((value) => String(value))
    .filter(Boolean);

  if (!articleIds.length) {
    return { updated: 0 };
  }

  await bulkSetArticleReview(articleIds, action);
  revalidateContentViews();

  return { updated: articleIds.length };
}
