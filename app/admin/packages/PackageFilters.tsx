import Link from "next/link";

import type { AvailableModelOption, PackageFilterView } from "./types";

type PackageFiltersProps = {
  query: string;
  modelId: string;
  view: PackageFilterView;
  availableModels: AvailableModelOption[];
};

function segmentClass(active: boolean) {
  return active
    ? "border-zinc-200 bg-zinc-100 text-zinc-900"
    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100";
}

export function PackageFilters({
  query,
  modelId,
  view,
  availableModels,
}: PackageFiltersProps) {
  return (
    <form
      action="/admin/packages"
      className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3"
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_240px_auto] xl:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Paket ara</label>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Paket adı veya kod..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Model</label>
          <select
            name="modelId"
            defaultValue={modelId}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-700"
          >
            <option value="">Tüm modeller</option>
            <option value="none">Bağımsız paketler</option>
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.slug}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
          <button
            type="submit"
            name="view"
            value="all"
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${segmentClass(
              view === "all",
            )}`}
          >
            Tümü
          </button>

          <button
            type="submit"
            name="view"
            value="default"
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${segmentClass(
              view === "default",
            )}`}
          >
            Varsayılan
          </button>

          <button
            type="submit"
            name="view"
            value="custom"
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${segmentClass(
              view === "custom",
            )}`}
          >
            Standart
          </button>
          </div>

            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white"
            >
              Uygula
            </button>

            <Link
              href="/admin/packages"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              Sıfırla
            </Link>
        </div>
      </div>
    </form>
  );
}
