import { db } from "@/db/db";
import { models } from "@/db/schema";

import AddModelDrawer from "./AddModelDrawer";
import { ModelFilters } from "./ModelFilters";
import { ModelsList } from "./ModelsList";
import { ModelsSummary } from "./ModelsSummary";
import { OfficialVehicleImportCard } from "./OfficialVehicleImportCard";
import type { ModelListItem, ModelStatus } from "./types";

type ModelsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    saved?: string;
    deleted?: string;
    created?: string;
    updated?: string;
    importStatus?: string;
    importCode?: string;
    batch?: string;
    imported?: string;
    skipped?: string;
    modelAction?: string;
    modelCode?: string;
  }>;
};

async function getModelsSafely(): Promise<ModelListItem[]> {
  if (!db) {
    return [];
  }

  try {
    const rows = await db
      .select({
        id: models.id,
        slug: models.slug,
        baseWeightKg: models.baseWeightKg,
        maxPayloadKg: models.maxPayloadKg,
        wheelbaseMm: models.wheelbaseMm,
        roofLengthMm: models.roofLengthMm,
        roofWidthMm: models.roofWidthMm,
        status: models.status,
      })
      .from(models);

    return rows.sort((a, b) => {
      const order: Record<ModelStatus, number> = {
        active: 0,
        draft: 1,
        archived: 2,
      };

      const statusDiff = order[a.status] - order[b.status];
      if (statusDiff !== 0) return statusDiff;

      return a.slug.localeCompare(b.slug, "tr");
    });
  } catch (error) {
    console.error("Models fetch error:", error);
    return [];
  }
}

function getFlashMessage(params: Awaited<ModelsPageProps["searchParams"]>) {
  if (params?.saved && params?.created) {
    return `Model kaydı oluşturuldu. Kullanılan kod: ${params.created}`;
  }

  if (params?.saved && params?.updated) {
    return `Model kaydı güncellendi: ${params.updated}`;
  }

  if (params?.modelAction === "archived") {
    return "Model kaydı arşive alındı.";
  }

  if (params?.modelAction === "restored") {
    return "Model kaydı yeniden aktife alındı.";
  }

  if (params?.modelAction === "error") {
    switch (params.modelCode) {
      case "invalid-id":
        return "Geçersiz model işlemi isteği alındı.";
      case "archive-failed":
        return "Model arşivlenirken beklenmeyen bir hata oluştu.";
      case "restore-failed":
        return "Model geri alınırken beklenmeyen bir hata oluştu.";
      default:
        return "Model işlemi sırasında beklenmeyen bir hata oluştu.";
    }
  }

  if (params?.deleted) {
    return "Model kaydı silindi.";
  }

  return null;
}

function getBatchLabel(batch?: string) {
  switch (batch) {
    case "large-van-core":
      return "Core Large Van Batch";
    case "ducato-class":
      return "Ducato Sınıfı";
    case "transit-class":
      return "Transit Sınıfı";
    case "sprinter-class":
      return "Sprinter Sınıfı";
    case "master-class":
      return "Master Sınıfı";
    case "crafter-class":
      return "Crafter Sınıfı";
    case "daily-class":
      return "Daily Sınıfı";
    default:
      return "Seçilen batch";
  }
}

function getImportFeedback(params: Awaited<ModelsPageProps["searchParams"]>) {
  if (!params?.importStatus) {
    return null;
  }

  if (params.importStatus === "success") {
    const imported = Number.parseInt(params.imported ?? "0", 10);
    const skipped = Number.parseInt(params.skipped ?? "0", 10);
    const batchLabel = getBatchLabel(params.batch);

    return {
      type: "success" as const,
      message: `${batchLabel} tamamlandı. ${imported} yeni model eklendi, ${skipped} kayıt zaten mevcut olduğu için atlandı.`,
    };
  }

  if (params.importStatus === "error") {
    switch (params.importCode) {
      case "invalid-batch":
        return {
          type: "error" as const,
          message: "Geçersiz import batch isteği alındı.",
        };
      case "empty-batch":
        return {
          type: "error" as const,
          message: "Seçilen batch içinde import edilecek kayıt bulunamadı.",
        };
      default:
        return {
          type: "error" as const,
          message: "Vehicle seed import sırasında beklenmeyen bir hata oluştu.",
        };
    }
  }

  return null;
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = (await searchParams) ?? {};
  const databaseReady = Boolean(db);

  const allModels = await getModelsSafely();

  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter =
    params.status === "active" ||
    params.status === "draft" ||
    params.status === "archived"
      ? params.status
      : "all";

  const filteredModels = allModels.filter((model) => {
    const matchesQuery = query ? model.slug.toLowerCase().includes(query) : true;
    const matchesStatus =
      statusFilter === "all" ? true : model.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const stats = filteredModels.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "active") acc.active += 1;
      if (item.status === "draft") acc.draft += 1;
      if (item.status === "archived") acc.archived += 1;
      return acc;
    },
    {
      total: 0,
      active: 0,
      draft: 0,
      archived: 0,
    },
  );

  const flashMessage = getFlashMessage(params);
  const importFeedback = getImportFeedback(params);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Models
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
              Araç Modelleri
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
              Şasi, taşıma kapasitesi ve görünür yüzey ölçülerini yöneten çekirdek
              model omurgası.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AddModelDrawer disabled={!databaseReady} />
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

      <OfficialVehicleImportCard
        disabled={!databaseReady}
        feedback={importFeedback}
      />

      <ModelsSummary
        total={stats.total}
        active={stats.active}
        draft={stats.draft}
        archived={stats.archived}
        currentStatus={statusFilter}
      />

      <ModelFilters />

      <ModelsList models={filteredModels} databaseReady={databaseReady} />
    </div>
  );
}