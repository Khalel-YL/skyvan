type RuleFiltersProps = {
  query: string;
  ruleType: string;
  severity: string;
};

const selectClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-700";

export function RuleFilters({
  query,
  ruleType,
  severity,
}: RuleFiltersProps) {
  return (
    <form
      action="/admin/rules"
      className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5"
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-100">Filtreler</h2>
          <p className="text-sm text-zinc-400">
            Kuralları ürün, tip ve şiddet bilgisine göre daralt.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Kural ara</label>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Ürün adı, slug veya mesaj..."
              className={selectClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Kural tipi</label>
            <select
              name="ruleType"
              defaultValue={ruleType}
              className={selectClassName}
            >
              <option value="all">Tümü</option>
              <option value="requires">Requires</option>
              <option value="excludes">Excludes</option>
              <option value="recommends">Recommends</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Şiddet</label>
            <select
              name="severity"
              defaultValue={severity}
              className={selectClassName}
            >
              <option value="all">Tümü</option>
              <option value="hard_block">Hard Block</option>
              <option value="soft_warning">Soft Warning</option>
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
              href="/admin/rules"
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