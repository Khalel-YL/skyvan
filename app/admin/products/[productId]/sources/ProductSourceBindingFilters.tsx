import Link from "next/link";

import type { ProductSourceBindingFilterStatus } from "./types";

type Props = {
  basePath: string;
  q: string;
  status: ProductSourceBindingFilterStatus;
};

export function ProductSourceBindingFilters({ basePath, q, status }: Props) {
  return (
    <form
      action={basePath}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="grid flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Arama
          </label>
          <input
            name="q"
            defaultValue={q}
            placeholder="manufacturer, domain, path hint, not..."
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Durum
          </label>
          <select
            name="status"
            defaultValue={status}
            className="h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-700"
          >
            <option value="active">Aktif</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşiv</option>
            <option value="all">Tümü</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-2xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
        >
          Uygula
        </button>

        <Link
          href={basePath}
          className="inline-flex h-11 items-center rounded-2xl border border-zinc-800 bg-zinc-950 px-4 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
        >
          Sıfırla
        </Link>
      </div>
    </form>
  );
}