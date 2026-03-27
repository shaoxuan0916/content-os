import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";
import { getEnv } from "@/server/config";

let client: GoogleGenAI | null = null;

export function getGemini() {
  if (!client) {
    const env = getEnv();
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  return client;
}

interface StructuredCompletionOptions<T> {
  schema: ZodType<T>;
  schemaName: string;
  system: string;
  user: string;
  model?: string;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  fallback: () => T;
}

export async function runStructuredCompletion<T>({
  schema,
  system,
  user,
  model,
  fallback
}: StructuredCompletionOptions<T>): Promise<T> {
  const env = getEnv();
  const gemini = getGemini();
  const responseSchema = z.toJSONSchema(schema);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await gemini.models.generateContent({
        model: model ?? env.GEMINI_TEXT_MODEL,
        contents: user,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Gemini returned an empty structured response.");
      }

      return schema.parse(JSON.parse(text));
    } catch (error) {
      if (attempt === 1) {
        break;
      }

      continue;
    }
  }

  return fallback();
}
