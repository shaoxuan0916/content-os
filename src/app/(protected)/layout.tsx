import Link from "next/link";
import { HeaderNav } from "@/components/content-os/header-nav";
import { SignOutButton } from "@/components/content-os/sign-out-button";
import { requireAuthenticatedUser } from "@/server/auth/session";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prompts", label: "Prompts" },
  { href: "/packages", label: "Packages" },
  { href: "/runs", label: "Runs" }
] as const;

export default async function ProtectedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedUser();

  return (
    <div className="relative mx-auto min-h-screen max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="relative z-[20] mb-8 rounded-[2rem] border border-border/70 bg-card/72 px-5 py-5 shadow-panel backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex min-w-0 items-center gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-lg font-bold text-background shadow-sm">
              C
            </span>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">Internal Creator Stack</p>
              <h1 className="truncate text-xl font-semibold">Content OS v1</h1>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <HeaderNav navigation={navigation} />
            </div>
            <SignOutButton />
            <div className="lg:hidden">
              <HeaderNav navigation={navigation} />
            </div>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
