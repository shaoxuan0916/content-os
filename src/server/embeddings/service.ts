import { getEnv } from "@/server/config";
import { getGemini } from "@/server/utils/ai";

export function buildEmbeddingText(input: {
  title: string;
  excerpt?: string | null;
  content_text?: string | null;
}) {
  return [input.title, input.excerpt ?? "", (input.content_text ?? "").slice(0, 2200)].join("\n\n");
}

export async function embedText(input: string) {
  const env = getEnv();
  const gemini = getGemini();
  const response = await gemini.models.embedContent({
    model: env.GEMINI_EMBEDDING_MODEL,
    contents: input
  });

  return response.embeddings?.[0]?.values ?? [];
}
