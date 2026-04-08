import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

export default function PublicPageNotFound() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 text-zinc-400">
          <FileWarning className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          Sayfa bulunamadı
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
          Aradığın içerik yayında değil, kaldırılmış olabilir ya da yanlış bir adres
          kullandın.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>

          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Pages modülüne git
          </Link>
        </div>
      </div>
    </main>
  );
}