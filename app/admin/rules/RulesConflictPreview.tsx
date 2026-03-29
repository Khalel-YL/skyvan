type RuleConflictItem = {
  key: string;
  pairLabel: string;
  count: number;
  hasGlobal: boolean;
  hasConditional: boolean;
  ruleTypes: string[];
};

type RulesConflictPreviewProps = {
  conflicts: RuleConflictItem[];
};

function ruleTypeLabel(value: string) {
  switch (value) {
    case "requires":
      return "Zorunlu";
    case "excludes":
      return "Engeller";
    case "recommends":
      return "Önerir";
    default:
      return value;
  }
}

export default function RulesConflictPreview({
  conflicts,
}: RulesConflictPreviewProps) {
  const previewItems = conflicts.slice(0, 6);

  return (
    <section className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Rules Conflicts
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-100">
          Çakışma ön izlemesi
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Aynı source → target çiftinde birden fazla kayıt veya global/koşullu
          birlikte kullanım olduğunda burada görünür.
        </p>
      </div>

      {previewItems.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Şu an görünür bir rule çakışması bulunmuyor.
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {previewItems.map((conflict) => (
            <article
              key={conflict.key}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {conflict.pairLabel}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Bu çift üzerinde {conflict.count} kayıt görünüyor.
                  </p>
                </div>

                <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100">
                  {conflict.count} kayıt
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {conflict.ruleTypes.map((type) => (
                  <span
                    key={`${conflict.key}-${type}`}
                    className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300"
                  >
                    {ruleTypeLabel(type)}
                  </span>
                ))}

                {conflict.hasGlobal ? (
                  <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-950/80 px-2.5 py-1 text-[11px] text-zinc-300">
                    Global var
                  </span>
                ) : null}

                {conflict.hasConditional ? (
                  <span className="inline-flex rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100">
                    Koşullu var
                  </span>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-xs leading-5 text-zinc-400">
                Bu görünüm otomatik hata anlamına gelmez. Ama aynı çiftte kural
                baskınlığı, priority ve scope kontrolü yapmak doğru olur.
              </div>
            </article>
          ))}
        </div>
      )}

      {conflicts.length > previewItems.length ? (
        <p className="text-xs text-zinc-500">
          +{conflicts.length - previewItems.length} ek conflict kaydı daha var.
        </p>
      ) : null}
    </section>
  );
}