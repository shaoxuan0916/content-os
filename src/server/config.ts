import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  INTERNAL_API_SECRET: z.string().min(1),
  GEMINI_TEXT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001")
});

let parsedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!parsedEnv) {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

    parsedEnv = envSchema.parse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
      GEMINI_TEXT_MODEL: process.env.GEMINI_TEXT_MODEL,
      GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL
    });
  }

  return parsedEnv;
}
