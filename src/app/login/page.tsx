import { SignInForm } from "@/app/login/sign-in-form";

export const dynamic = "force-dynamic";

const highlights = [
  "Daily AI topic clustering and ranking",
  "Prompt packages ready for short-form production",
  "Private creator workflow with no public sign-up"
];

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,116,144,0.18),transparent_28rem),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_26rem)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.46),transparent_45%,rgba(15,23,42,0.06))]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-background/82 shadow-[0_32px_120px_rgba(15,23,42,0.16)] backdrop-blur xl:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between gap-10 border-b border-border/70 px-6 py-8 sm:px-8 md:px-10 xl:border-b-0 xl:border-r">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-card/70 px-4 py-2">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-foreground text-base font-semibold text-background">
                C
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Internal Creator Stack</p>
                <p className="text-sm font-medium">Content OS v1</p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">Private Workspace</p>
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                Turn AI noise into a ranked content pipeline.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Review the strongest stories, group overlapping coverage into one topic, and move directly into usable prompt packages.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            {highlights.map((highlight, index) => (
              <div
                key={highlight}
                className="rounded-[1.75rem] border border-border/70 bg-card/65 p-5 backdrop-blur"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.26em] text-muted-foreground">0{index + 1}</p>
                <p className="mt-3 text-sm font-medium leading-6 text-foreground">{highlight}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative flex items-center px-4 py-6 sm:px-6 xl:px-8">
          <div className="w-full rounded-[1.75rem] border border-border/70 bg-card/88 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
            <div className="mb-8 space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">Sign In</p>
              <h2 className="text-3xl font-semibold text-foreground">Welcome back</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Sign in with the account you created in Supabase Auth. New user registration is intentionally disabled.
              </p>
            </div>
            <SignInForm />
          </div>
        </section>
      </div>
    </div>
  );
}
