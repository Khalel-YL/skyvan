type ProductsSummaryProps = {
  total: number;
  active: number;
  draft: number;
  archived: number;
  currentStatus: "all" | "draft" | "active" | "archived";
};

function statusFilterLabel(status: ProductsSummaryProps["currentStatus"]) {
  switch (status) {
    case "all":
      return "Tüm görünüm";
    case "draft":
      return "Taslak görünüm";
    case "active":
      return "Aktif görünüm";
    case "archived":
      return "Arşiv görünüm";
    default:
      return "Tüm görünüm";
  }
}

function StatChip({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${className}`}
    >
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

export function ProductsSummary({
  total,
  active,
  draft,
  archived,
  currentStatus,
}: ProductsSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
        {statusFilterLabel(currentStatus)}
      </span>

      <StatChip
        label="Toplam"
        value={total}
        className="border-zinc-700 bg-zinc-900"
      />
      <StatChip
        label="Aktif"
        value={active}
        className="border-emerald-800 bg-emerald-950/50"
      />
      <StatChip
        label="Taslak"
        value={draft}
        className="border-amber-800 bg-amber-950/40"
      />
      <StatChip
        label="Arşiv"
        value={archived}
        className="border-zinc-700 bg-zinc-900"
      />
    </div>
  );
}
