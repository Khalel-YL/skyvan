import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  Boxes,
  CircleDashed,
  Layers3,
  Plus,
  Search,
  Waypoints,
} from "lucide-react";

import { db } from "@/db/db";
import { builds, buildVersions, models, packages } from "@/db/schema";
import { PageHeader } from "../_components/page-header";
import { AddBuildVersionDrawer } from "./AddBuildVersionDrawer";
import { BuildCurrentVersionButton } from "./set-current-version-button";

type SearchParams = Promise<{
  q?: string;
  modelId?: string;
  health?: string;
  new?: string;
  buildId?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

type BuildRow = {
  id: string;
  shortCode: string;
  modelId: string;
  modelSlug: string | null;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  updatedAt: Date | string | null;
};

type VersionRow = {
  id: string;
  buildId: string | null;
  packageId: string | null;
  versionNumber: number;
  createdAt: Date | string | null;
  buildShortCode: string | null;
  currentVersionId: string | null;
  modelId: string | null;
  modelSlug: string | null;
  packageName: string | null;
  packageSlug: string | null;
};

function buildHaystack(item: VersionRow) {
  return [
    item.buildShortCode ?? "",
    item.modelSlug ?? "",
    item.packageName ?? "",
    item.packageSlug ?? "",
    `v${item.versionNumber}`,
  ]
    .join(" ")
    .toLowerCase();
}

export default async function BuildVersionsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const selectedModelId =
    typeof params.modelId === "string" ? params.modelId.trim() : "";
  const selectedHealth =
    typeof params.health === "string" ? params.health.trim() : "";
  const isDrawerOpen = params.new === "true";
  const initialBuildId =
    typeof params.buildId === "string" ? params.buildId.trim() : "";

  if (!db) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin · Build Versions"
          title="Build Versions"
          description="Veritabanı yapılandırılmadığı için build version işlemleri şu an pasif durumda."
        />

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400">
          DATABASE_URL tanımlı olmadığı için bu modül güvenli statik modda çalışıyor.
        </div>
      </div>
    );
  }

  const [modelRows, packageRows, buildRows, versionRows] = await Promise.all([
    db
      .select({
        id: models.id,
        slug: models.slug,
        status: models.status,
      })
      .from(models)
      .orderBy(models.slug),

    db
      .select({
        id: packages.id,
        name: packages.name,
        slug: packages.slug,
        modelId: packages.modelId,
        modelSlug: models.slug,
      })
      .from(packages)
      .leftJoin(models, eq(packages.modelId, models.id))
      .orderBy(packages.name),

    db
      .select({
        id: builds.id,
        shortCode: builds.shortCode,
        modelId: builds.modelId,
        modelSlug: models.slug,
        currentVersionId: builds.currentVersionId,
        currentVersionNumber: buildVersions.versionNumber,
        updatedAt: builds.updatedAt,
      })
      .from(builds)
      .leftJoin(models, eq(builds.modelId, models.id))
      .leftJoin(buildVersions, eq(builds.currentVersionId, buildVersions.id))
      .orderBy(desc(builds.updatedAt)),

    db
      .select({
        id: buildVersions.id,
        buildId: buildVersions.buildId,
        packageId: buildVersions.packageId,
        versionNumber: buildVersions.versionNumber,
        createdAt: buildVersions.createdAt,
        buildShortCode: builds.shortCode,
        currentVersionId: builds.currentVersionId,
        modelId: builds.modelId,
        modelSlug: models.slug,
        packageName: packages.name,
        packageSlug: packages.slug,
      })
      .from(buildVersions)
      .leftJoin(builds, eq(buildVersions.buildId, builds.id))
      .leftJoin(models, eq(builds.modelId, models.id))
      .leftJoin(packages, eq(buildVersions.packageId, packages.id))
      .orderBy(desc(buildVersions.createdAt)),
  ]);

  const versionsByBuildId = new Map<string, VersionRow[]>();

  for (const version of versionRows) {
    if (!version.buildId) continue;

    const group = versionsByBuildId.get(version.buildId) ?? [];
    group.push(version);
    versionsByBuildId.set(version.buildId, group);
  }

  const filteredBuildRows = (buildRows as BuildRow[]).filter((buildRow) => {
    const matchesModel = selectedModelId
      ? buildRow.modelId === selectedModelId
      : true;

    const relatedVersions = versionsByBuildId.get(buildRow.id) ?? [];
    const hasCurrentVersion = Boolean(buildRow.currentVersionId);

    const matchesHealth =
      selectedHealth === "missing_current"
        ? !hasCurrentVersion
        : selectedHealth === "healthy"
        ? hasCurrentVersion
        : true;

    const haystack = [
      buildRow.shortCode,
      buildRow.modelSlug ?? "",
      ...relatedVersions.map((item) => buildHaystack(item)),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = q ? haystack.includes(q) : true;

    return matchesModel && matchesHealth && matchesQuery;
  });

  const filteredVersions = (versionRows as VersionRow[]).filter((item) => {
    const matchesModel = selectedModelId ? item.modelId === selectedModelId : true;
    const matchesQuery = q ? buildHaystack(item).includes(q) : true;

    return matchesModel && matchesQuery;
  });

  const totalBuilds = buildRows.length;
  const totalVersions = versionRows.length;
  const currentLinkedCount = buildRows.filter((item) => item.currentVersionId).length;
  const missingCurrentCount = buildRows.filter((item) => !item.currentVersionId).length;

  const modelOptions = modelRows.map((row) => ({
    id: row.id,
    label: `${row.slug}${row.status !== "active" ? ` (${row.status})` : ""}`,
  }));

  const buildOptions = (buildRows as BuildRow[]).map((row) => ({
    id: row.id,
    label: `${row.shortCode} · ${row.modelSlug ?? "model yok"}`,
    meta: [
      row.currentVersionNumber
        ? `Current: v${row.currentVersionNumber}`
        : "Current version bağlı değil",
      `Toplam version: ${(versionsByBuildId.get(row.id) ?? []).length}`,
      row.updatedAt ? `Güncelleme: ${formatDate(row.updatedAt)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    modelId: row.modelId,
  }));

  const packageOptions = packageRows.map((row) => ({
    id: row.id,
    label: `${row.name} (${row.slug})`,
    meta: row.modelSlug
      ? `Modele bağlı paket: ${row.modelSlug}`
      : "Global paket",
    modelId: row.modelId,
  }));

  const hasModels = modelRows.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Build Versions"
        title="Build Versions"
        description="Lead hattını açan gerçek dependency omurgası burada yönetilir. Build, version ve current bağları operasyonel olarak bu modülde korunur."
        actions={
          hasModels ? (
            <Link
              href="/admin/build-versions?new=true"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              Yeni build version
            </Link>
          ) : (
            <Link
              href="/admin/models"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Önce model oluştur
            </Link>
          )
        }
      />

      {!hasModels ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Build oluşturmak için önce en az bir model kaydı gerekli.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="text-sm text-zinc-400">Toplam build</div>
          <div className="mt-3 text-3xl font-semibold text-white">{totalBuilds}</div>
          <div className="mt-2 text-xs text-zinc-500">Build ana kayıt omurgası</div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="text-sm text-zinc-400">Toplam version</div>
          <div className="mt-3 text-3xl font-semibold text-white">{totalVersions}</div>
          <div className="mt-2 text-xs text-zinc-500">
            Lead bağı için kullanılabilir version havuzu
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="text-sm text-zinc-400">Current version bağlı</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {currentLinkedCount}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            currentVersionId dolu build kayıtları
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-5">
          <div className="text-sm text-zinc-400">Eksik current bağ</div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {missingCurrentCount}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            Takip edilmesi gereken teknik boşluk
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <form className="grid gap-3 xl:grid-cols-[1.4fr_0.9fr_0.9fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Build kodu, model, paket veya version ara"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-11 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>

          <select
            name="modelId"
            defaultValue={selectedModelId}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
          >
            <option value="">Tüm modeller</option>
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            name="health"
            defaultValue={selectedHealth}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
          >
            <option value="">Tüm sağlık durumları</option>
            <option value="healthy">Current bağlı</option>
            <option value="missing_current">Current bağı eksik</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Uygula
            </button>

            <Link
              href="/admin/build-versions"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </div>
        </form>
      </div>

      {filteredBuildRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
            <CircleDashed className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-base font-medium text-white">
            Filtreye uygun build kaydı bulunamadı
          </h3>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Build ve version omurgası boşsa Leads tarafı doğal şekilde kilitli kalır.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Build</th>
                  <th className="px-5 py-4 font-medium">Model</th>
                  <th className="px-5 py-4 font-medium">Toplam version</th>
                  <th className="px-5 py-4 font-medium">Current version</th>
                  <th className="px-5 py-4 font-medium">Durum</th>
                  <th className="px-5 py-4 font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredBuildRows.map((item) => {
                  const buildVersionsList = versionsByBuildId.get(item.id) ?? [];
                  const hasCurrent = Boolean(item.currentVersionId);

                  return (
                    <tr key={item.id} className="border-b border-zinc-900 last:border-b-0">
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400">
                            <Waypoints className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{item.shortCode}</div>
                            <div className="mt-1 text-xs text-zinc-500">
                              Build ID: {item.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400">
                            <Layers3 className="h-4 w-4" />
                          </div>
                          <div className="text-zinc-300">{item.modelSlug ?? "Model yok"}</div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-300">
                        {buildVersionsList.length}
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-white">
                          {item.currentVersionNumber ? `v${item.currentVersionNumber}` : "—"}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Son güncelleme: {formatDate(item.updatedAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            hasCurrent
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {hasCurrent ? "Sağlıklı" : "Current bağı eksik"}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/build-versions?new=true&buildId=${item.id}`}
                            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                          >
                            Yeni version
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredVersions.length === 0 ? null : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
          <div className="border-b border-zinc-800 px-5 py-4">
            <div className="text-sm font-medium text-white">Recent versions</div>
            <div className="mt-1 text-xs text-zinc-500">
              Mevcut version kayıtları ve current bağ operasyonu
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Build</th>
                  <th className="px-5 py-4 font-medium">Version</th>
                  <th className="px-5 py-4 font-medium">Paket</th>
                  <th className="px-5 py-4 font-medium">Current bağ</th>
                  <th className="px-5 py-4 font-medium">Tarih</th>
                  <th className="px-5 py-4 font-medium">İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredVersions.map((item) => {
                  const isCurrent = item.currentVersionId === item.id;

                  return (
                    <tr key={item.id} className="border-b border-zinc-900 last:border-b-0">
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-white">
                          {item.buildShortCode ?? "BUILD"}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.modelSlug ?? "Model yok"}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-white">v{item.versionNumber}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Version ID: {item.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400">
                            <Boxes className="h-4 w-4" />
                          </div>
                          <div className="text-zinc-300">
                            {item.packageName ?? "Paket yok"}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            isCurrent
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                              : "border-zinc-800 bg-zinc-900 text-zinc-400"
                          }`}
                        >
                          {isCurrent ? "Current version" : "Pasif version"}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-top text-zinc-400">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4 align-top">
                        {item.buildId ? (
                          <BuildCurrentVersionButton
                            buildId={item.buildId}
                            versionId={item.id}
                            isCurrent={isCurrent}
                          />
                        ) : (
                          <span className="text-xs text-zinc-500">İşlem yok</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isDrawerOpen ? (
        <AddBuildVersionDrawer
          buildOptions={buildOptions}
          modelOptions={modelOptions}
          packageOptions={packageOptions}
          initialBuildId={initialBuildId}
        />
      ) : null}
    </div>
  );
}