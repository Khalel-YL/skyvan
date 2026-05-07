"use client";

import { useState, useTransition } from "react";

import {
  generateAdminAiCoreExplanationProbe,
  type AdminAiCoreExplanationProbeResult,
} from "./actions";

const initialResult: AdminAiCoreExplanationProbeResult | null = null;

export default function AiExplanationProbe() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] =
    useState<AdminAiCoreExplanationProbeResult | null>(initialResult);

  function runProbe() {
    startTransition(async () => {
      const nextResult = await generateAdminAiCoreExplanationProbe();
      setResult(nextResult);
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">
            AI açıklama altyapısı
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
            Bu kontrol yalnızca onaylı kaynaklardan sınırlı alıntı kullanır; Gemini
            sağlayıcısı yalnızca yerel yapılandırma açıksa çağrılır.
          </p>
        </div>

        <button
          type="button"
          onClick={runProbe}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-200 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kontrol ediliyor..." : "Açıklama altyapısını kontrol et"}
        </button>
      </div>

      {result ? (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
            result.ok
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
          }`}
        >
          <div className="font-medium">{result.message}</div>
          <div className="mt-1 text-xs opacity-80">
            Kaynak metadata sayısı: {result.evidenceCount}
          </div>
          {result.output ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6">
              <div className="mb-1 text-xs uppercase tracking-[0.18em] opacity-70">
                AI tarafından üretilen danışma metni
              </div>
              {result.output}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
