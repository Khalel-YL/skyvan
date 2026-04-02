import Link from "next/link";

import {
  manufacturerSourceStatusOptions,
  manufacturerSourceTypeOptions,
  type ManufacturerSourceRegistryFilterStatus,
  type ManufacturerSourceRegistryFilterType,
} from "./types";

type ManufacturerSourceFiltersProps = {
  q: string;
  status: ManufacturerSourceRegistryFilterStatus;
  type: ManufacturerSourceRegistryFilterType;
};

function buildHref(params: {
  q: string;
  status: ManufacturerSourceRegistryFilterStatus;
  type: ManufacturerSourceRegistryFilterType;
}) {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params.type !== "all") {
    searchParams.set("type", params.type);
  }

  const query = searchParams.toString();

  return query
    ? `/admin/manufacturer-sources?${query}`
    : "/admin/manufacturer-sources";
}

export function ManufacturerSourceFilters({
  q,
  status,
  type,
}: ManufacturerSourceFiltersProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4">
        <form
          action="/admin/manufacturer-sources"
          className="flex flex-col gap-3 lg:flex-row"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Üretici adı veya domain ara"
            className="h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35"
          />

          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="type" value={type} />

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Uygula
          </button>

          <Link
            href="/admin/manufacturer-sources"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white"
          >
            Sıfırla
          </Link>
        </form>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {manufacturerSourceStatusOptions.map((option) => {
              const active = status === option.value;

              return (
                <Link
                  key={option.value}
                  href={buildHref({ q, status: option.value, type })}
                  className={[
                    "inline-flex h-10 items-center rounded-2xl border px-4 text-sm transition",
                    active
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {manufacturerSourceTypeOptions.map((option) => {
              const active = type === option.value;

              return (
                <Link
                  key={option.value}
                  href={buildHref({ q, status, type: option.value })}
                  className={[
                    "inline-flex h-10 items-center rounded-2xl border px-4 text-sm transition",
                    active
                      ? "border-white/20 bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white",
                  ].join(" ")}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}