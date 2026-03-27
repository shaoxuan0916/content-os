"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleSignOut}>
      {isPending ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
