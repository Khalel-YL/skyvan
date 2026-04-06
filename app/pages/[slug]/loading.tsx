export default function PublicPageLoading() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="h-12 w-44 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-8 w-36 animate-pulse rounded-full bg-zinc-900" />
        </div>

        <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/70 px-6 py-12 md:px-10 md:py-16">
          <div className="h-6 w-28 animate-pulse rounded-full bg-zinc-900" />
          <div className="mt-6 h-14 w-2/3 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="mt-4 h-6 w-1/2 animate-pulse rounded-xl bg-zinc-900" />
          <div className="mt-6 h-24 w-full animate-pulse rounded-2xl bg-zinc-900" />
        </section>

        <section className="mt-6 rounded-[28px] border border-zinc-800 bg-zinc-950/60 p-6 md:p-8">
          <div className="h-5 w-24 animate-pulse rounded bg-zinc-900" />
          <div className="mt-4 h-10 w-1/3 animate-pulse rounded-xl bg-zinc-900" />
          <div className="mt-4 h-24 w-full animate-pulse rounded-2xl bg-zinc-900" />
        </section>
      </div>
    </main>
  );
}