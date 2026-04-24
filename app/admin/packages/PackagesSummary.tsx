import type { PackageFilterView } from "./types";

type PackagesSummaryProps = {
  total: number;
  defaultCount: number;
  customCount: number;
  linkedCount: number;
  currentView: PackageFilterView;
};

function SummaryCard({
  label,
  value,
  active = false,
}: {
  label: string;
  value: number;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        active
          ? "border-zinc-700 bg-zinc-900"
          : "border-zinc-800 bg-zinc-950/60"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        {value}
      </div>
    </div>
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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Toplam" value={total} active={currentView === "all"} />
      <SummaryCard
        label="Varsayılan"
        value={defaultCount}
        active={currentView === "default"}
      />
      <SummaryCard
        label="Standart"
        value={customCount}
        active={currentView === "custom"}
      />
      <SummaryCard label="Modele Bağlı" value={linkedCount} />
    </div>
  );
}