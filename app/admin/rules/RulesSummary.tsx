type RulesSummaryProps = {
  total: number;
  requiresCount: number;
  excludesCount: number;
  recommendsCount: number;
};

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </div>
    </div>
  );
}

export function RulesSummary({
  total,
  requiresCount,
  excludesCount,
  recommendsCount,
}: RulesSummaryProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Toplam" value={total} />
      <SummaryCard label="Requires" value={requiresCount} />
      <SummaryCard label="Excludes" value={excludesCount} />
      <SummaryCard label="Recommends" value={recommendsCount} />
    </div>
  );
}