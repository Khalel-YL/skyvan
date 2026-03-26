import { getProductDocumentTypeLabel } from "./lib";
import type { ProductDocumentsSummary as ProductDocumentsSummaryType } from "./types";

type Props = {
  summary: ProductDocumentsSummaryType;
};

export function ProductDocumentsSummary({ summary }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Toplam Belge
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.total}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Aktif
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.active}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Arşiv
        </div>
        <div className="mt-2 text-2xl font-semibold text-zinc-100">
          {summary.archived}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Belge Sağlığı
        </div>

        <div className="mt-2">
          {summary.completeRequiredSet ? (
            <div className="inline-flex rounded-full border border-green-800 bg-green-950 px-2.5 py-1 text-xs font-medium text-green-300">
              Çekirdek belge seti tamam
            </div>
          ) : (
            <div className="inline-flex rounded-full border border-amber-800 bg-amber-950 px-2.5 py-1 text-xs font-medium text-amber-300">
              Eksik çekirdek belge var
            </div>
          )}
        </div>

        {!summary.completeRequiredSet ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.missingRequiredTypes.map((type) => (
              <span
                key={type}
                className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300"
              >
                {getProductDocumentTypeLabel(type)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}