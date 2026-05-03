import AddPackageDrawer from "./AddPackageDrawer";
import DeletePackageButton from "./DeletePackageButton";
import type { AvailableModelOption, PackageListItem } from "./types";

type PackagesListProps = {
  packages: PackageListItem[];
  availableModels: AvailableModelOption[];
  databaseReady: boolean;
};

function shortenLabel(value: string) {
  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(0, 14)}...${value.slice(-4)}`;
}

function chip(label: string, title?: string) {
  return (
    <span
      title={title}
      className="inline-flex max-w-full rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300"
    >
      {label}
    </span>
  );
}

export function PackagesList({
  packages,
  availableModels,
  databaseReady,
}: PackagesListProps) {
  if (packages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-zinc-100">
          Kayıt bulunamadı
        </h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Filtre sonucu eşleşen paket yok. Yeni paket ekleyebilir ya da filtreleri
          temizleyebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {packages.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 transition hover:border-zinc-700"
        >
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="break-words text-base font-semibold tracking-tight text-zinc-100">
                  {item.name}
                </h3>

                {item.isDefault ? (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-100">
                    Varsayılan
                  </span>
                ) : (
                  <span className="rounded-full border border-zinc-700 bg-zinc-800/70 px-2 py-0.5 text-xs font-medium text-zinc-300">
                    Standart
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {chip(`Kod ${shortenLabel(item.slug)}`, item.slug)}
                {chip(`Seviye ${item.tierLevel ?? 0}`)}
                {chip(
                  item.modelSlug
                    ? `Model ${shortenLabel(item.modelSlug)}`
                    : "Bağımsız paket",
                  item.modelSlug ?? undefined,
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <AddPackageDrawer
                initialData={item}
                availableModels={availableModels}
                disabled={!databaseReady}
              />
              <DeletePackageButton id={item.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
