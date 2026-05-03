import AddModelDrawer from "./AddModelDrawer";
import DeleteModelButton from "./DeleteModelButton";
import type { ModelListItem } from "./types";

type ModelsListProps = {
  models: ModelListItem[];
  databaseReady: boolean;
};

function formatKg(value: string | number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return parsed.toLocaleString("tr-TR", {
    maximumFractionDigits: 0,
  });
}

function formatMm(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return value.toLocaleString("tr-TR");
}

function statusBadgeClass(status: ModelListItem["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
    case "draft":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "archived":
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-800/70 text-zinc-300";
  }
}

function statusLabel(status: ModelListItem["status"]) {
  switch (status) {
    case "active":
      return "Aktif";
    case "draft":
      return "Taslak";
    case "archived":
      return "Arşiv";
    default:
      return status;
  }
}

function infoChip(label: string) {
  return (
    <span className="inline-flex max-w-full rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300">
      {label}
    </span>
  );
}

export function ModelsList({ models, databaseReady }: ModelsListProps) {
  if (models.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-zinc-100">
          Kayıt bulunamadı
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Filtre sonucu eşleşen model yok. Yeni model ekleyebilir ya da filtreleri
          temizleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <div
          key={model.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3.5 transition hover:border-zinc-700"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-all text-base font-semibold tracking-tight text-zinc-100">
                  {model.slug}
                </h3>

                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                    model.status,
                  )}`}
                >
                  {statusLabel(model.status)}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {infoChip(`Boş ${formatKg(model.baseWeightKg)} kg`)}
                {infoChip(`Yük ${formatKg(model.maxPayloadKg)} kg`)}
                {infoChip(`Dingil ${formatMm(model.wheelbaseMm)} mm`)}
                {infoChip(`Tavan ${formatMm(model.roofLengthMm)} x ${formatMm(model.roofWidthMm)} mm`)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AddModelDrawer
                initialData={model}
                disabled={!databaseReady}
              />
              <DeleteModelButton id={model.id} status={model.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
