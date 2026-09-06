import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-10 md:px-10">
      <section className="card relative overflow-hidden rounded-4xl p-8 md:p-12">
        <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-black/6 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-white/70 blur-3xl" />

        <div className="relative space-y-8">
          <p className="eyebrow text-xs text-muted">Annotex platform</p>
          <div className="max-w-4xl space-y-4">
            <h1 className="font-mono text-4xl font-semibold tracking-[-0.05em] md:text-6xl">
              Transparent data labeling with measurable quality and payout tracking.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted md:text-base">
              Annotex gives contributors, validators, and admins one workspace for task assignment, label submission,
              consensus-based validation, and earnings visibility.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4">
              <p className="eyebrow text-[11px] text-muted">Tasking</p>
              <p className="mt-2 text-2xl font-semibold">Assign + Submit</p>
            </article>
            <article className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4">
              <p className="eyebrow text-[11px] text-muted">Validation</p>
              <p className="mt-2 text-2xl font-semibold">Consensus rules</p>
            </article>
            <article className="rounded-[1.25rem] border border-black/10 bg-white/80 p-4">
              <p className="eyebrow text-[11px] text-muted">Incentives</p>
              <p className="mt-2 text-2xl font-semibold">Wallet payouts</p>
            </article>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary" href="/login">
              Sign in
            </Link>
            <Link className="btn-secondary" href="/register">
              Create account
            </Link>
            <Link className="btn-secondary" href="/dashboard">
              Open workspace
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
