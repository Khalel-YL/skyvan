type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicPageRouteProbe({ params }: Props) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950 p-10">
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          Pages Route Probe
        </div>

        <h1 className="mt-4 text-3xl font-semibold text-white">
          Route çalışıyor
        </h1>

        <p className="mt-4 text-zinc-300">
          Eğer bu ekranı görüyorsan <code className="rounded bg-zinc-900 px-2 py-1">app/pages/[slug]/page.tsx</code> gerçekten çalışıyor demektir.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Param slug
          </div>
          <div className="mt-2 font-mono text-lg text-white">{slug}</div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/40 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Test URL
          </div>
          <div className="mt-2 font-mono text-sm text-zinc-300">
            /pages/{slug}
          </div>
        </div>
      </div>
    </main>
  );
}