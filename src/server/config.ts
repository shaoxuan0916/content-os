import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1).optional()
});

let parsedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!parsedEnv) {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

    parsedEnv = envSchema.parse({
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CRON_SECRET: process.env.CRON_SECRET
    });
  }

  return parsedEnv;
}
