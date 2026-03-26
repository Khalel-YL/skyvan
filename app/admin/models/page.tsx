import { db } from "@/db/db";
import { models } from "@/db/schema";
import AddModelDrawer from "./AddModelDrawer";
import { ModelFilters } from "./ModelFilters";
import { ModelsList } from "./ModelsList";
import { ModelsSummary } from "./ModelsSummary";
import type { ModelListItem, ModelStatus } from "./types";

type ModelsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
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

export default async function ModelsPage({
  searchParams,
}: ModelsPageProps) {
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
    const matchesQuery = query
      ? model.slug.toLowerCase().includes(query)
      : true;

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
    }
  );

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