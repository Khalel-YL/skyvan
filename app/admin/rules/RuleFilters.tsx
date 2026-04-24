type RuleFiltersProps = {
  query: string;
  ruleType: string;
  severity: string;
  scope: string;
};

const inputClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700";

const selectClassName =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-700";

export function RuleFilters({
  query,
  ruleType,
  severity,
  scope,
}: RuleFiltersProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Filtreler</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Kuralları ürün, tip, şiddet ve kapsam bilgisine göre daralt.
        </p>
      </div>

      <form className="mt-5 space-y-3">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Kaynak, hedef, açıklama veya koşul ara"
            className={inputClassName}
          />

          <select
            name="ruleType"
            defaultValue={ruleType}
            className={selectClassName}
          >
            <option value="all">Tüm tipler</option>
            <option value="requires">Zorunlu</option>
            <option value="excludes">Engeller</option>
            <option value="recommends">Önerir</option>
          </select>

          <select
            name="severity"
            defaultValue={severity}
            className={selectClassName}
          >
            <option value="all">Tüm şiddetler</option>
            <option value="hard_block">Sert blok</option>
            <option value="soft_warning">Yumuşak uyarı</option>
          </select>

          <select
            name="scope"
            defaultValue={scope}
            className={selectClassName}
          >
            <option value="all">Tüm kapsamlar</option>
            <option value="global">Global</option>
            <option value="conditional">Koşullu</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-600"
          >
            Uygula
          </button>

          <a
            href="/admin/rules"
            className="rounded-2xl border border-zinc-800 bg-transparent px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
          >
            Sıfırla
          </a>
        </div>
      </form>
    </section>
  );
}