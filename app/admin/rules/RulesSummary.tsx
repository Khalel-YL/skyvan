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
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-zinc-100">{value}</p>
      <p className="mt-2 text-xs text-zinc-400">{hint}</p>
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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        label="Toplam Kural"
        value={total}
        hint="Filtreye göre görünen kayıt"
      />
      <SummaryCard
        label="Zorunlu"
        value={requiresCount}
        hint="Requires ilişkileri"
      />
      <SummaryCard
        label="Engeller"
        value={excludesCount}
        hint="Excludes ilişkileri"
      />
      <SummaryCard
        label="Önerir"
        value={recommendsCount}
        hint="Recommends ilişkileri"
      />
      <SummaryCard
        label="Global Scope"
        value={globalCount}
        hint="Koşulsuz çalışan kayıtlar"
      />
      <SummaryCard
        label="Koşullu Scope"
        value={conditionalCount}
        hint="Model / paket / senaryo koşullu kayıtlar"
      />
      <SummaryCard
        label="En Yoğun Kaynak"
        value={topSourceLabel ?? "-"}
        hint={topSourceLabel ? `${topSourceCount} kayıt` : "Kaynak yoğunluğu yok"}
      />
      <SummaryCard
        label="En Yoğun Hedef"
        value={topTargetLabel ?? "-"}
        hint={topTargetLabel ? `${topTargetCount} kayıt` : "Hedef yoğunluğu yok"}
      />
    </section>
  );
}