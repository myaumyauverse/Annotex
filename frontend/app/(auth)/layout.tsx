export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card relative overflow-hidden rounded-[2rem] p-8 md:p-10 lg:p-14">
          <div className="absolute -left-16 top-8 h-36 w-36 rounded-full bg-brand/16 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-black/6 blur-3xl" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div className="space-y-6">
              <p className="eyebrow text-sm text-muted">Annotex workspace</p>
              <div className="max-w-2xl space-y-5">
                <h1 className="font-mono text-4xl font-semibold tracking-[-0.05em] text-foreground md:text-6xl">
                  Label data with a team that can move from ingestion to payout in one place.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted md:text-lg">
                  Contributors pick up tasks, validators review consensus, and admins keep datasets and quality in view without leaving the workspace.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-black/8 bg-white/56 p-5">
                <p className="eyebrow text-xs text-muted">Task flow</p>
                <p className="mt-3 text-2xl font-semibold">12 min</p>
                <p className="mt-2 text-sm leading-6 text-muted">Median turnaround from assignment to validated submission.</p>
              </div>
              <div className="rounded-[1.5rem] border border-black/8 bg-white/56 p-5">
                <p className="eyebrow text-xs text-muted">Consensus</p>
                <p className="mt-3 text-2xl font-semibold">94.2%</p>
                <p className="mt-2 text-sm leading-6 text-muted">Agreement rate across active review queues this week.</p>
              </div>
              <div className="rounded-[1.5rem] border border-black/8 bg-white/56 p-5">
                <p className="eyebrow text-xs text-muted">Payouts</p>
                <p className="mt-3 text-2xl font-semibold">24h</p>
                <p className="mt-2 text-sm leading-6 text-muted">Typical settlement window once work has cleared validation.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="flex items-center justify-center">{children}</section>
      </div>
    </main>
  );
}