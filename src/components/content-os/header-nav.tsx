"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({ navigation }: { navigation: readonly NavigationItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative z-[30] w-full lg:w-auto">
      <div className="flex items-center justify-end lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-card/90 text-foreground transition",
            open ? "border-primary/40 text-primary shadow-sm" : "border-border/70 hover:border-primary/40 hover:text-primary"
          )}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Toggle menu</span>
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                "absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
                open && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition-opacity duration-200",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition-transform duration-200",
                open && "-translate-y-[7px] -rotate-45"
              )}
            />
          </span>
        </button>
      </div>

      <nav className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/75 p-1.5 shadow-sm backdrop-blur lg:flex">
        {navigation.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[40] w-[min(18rem,calc(100vw-2rem))] lg:hidden">
          <nav
            id="mobile-navigation"
            className="grid gap-2 rounded-[1.75rem] border border-border/70 bg-background/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur"
          >
            <p className="px-2 pb-1 font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Navigation</p>
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-foreground text-background" : "text-foreground hover:bg-accent/70"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
