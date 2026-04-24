"use client";

type AdminErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: AdminErrorProps) {
  return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
        Admin Error Boundary
      </p>

      <h2 className="mt-2 text-xl font-semibold text-white">
        Admin ekranı beklenmeyen bir hataya girdi.
      </h2>

      <p className="mt-3 text-sm leading-6 text-red-100/80">
        {error.message || "Bilinmeyen hata"}
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
      >
        Tekrar dene
      </button>
    </div>
  );
}