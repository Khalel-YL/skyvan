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
      className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-100">Filtreler</h2>
          <p className="text-sm text-zinc-400">
            Paket kayıtlarını görünüm, model ve metne göre daralt.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="view"
            value="all"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${segmentClass(
              view === "all",
            )}`}
          >
            Tümü
          </button>

          <button
            type="submit"
            name="view"
            value="default"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${segmentClass(
              view === "default",
            )}`}
          >
            Varsayılan
          </button>

          <button
            type="submit"
            name="view"
            value="custom"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${segmentClass(
              view === "custom",
            )}`}
          >
            Standart
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Paket ara</label>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Paket adı veya kod..."
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Model</label>
            <select
              name="modelId"
              defaultValue={modelId}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-700"
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

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white"
            >
              Uygula
            </button>

            <a
              href="/admin/packages"
              className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
            >
              Sıfırla
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}