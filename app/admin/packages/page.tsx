import { asc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { models, packages } from "@/db/schema";

import AddPackageDrawer from "./AddPackageDrawer";
import { PackageFilters } from "./PackageFilters";
import { PackagesList } from "./PackagesList";
import { PackagesSummary } from "./PackagesSummary";
import type {
  AvailableModelOption,
  PackageFilterView,
  PackageListItem,
} from "./types";

type PackagesPageProps = {
  searchParams?: Promise<{
    q?: string;
    modelId?: string;
    view?: string;
    saved?: string;
    created?: string;
    updated?: string;
    defaultRebalanced?: string;
    packageAction?: string;
    packageCode?: string;
  }>;
};

async function getModelsSafely(): Promise<AvailableModelOption[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: models.id,
        slug: models.slug,
      })
      .from(models)
      .orderBy(asc(models.slug));

    return rows;
  } catch (error) {
    console.error("Packages models fetch error:", error);
    return [];
  }
}

async function getPackagesSafely(): Promise<PackageListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: packages.id,
        modelId: packages.modelId,
        modelSlug: models.slug,
        name: packages.name,
        slug: packages.slug,
        tierLevel: packages.tierLevel,
        isDefault: packages.isDefault,
        createdAt: packages.createdAt,
      })
      .from(packages)
      .leftJoin(models, eq(packages.modelId, models.id));

    return rows.sort((a, b) => {
      const scopeA = a.modelSlug ?? "~~~~independent";
      const scopeB = b.modelSlug ?? "~~~~independent";
      const scopeDiff = scopeA.localeCompare(scopeB, "tr");

      if (scopeDiff !== 0) {
        return scopeDiff;
      }

      if (a.isDefault !== b.isDefault) {
        return a.isDefault ? -1 : 1;
      }

      const tierA = a.tierLevel ?? 0;
      const tierB = b.tierLevel ?? 0;

      if (tierA !== tierB) {
        return tierA - tierB;
      }

      return a.name.localeCompare(b.name, "tr");
    });
  } catch (error) {
    console.error("Packages fetch error:", error);
    return [];
  }
}

function getView(value?: string): PackageFilterView {
  if (value === "default" || value === "custom") {
    return value;
  }

  return "all";
}

function getFlashMessage(params: Awaited<PackagesPageProps["searchParams"]>) {
  if (params?.saved && params?.created) {
    if (params.defaultRebalanced) {
      return `Paket kaydı oluşturuldu. Kullanılan kod: ${params.created}. Aynı kapsam içindeki varsayılan paket dengesi güncellendi.`;
    }

    return `Paket kaydı oluşturuldu. Kullanılan kod: ${params.created}`;
  }

  if (params?.saved && params?.updated) {
    if (params.defaultRebalanced) {
      return `Paket kaydı güncellendi: ${params.updated}. Aynı kapsam içindeki varsayılan paket dengesi güncellendi.`;
    }

    return `Paket kaydı güncellendi: ${params.updated}`;
  }

  if (params?.packageAction === "deleted") {
    return "Paket kaydı kaldırıldı.";
  }

  if (params?.packageAction === "error") {
    switch (params.packageCode) {
      case "invalid-id":
        return "Geçersiz paket işlemi isteği alındı.";
      case "in-use":
        return "Bu paket kullanımda olduğu için kaldırılamaz.";
      case "delete-failed":
        return "Paket kaldırılırken beklenmeyen bir hata oluştu.";
      default:
        return "Paket işlemi sırasında beklenmeyen bir hata oluştu.";
    }
  }

  return null;
}

export default async function PackagesPage({
  searchParams,
}: PackagesPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);

  const availableModels = await getModelsSafely();
  const allPackages = await getPackagesSafely();

  const query = (params.q ?? "").trim().toLowerCase();
  const modelId = (params.modelId ?? "").trim();
  const view = getView(params.view);

  const filteredPackages = allPackages.filter((item) => {
    const matchesQuery = query
      ? item.name.toLowerCase().includes(query) ||
        item.slug.toLowerCase().includes(query) ||
        (item.modelSlug ?? "").toLowerCase().includes(query)
      : true;

    const matchesModel =
      !modelId
        ? true
        : modelId === "none"
          ? item.modelId === null
          : item.modelId === modelId;

    const matchesView =
      view === "all"
        ? true
        : view === "default"
          ? item.isDefault
          : !item.isDefault;

    return matchesQuery && matchesModel && matchesView;
  });

  const stats = filteredPackages.reduce(
    (acc, item) => {
      acc.total += 1;

      if (item.isDefault) {
        acc.defaultCount += 1;
      } else {
        acc.customCount += 1;
      }

      if (item.modelId) {
        acc.linkedCount += 1;
      }

      return acc;
    },
    {
      total: 0,
      defaultCount: 0,
      customCount: 0,
      linkedCount: 0,
    },
  );

  const flashMessage = getFlashMessage(params);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Paket Omurgası
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Paketler
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              Modele bağlı veya bağımsız paketleri, varsayılan seçimleri ve
              seviye yapısını tek ekranda yönet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AddPackageDrawer
            availableModels={availableModels}
            disabled={!databaseReady}
          />
        </div>
      </div>

      {!databaseReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
          Veritabanı yapılandırılmadığı için kayıt işlemleri pasif durumda.
        </div>
      ) : null}

      {flashMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {flashMessage}
        </div>
      ) : null}

      <PackagesSummary
        total={stats.total}
        defaultCount={stats.defaultCount}
        customCount={stats.customCount}
        linkedCount={stats.linkedCount}
        currentView={view}
      />

      <PackageFilters
        query={params.q ?? ""}
        modelId={modelId}
        view={view}
        availableModels={availableModels}
      />

      <PackagesList
        packages={filteredPackages}
        availableModels={availableModels}
        databaseReady={databaseReady}
      />
    </div>
  );
}
