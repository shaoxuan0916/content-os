import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await getSupabaseServerClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (error || !claims || typeof claims.sub !== "string") {
    return null;
  }

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null
  };
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
