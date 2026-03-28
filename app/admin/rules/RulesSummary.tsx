type RulesSummaryProps = {
  total: number;
  requiresCount: number;
  excludesCount: number;
  recommendsCount: number;
  globalCount: number;
  conditionalCount: number;
  topSourceLabel: string | null;
  topSourceCount: number;
  topTargetLabel: string | null;
  topTargetCount: number;
};

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{hint}</p>
    </div>
  );
}

export function RulesSummary({
  total,
  requiresCount,
  excludesCount,
  recommendsCount,
  globalCount,
  conditionalCount,
  topSourceLabel,
  topSourceCount,
  topTargetLabel,
  topTargetCount,
}: RulesSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        label="Toplam Kural"
        value={String(total)}
        hint="Filtre sonucundaki toplam kayıt."
      />

      <SummaryCard
        label="Requires / Excludes / Recommends"
        value={`${requiresCount} / ${excludesCount} / ${recommendsCount}`}
        hint="Kural tipi dağılımı."
      />

      <SummaryCard
        label="Global / Koşullu"
        value={`${globalCount} / ${conditionalCount}`}
        hint="Scope dağılımı. Koşullu kayıtlar model, paket veya senaryo bağlamında çalışır."
      />

      <SummaryCard
        label="En Yoğun Kaynak"
        value={topSourceLabel ? `${topSourceLabel} · ${topSourceCount}` : "-"}
        hint="En fazla outbound kural üreten ürün."
      />

      <SummaryCard
        label="En Çok Etkilenen Hedef"
        value={topTargetLabel ? `${topTargetLabel} · ${topTargetCount}` : "-"}
        hint="En fazla inbound kural alan ürün."
      />

      <SummaryCard
        label="Operasyon Notu"
        value="Scope-aware"
        hint="Bu batch ile aynı hat üzerinde global ve conditional kayıt çakışmaları engellenir."
      />
    </div>
  );
}