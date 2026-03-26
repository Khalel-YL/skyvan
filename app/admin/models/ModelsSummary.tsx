import type { ModelStatus } from "./types";

function filterLabel(status: "all" | ModelStatus) {
  switch (status) {
    case "active":
      return "Aktif görünüm";
    case "draft":
      return "Taslak görünüm";
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

export function ModelsSummary({
  total,
  active,
  draft,
  archived,
  currentStatus,
}: {
  total: number;
  active: number;
  draft: number;
  archived: number;
  currentStatus: "all" | ModelStatus;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
        {filterLabel(currentStatus)}
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