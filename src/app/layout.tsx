import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content OS v1",
  description: "Internal content operating system for AI and tech story discovery."
};

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prompts", label: "Prompts" },
  { href: "/packages", label: "Packages" },
  { href: "/runs", label: "Runs" }
] as const;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="relative mx-auto min-h-screen max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-border/70 bg-card/70 px-5 py-5 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/dashboard" className="inline-flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                  CO
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    Internal Creator Stack
                  </p>
                  <h1 className="text-xl font-semibold">Content OS v1</h1>
                </div>
              </Link>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
