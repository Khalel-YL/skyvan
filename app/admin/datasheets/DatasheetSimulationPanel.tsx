import {
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";

import {
  datasheetSimulationCases,
  simulateDatasheetInput,
} from "./validation";

export default function DatasheetSimulationPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-300">
          <FlaskConical className="h-4 w-4" />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">
            Simülasyon laboratuvarı
          </h2>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            Kayıt mantığının beklenen davranışını hızlıca doğrulamak için sabit
            smoke-test senaryoları.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {datasheetSimulationCases.map((testCase) => {
          const result = simulateDatasheetInput({
            title: testCase.title,
            s3Key: testCase.s3Key,
          });

          const passes =
            (testCase.expected === "accept" && result.accepted) ||
            (testCase.expected === "reject" && !result.accepted);

          return (
            <div
              key={testCase.id}
              className="rounded-2xl border border-white/8 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">
                    {testCase.title || "Başlık boş"}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {testCase.s3Key || "Bağlantı boş"}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    passes
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  {passes ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldAlert className="h-3.5 w-3.5" />
                  )}
                  {passes ? "Beklenen sonuç" : "Beklenmeyen sonuç"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-300">
                  Beklenen: {testCase.expected === "accept" ? "Kabul" : "Red"}
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    result.accepted
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-200"
                  }`}
                >
                  Sonuç: {result.accepted ? "Kabul" : "Red"}
                </span>

                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-200">
                  {result.label}
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-neutral-400">
                {testCase.note}
              </p>

              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Motor çıktısı: {result.reason}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-amber-200">
        Not: tekrar eden `s3Key` kontrolü statik senaryoda değil, gerçek kayıt
        anında veritabanı üzerinden sunucu tarafında doğrulanır.
      </div>
    </section>
  );
}