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

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">
        {value}
      </div>
      <div className="mt-2 text-xs text-zinc-500">{hint}</div>
    </div>
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300">
          {statusFilterLabel(currentStatus)}
        </span>

        <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-400">
          Görünen ürün sayısı: {total}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Toplam ürün"
          value={total}
          hint="Mevcut filtre sonucunda görünen toplam kayıt."
        />

        <SummaryCard
          label="Aktif"
          value={active}
          hint="Canlı kullanıma açık ürünler."
        />

        <SummaryCard
          label="Taslak"
          value={draft}
          hint="Henüz yayına hazır olmayan ürünler."
        />

        <SummaryCard
          label="Arşiv"
          value={archived}
          hint="Soft archive durumundaki kayıtlar."
        />
      </div>
    </div>
  );
}