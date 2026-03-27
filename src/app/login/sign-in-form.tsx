"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextPath = searchParams.get("next") || "/dashboard";

    startTransition(async () => {
      setError(null);
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <label className="block space-y-2.5 text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="h-12 w-full rounded-2xl border border-border/80 bg-background/90 px-4 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          required
        />
      </label>
      <label className="block space-y-2.5 text-sm">
        <span className="font-medium text-foreground">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className="h-12 w-full rounded-2xl border border-border/80 bg-background/90 px-4 text-sm outline-none transition placeholder:text-muted-foreground/80 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          required
        />
      </label>
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <Button type="submit" className="h-12 w-full rounded-2xl text-sm" disabled={isPending}>
        {isPending ? "Signing In..." : "Enter Content OS"}
      </Button>
      <p className="text-sm leading-6 text-muted-foreground">
        Access is limited to manually approved accounts in Supabase Auth.
      </p>
    </form>
  );
}
