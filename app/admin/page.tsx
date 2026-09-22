import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Blocks,
  Bot,
  Boxes,
  CheckCircle2,
  FileDigit,
  FileWarning,
  Package,
  Settings2,
  Truck,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { count, eq } from "drizzle-orm";
import { type AnyPgColumn, type AnyPgTable } from "drizzle-orm/pg-core";

import { PageHeader } from "./_components/page-header";
import { StatCard } from "./_components/stat-card";

import { getAuditRuntimeValidation } from "@/app/lib/admin/audit";
import { getGovernanceRuntime } from "@/app/lib/admin/governance";
import { db, getDatabaseHealth } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
  buildVersions,
  categories,
  compatibilityRules,
  leads,
  models,
  offers,
  packages,
  products,
} from "@/db/schema";

type DashboardMetrics = {
  modelsTotal: number;
  modelsDraft: number;
  modelsArchived: number;
  categoriesTotal: number;
  categoriesDraft: number;
  categoriesArchived: number;
  productsTotal: number;
  productsDraft: number;
  productsArchived: number;
  packagesTotal: number;
  leadsTotal: number;
  offersTotal: number;
  buildVersionsTotal: number;
  rulesTotal: number;
  datasheetsTotal: number;
  datasheetsPending: number;
  datasheetsProcessing: number;
  datasheetsFailed: number;
  datasheetsReady: number;
  datasheetsCompletedNoChunks: number;
  knowledgePendingReview: number;
  knowledgeApproved: number;
  knowledgeRejected: number;
  knowledgeRevoked: number;
};

type QuickLink = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type RadarItem = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "danger" | "warning" | "info" | "success";
  icon: LucideIcon;
};

const quickLinks: QuickLink[] = [
  {
    title: "Build versiyonları",
    description: "Lead hattının gerçek ön koşulu",
    href: "/admin/build-versions",
    icon: Waypoints,
  },
  {
    title: "Datasheet Merkezi",
    description: "Teknik belge ve onay akışı",
    href: "/admin/datasheets",
    icon: FileDigit,
  },
  {
    title: "Araç Modelleri",
    description: "Şasi ve temel ölçü omurgası",
    href: "/admin/models",
    icon: Truck,
  },
  {
    title: "Ürünler",
    description: "Parça ve donanım havuzu",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Paketler",
    description: "Hazır konfigürasyon setleri",
    href: "/admin/packages",
    icon: Boxes,
  },
  {
    title: "Kategoriler",
    description: "Ürün sınıflandırma ağacı",
    href: "/admin/categories",
    icon: Blocks,
  },
];

async function countTable(table: AnyPgTable) {
  if (!db) {
    return 0;
  }

  const rows = await db.select({ value: count() }).from(table);
  return Number(rows[0]?.value ?? 0);
}

async function countWhere(table: AnyPgTable, column: AnyPgColumn, value: string) {
  if (!db) {
    return 0;
  }

  const rows = await db
    .select({ value: count() })
    .from(table)
    .where(eq(column, value));

  return Number(rows[0]?.value ?? 0);
}

async function getDashboardMetrics(): Promise<DashboardMetrics | null> {
  if (!db) {
    return null;
  }

  try {
    const [
      modelsTotal,
      modelsDraft,
      modelsArchived,
      categoriesTotal,
      categoriesDraft,
      categoriesArchived,
      productsTotal,
      productsDraft,
      productsArchived,
      packagesTotal,
      leadsTotal,
      offersTotal,
      buildVersionsTotal,
      rulesTotal,
      datasheetsTotal,
      datasheetsPending,
      datasheetsProcessing,
      datasheetsFailed,
      knowledgePendingReview,
      knowledgeApproved,
      knowledgeRejected,
      knowledgeRevoked,
      documents,
      chunkRows,
    ] = await Promise.all([
      countTable(models),
      countWhere(models, models.status, "draft"),
      countWhere(models, models.status, "archived"),
      countTable(categories),
      countWhere(categories, categories.status, "draft"),
      countWhere(categories, categories.status, "archived"),
      countTable(products),
      countWhere(products, products.status, "draft"),
      countWhere(products, products.status, "archived"),
      countTable(packages),
      countTable(leads),
      countTable(offers),
      countTable(buildVersions),
      countTable(compatibilityRules),
      countTable(aiKnowledgeDocuments),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.parsingStatus, "pending"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.parsingStatus, "processing"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.parsingStatus, "failed"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.approvalStatus, "pending_review"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.approvalStatus, "approved"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.approvalStatus, "rejected"),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.approvalStatus, "revoked"),
      db
        .select({
          id: aiKnowledgeDocuments.id,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
        })
        .from(aiKnowledgeDocuments),
      db
        .select({
          documentId: aiDocumentChunks.documentId,
          chunkCount: count(),
        })
        .from(aiDocumentChunks)
        .groupBy(aiDocumentChunks.documentId),
    ]);

    const chunkMap = new Map(
      chunkRows.map((row) => [row.documentId, Number(row.chunkCount ?? 0)]),
    );

    let datasheetsReady = 0;
    let datasheetsCompletedNoChunks = 0;

    for (const document of documents) {
      const chunkCount = chunkMap.get(document.id) ?? 0;
      const isCompleted = document.parsingStatus === "completed";

      if (isCompleted && chunkCount > 0) {
        datasheetsReady += 1;
      }

      if (isCompleted && chunkCount === 0) {
        datasheetsCompletedNoChunks += 1;
      }
    }

    return {
      modelsTotal,
      modelsDraft,
      modelsArchived,
      categoriesTotal,
      categoriesDraft,
      categoriesArchived,
      productsTotal,
      productsDraft,
      productsArchived,
      packagesTotal,
      leadsTotal,
      offersTotal,
      buildVersionsTotal,
      rulesTotal,
      datasheetsTotal,
      datasheetsPending,
      datasheetsProcessing,
      datasheetsFailed,
      datasheetsReady,
      datasheetsCompletedNoChunks,
      knowledgePendingReview,
      knowledgeApproved,
      knowledgeRejected,
      knowledgeRevoked,
    };
  } catch (error) {
    console.warn("Admin dashboard metrics warning:", error);
    return null;
  }
}

function getToneClasses(tone: RadarItem["tone"]) {
  switch (tone) {
    case "danger":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "warning":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "info":
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
  }
}

export default async function AdminDashboardPage() {
  const metrics = await getDashboardMetrics();
  const databaseHealth = getDatabaseHealth();
  const auditRuntime = await getAuditRuntimeValidation();
  const governanceRuntime = getGovernanceRuntime();
  const openOverrideCount = [
    governanceRuntime.allowDirectPublishWithoutSeo,
    governanceRuntime.allowCriticalOfferStatusTransitions,
    governanceRuntime.allowManualAiReadyStatus,
  ].filter(Boolean).length;
  const governanceReady =
    databaseHealth.status === "online" &&
    auditRuntime.closureState === "ready" &&
    openOverrideCount === 0;

  const statCards = metrics
    ? [
        { label: "Modeller", value: metrics.modelsTotal, hint: "Araç omurgası" },
        { label: "Kategoriler", value: metrics.categoriesTotal, hint: "Sınıflandırma ağacı" },
        { label: "Ürünler", value: metrics.productsTotal, hint: "Donanım havuzu" },
        { label: "Paketler", value: metrics.packagesTotal, hint: "Hazır setler" },
        {
          label: "Build versiyonu",
          value: metrics.buildVersionsTotal,
          hint: metrics.buildVersionsTotal > 0 ? "Lead hattı için hazır" : "Lead hattı kilitli",
        },
        { label: "Datasheet", value: metrics.datasheetsTotal, hint: "Teknik belge" },
      ]
    : [
        { label: "Modeller", value: "—", hint: "DB bekleniyor" },
        { label: "Kategoriler", value: "—", hint: "DB bekleniyor" },
        { label: "Ürünler", value: "—", hint: "DB bekleniyor" },
        { label: "Paketler", value: "—", hint: "DB bekleniyor" },
        { label: "Build versiyonu", value: "—", hint: "DB bekleniyor" },
        { label: "Datasheet", value: "—", hint: "DB bekleniyor" },
      ];

  const chainItems = metrics
    ? [
        {
          label: "Build Version",
          value: metrics.buildVersionsTotal,
          href: "/admin/build-versions",
          hint:
            metrics.buildVersionsTotal > 0
              ? "Lead hattı açılabilir"
              : "Lead hattı kilitli",
          tone: metrics.buildVersionsTotal > 0 ? "ready" : "blocked",
        },
        {
          label: "Lead",
          value: metrics.leadsTotal,
          href: "/admin/leads",
          hint:
            metrics.buildVersionsTotal === 0
              ? "Önce Build Version gerekli"
              : metrics.leadsTotal > 0
                ? "Teklif hattına aktarılabilir"
                : "Kayıt bekliyor",
          tone:
            metrics.buildVersionsTotal === 0
              ? "blocked"
              : metrics.leadsTotal > 0
                ? "ready"
                : "waiting",
        },
        {
          label: "Teklif",
          value: metrics.offersTotal,
          href: "/admin/offers",
          hint:
            metrics.leadsTotal === 0
              ? "Önce Lead gerekli"
              : metrics.offersTotal > 0
                ? "Satış hattı aktif"
                : "Kayıt bekliyor",
          tone:
            metrics.leadsTotal === 0
              ? "blocked"
              : metrics.offersTotal > 0
                ? "ready"
                : "waiting",
        },
      ]
    : [];

  const datasheetQueue = metrics
    ? metrics.datasheetsPending + metrics.datasheetsProcessing
    : 0;
  const activeModels = metrics
    ? Math.max(metrics.modelsTotal - metrics.modelsDraft - metrics.modelsArchived, 0)
    : 0;
  const activeCategories = metrics
    ? Math.max(
        metrics.categoriesTotal - metrics.categoriesDraft - metrics.categoriesArchived,
        0,
      )
    : 0;
  const activeProducts = metrics
    ? Math.max(metrics.productsTotal - metrics.productsDraft - metrics.productsArchived, 0)
    : 0;

  const radarItems: RadarItem[] = metrics
    ? [
        ...(metrics.buildVersionsTotal === 0
          ? [
              {
                title: "Build version hattı boş",
                description: "Lead → teklif zinciri için önce geçerli bir build version üretmelisin.",
                href: "/admin/build-versions",
                cta: "Build hattını aç",
                tone: "danger" as const,
                icon: Waypoints,
              },
            ]
          : []),
        ...(metrics.datasheetsFailed > 0
          ? [
              {
                title: "Hatalı datasheet kaydı var",
                description: `${metrics.datasheetsFailed} teknik belge işleme hatası bekliyor.`,
                href: "/admin/datasheets?parsingStatus=failed",
                cta: "Kayıtları incele",
                tone: "danger" as const,
                icon: FileWarning,
              },
            ]
          : []),
        ...(datasheetQueue > 0
          ? [
              {
                title: "Datasheet kuyruğu çalışıyor",
                description: `${datasheetQueue} kayıt bekliyor veya işleniyor.`,
                href: "/admin/datasheets?audit=queue",
                cta: "Kuyruğu aç",
                tone: "warning" as const,
                icon: AlertTriangle,
              },
            ]
          : []),
        ...(metrics.datasheetsCompletedNoChunks > 0
          ? [
              {
                title: "Parçasız tamamlanan belge var",
                description: `${metrics.datasheetsCompletedNoChunks} belge içerik parçası üretmemiş.`,
                href: "/admin/datasheets?audit=completed-no-chunks",
                cta: "Belgeleri incele",
                tone: "danger" as const,
                icon: FileWarning,
              },
            ]
          : []),
        ...(metrics.productsDraft > 0
          ? [
              {
                title: "Taslak ürün bulunuyor",
                description: `${metrics.productsDraft} ürün üretim hazır seviyede değil.`,
                href: "/admin/products",
                cta: "Ürünleri aç",
                tone: "info" as const,
                icon: Package,
              },
            ]
          : []),
        ...(metrics.rulesTotal === 0
          ? [
              {
                title: "Kural motoru kapalı",
                description: "Teknik veri ve onay hattı tamamlanana kadar kural yazımı açılmıyor.",
                href: "/admin/rules",
                cta: "Durumu gör",
                tone: "warning" as const,
                icon: Settings2,
              },
            ]
          : []),
      ]
    : [];

  const aiReady =
    metrics &&
    metrics.datasheetsReady > 0 &&
    metrics.knowledgeApproved > 0 &&
    metrics.datasheetsCompletedNoChunks === 0 &&
    metrics.datasheetsFailed === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Admin / Genel Bakış"
        title="Operasyon özeti"
        description="Önce müdahale gerektiren alanları gör; ayrıntıyı ilgili modülde aç."
        actions={
          <Link
            href="/admin/build-versions"
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-500/30 hover:bg-sky-500/15"
          >
            Build hattı
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <section
        className={`rounded-2xl border p-4 ${
          governanceReady
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/20 bg-amber-500/10 text-amber-200"
        }`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-black/20 p-2">
              {governanceReady ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {governanceReady ? "Yönetim durumu hazır" : "Yönetim kapanışı bekliyor"}
              </p>
              <p className="mt-0.5 text-xs opacity-80">
                {auditRuntime.reason || "Audit ve yayın izleri kontrol altında."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-black/10 bg-black/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">DB</p>
              <p className="mt-1 text-xs font-semibold">
                {databaseHealth.status === "online" ? "Hazır" : "Güvenli mod"}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">Audit</p>
              <p className="mt-1 text-xs font-semibold">
                {auditRuntime.actorRecordStatus === "resolved" && auditRuntime.roleAligned
                  ? "Doğrulandı"
                  : "Dikkat"}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">Yayın izi</p>
              <p className="mt-1 text-xs font-semibold">
                {auditRuntime.writeActive && auditRuntime.publishWriteActive ? "Aktif" : "Kapalı"}
              </p>
            </div>
            <div className="rounded-xl border border-black/10 bg-black/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] opacity-70">Override</p>
              <p className="mt-1 text-xs font-semibold">{openOverrideCount}</p>
            </div>
          </div>
        </div>

        {!governanceReady ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3 text-xs">
            <Link href="/admin/audit" className="rounded-lg border border-black/10 bg-black/10 px-3 py-1.5 hover:bg-black/15">
              İz ve yayın
            </Link>
            <Link href="/admin/settings" className="rounded-lg border border-black/10 bg-black/10 px-3 py-1.5 hover:bg-black/15">
              SEO ve ayarlar
            </Link>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={String(item.value)}
            hint={item.hint}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Operasyon zinciri</h2>
            <p className="mt-1 text-xs text-neutral-500">
              Gerçek bağımlılık sırası: Build Version → Lead → Teklif.
            </p>
          </div>
          <span className="text-xs text-neutral-500">Kayıt bazlı durum</span>
        </div>

        {metrics ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {chainItems.map((item) => {
              const toneClasses =
                item.tone === "ready"
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : item.tone === "blocked"
                    ? "border-rose-500/20 bg-rose-500/10"
                    : "border-amber-500/20 bg-amber-500/10";

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`rounded-xl border px-3 py-3 transition hover:border-white/20 ${toneClasses}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-white">{item.label}</span>
                    <span className="text-lg font-semibold text-white">{item.value}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-300/80">{item.hint}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            Veritabanı çevrimdışı olduğu için operasyon zinciri okunamadı.
          </div>
        )}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Öncelik listesi</h2>
              <p className="mt-1 text-xs text-neutral-500">Sadece aksiyon gerektiren kayıtlar.</p>
            </div>
            <span className="text-xs text-neutral-500">{radarItems.length} kayıt</span>
          </div>

          {metrics ? (
            radarItems.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {radarItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={`${item.href}-${item.title}`}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition hover:opacity-90 ${getToneClasses(item.tone)}`}
                    >
                      <span className="rounded-lg bg-black/20 p-1.5">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs opacity-80">{item.description}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium">{item.cta} →</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Kritik operasyon uyarısı görünmüyor.</span>
              </div>
            )
          ) : (
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              Veritabanı çevrimdışı olduğu için radar üretilemedi.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <h2 className="text-base font-semibold text-white">Hızlı erişim</h2>
            <p className="mt-1 text-xs text-neutral-500">Ayrıntıyı ilgili modülde aç.</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <span className="rounded-lg bg-white/5 p-1.5 text-neutral-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-sky-500/10 p-2 text-sky-300">
              <Bot className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">AI ve veri hazırlığı</h2>
              <p className="mt-1 text-xs text-neutral-500">AI yalnızca onaylı ve parça üreten kaynakları kullanır.</p>
            </div>
          </div>
          <span
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              aiReady
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-amber-500/20 bg-amber-500/10 text-amber-200"
            }`}
          >
            {aiReady ? "Hazır" : "İnceleme gerekli"}
          </span>
        </div>

        {metrics ? (
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {[
              ["Teknik hazır", metrics.datasheetsReady],
              ["Onay bekliyor", metrics.knowledgePendingReview],
              ["Kuyruk", datasheetQueue],
              ["Hatalı", metrics.datasheetsFailed],
              ["Kural", metrics.rulesTotal],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-black/15 px-3 py-2.5">
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            Veritabanı çevrimdışı olduğu için hazırlık özeti üretilemedi.
          </div>
        )}

        {metrics ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/10 pt-3 text-xs text-neutral-500">
            <span>Aktif model: <strong className="text-neutral-300">{activeModels}</strong></span>
            <span>Aktif kategori: <strong className="text-neutral-300">{activeCategories}</strong></span>
            <span>Aktif ürün: <strong className="text-neutral-300">{activeProducts}</strong></span>
            <Link href="/admin/datasheets" className="text-sky-300 hover:text-sky-200">Datasheet detayına git →</Link>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
        <span>İş sırası: Build Version → Lead → Teklif</span>
        <span aria-hidden="true">·</span>
        <span>Rules ve kritik AI aksiyonları onay hattı tamamlanana kadar kontrollü.</span>
      </div>
    </div>
  );
}
