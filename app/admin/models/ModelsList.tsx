import AddModelDrawer from "./AddModelDrawer";
import { DeleteModelButton } from "./DeleteModelButton";
import type { ModelListItem } from "./types";

function statusLabel(status: ModelListItem["status"]) {
  switch (status) {
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return "Taslak";
  }
}

function statusClass(status: ModelListItem["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "archived":
      return "border-white/10 bg-white/5 text-neutral-300";
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }
}

function Chip({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 ${className}`}
    >
      {children}
    </span>
  );
}

export function ModelsList({
  models,
  databaseReady,
}: {
  models: ModelListItem[];
  databaseReady: boolean;
}) {
  if (!models.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/70 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-100">
          Görüntülenecek model bulunamadı
        </h3>
        <p className="mt-2 text-sm text-zinc-500">
          Arama veya durum filtresine göre eşleşen şasi kaydı çıkmadı.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {models.map((model) => (
        <div
          key={model.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 transition hover:border-zinc-700"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100">
                  {model.slug}
                </h3>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                    model.status
                  )}`}
                >
                  {statusLabel(model.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip>
                  Boş Ağırlık {Number(model.baseWeightKg || 0).toFixed(0)} kg
                </Chip>
                <Chip>
                  Max Yük {Number(model.maxPayloadKg || 0).toFixed(0)} kg
                </Chip>
                <Chip>Dingil {Number(model.wheelbaseMm || 0)} mm</Chip>
                <Chip>
                  Tavan Boyu {model.roofLengthMm ? `${model.roofLengthMm} mm` : "—"}
                </Chip>
                <Chip>
                  Tavan Genişliği {model.roofWidthMm ? `${model.roofWidthMm} mm` : "—"}
                </Chip>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <AddModelDrawer initialData={model} disabled={!databaseReady} />
              <DeleteModelButton id={model.id} slug={model.slug} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}