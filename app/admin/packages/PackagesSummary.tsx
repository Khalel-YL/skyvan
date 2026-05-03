import type { PackageFilterView } from "./types";

type PackagesSummaryProps = {
  total: number;
  defaultCount: number;
  customCount: number;
  linkedCount: number;
  currentView: PackageFilterView;
};

function StatChip({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
        active
          ? "border-zinc-700 bg-zinc-900"
          : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

export function PackagesSummary({
  total,
  defaultCount,
  customCount,
  linkedCount,
  currentView,
}: PackagesSummaryProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatChip label="Toplam" value={total} active={currentView === "all"} />
      <StatChip
        label="Varsayılan"
        value={defaultCount}
        active={currentView === "default"}
      />
      <StatChip
        label="Standart"
        value={customCount}
        active={currentView === "custom"}
      />
      <StatChip label="Modele Bağlı" value={linkedCount} />
    </div>
  );
}
