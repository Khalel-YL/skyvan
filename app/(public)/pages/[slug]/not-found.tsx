import Link from "next/link";
import { ArrowLeft, FileWarning } from "lucide-react";

export default function PublicPageNotFound() {
  return (
    <main className="min-h-screen bg-[var(--public-bg)] text-[var(--public-text)]">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--public-border)] bg-[var(--public-surface)] text-[var(--public-muted)]">
          <FileWarning className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Sayfa bulunamadı
        </h1>

        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--public-muted)]">
          Aradığın içerik yayında değil, kaldırılmış olabilir ya da yanlış bir
          adres kullandın.
        </p>

        <Link
          href="/tr"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[var(--public-accent)] px-4 py-3 text-sm font-medium text-[var(--public-accent-text)] transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Ana sayfaya dön
        </Link>
      </div>
    </main>
  );
}
