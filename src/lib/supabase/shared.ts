function readPublicEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined);

  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}${fallback ? ` or ${fallback}` : ""}`);
  }

  return value;
}

export function getSupabasePublicConfig(): { url: string; publishableKey: string } {
  return {
    url: readPublicEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
    publishableKey: readPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY")
  };
}
