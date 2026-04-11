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
  categories,
  compatibilityRules,
  models,
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
  rulesTotal: number;
  datasheetsTotal: number;
  datasheetsPending: number;
  datasheetsProcessing: number;
  datasheetsCompleted: number;
  datasheetsFailed: number;
  datasheetsReady: number;
  datasheetsCompletedNoChunks: number;
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
    title: "Araç Modelleri",
    description: "Şasi ve temel teknik ölçü omurgasını yönet",
    href: "/admin/models",
    icon: Truck,
  },
  {
    title: "Kategoriler",
    description: "Ürün sınıflandırma omurgasını koru",
    href: "/admin/categories",
    icon: Blocks,
  },
  {
    title: "Ürünler",
    description: "Katalog ve mühendislik alanlarını yönet",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Paketler",
    description: "Hazır konfigürasyon seviyelerini kontrol et",
    href: "/admin/packages",
    icon: Boxes,
  },
  {
    title: "Kural Motoru",
    description: "Requires / excludes / recommends mantığını denetle",
    href: "/admin/rules",
    icon: Settings2,
  },
  {
    title: "Datasheet Merkezi",
    description: "AI ve rule engine için belge kayıt katmanını besle",
    href: "/admin/datasheets",
    icon: FileDigit,
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
      rulesTotal,
      datasheetsTotal,
      datasheetsPending,
      datasheetsProcessing,
      datasheetsCompleted,
      datasheetsFailed,
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
      countTable(compatibilityRules),

      countTable(aiKnowledgeDocuments),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.parsingStatus, "pending"),
      countWhere(
        aiKnowledgeDocuments,
        aiKnowledgeDocuments.parsingStatus,
        "processing",
      ),
      countWhere(
        aiKnowledgeDocuments,
        aiKnowledgeDocuments.parsingStatus,
        "completed",
      ),
      countWhere(aiKnowledgeDocuments, aiKnowledgeDocuments.parsingStatus, "failed"),

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
      rulesTotal,
      datasheetsTotal,
      datasheetsPending,
      datasheetsProcessing,
      datasheetsCompleted,
      datasheetsFailed,
      datasheetsReady,
      datasheetsCompletedNoChunks,
    };
  } catch (error) {
    console.error("Admin dashboard metrics error:", error);
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
        {
          label: "Modeller",
          value: String(metrics.modelsTotal),
          hint: "Araç platform omurgası",
        },
        {
          label: "Kategoriler",
          value: String(metrics.categoriesTotal),
          hint: "Ürün sınıflandırma ağacı",
        },
        {
          label: "Ürünler",
          value: String(metrics.productsTotal),
          hint: "Parça ve donanım havuzu",
        },
        {
          label: "Paketler",
          value: String(metrics.packagesTotal),
          hint: "Hazır konfigürasyon setleri",
        },
        {
          label: "Kurallar",
          value: String(metrics.rulesTotal),
          hint: "Teknik uyumluluk kayıtları",
        },
        {
          label: "Datasheet",
          value: String(metrics.datasheetsTotal),
          hint: "AI bilgi tabanı belge kayıtları",
        },
      ]
    : [
        {
          label: "Modeller",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
        {
          label: "Kategoriler",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
        {
          label: "Ürünler",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
        {
          label: "Paketler",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
        {
          label: "Kurallar",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
        {
          label: "Datasheet",
          value: "-",
          hint: "Veritabanı çevrimdışı",
        },
      ];

  const modelActive = metrics
    ? Math.max(metrics.modelsTotal - metrics.modelsDraft - metrics.modelsArchived, 0)
    : 0;

  const categoryActive = metrics
    ? Math.max(
        metrics.categoriesTotal - metrics.categoriesDraft - metrics.categoriesArchived,
        0,
      )
    : 0;

  const productActive = metrics
    ? Math.max(
        metrics.productsTotal - metrics.productsDraft - metrics.productsArchived,
        0,
      )
    : 0;

  const datasheetQueue = metrics
    ? metrics.datasheetsPending + metrics.datasheetsProcessing
    : 0;

  const totalArchived = metrics
    ? metrics.modelsArchived + metrics.categoriesArchived + metrics.productsArchived
    : 0;

  const radarItems: RadarItem[] = metrics
    ? [
        ...(metrics.rulesTotal === 0
          ? [
              {
                title: "Kural kaydı henüz yok",
                description:
                  "Kural motoru omurgası açık ama aktif kural kaydı henüz oluşturulmamış.",
                href: "/admin/rules",
                cta: "Kural motorunu aç",
                tone: "warning" as const,
                icon: Settings2,
              },
            ]
          : []),
        ...(metrics.datasheetsFailed > 0
          ? [
              {
                title: "Hatalı belge kaydı var",
                description: `${metrics.datasheetsFailed} adet datasheet kaydı hata durumunda bekliyor.`,
                href: "/admin/datasheets?parsingStatus=failed",
                cta: "Hatalı kayıtları aç",
                tone: "danger" as const,
                icon: FileWarning,
              },
            ]
          : []),
        ...(datasheetQueue > 0
          ? [
              {
                title: "AI belge kuyruğu çalışıyor",
                description: `${datasheetQueue} adet kayıt bekliyor veya işleniyor.`,
                href: "/admin/datasheets?audit=queue",
                cta: "Belge kuyruğunu aç",
                tone: "warning" as const,
                icon: AlertTriangle,
              },
            ]
          : []),
        ...(metrics.datasheetsCompletedNoChunks > 0
          ? [
              {
                title: "Chunk üretmeyen tamamlanmış belge var",
                description: `${metrics.datasheetsCompletedNoChunks} belge completed görünüyor ama içerik parçası üretmemiş.`,
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
                title: "Taslak ürünler var",
                description: `${metrics.productsDraft} ürün henüz üretim hazır seviyeye gelmemiş.`,
                href: "/admin/products",
                cta: "Ürünleri kontrol et",
                tone: "info" as const,
                icon: Package,
              },
            ]
          : []),
      ]
    : [];

  const hygieneItems = metrics
    ? [
        {
          label: "Aktif modeller",
          value: modelActive,
          hint: `${metrics.modelsDraft} taslak / ${metrics.modelsArchived} arşiv`,
        },
        {
          label: "Aktif kategoriler",
          value: categoryActive,
          hint: `${metrics.categoriesDraft} taslak / ${metrics.categoriesArchived} arşiv`,
        },
        {
          label: "Aktif ürünler",
          value: productActive,
          hint: `${metrics.productsDraft} taslak / ${metrics.productsArchived} arşiv`,
        },
        {
          label: "Hazır datasheet",
          value: metrics.datasheetsReady,
          hint: `${datasheetQueue} kuyruk / ${metrics.datasheetsFailed} hatalı`,
        },
      ]
    : [];

  const aiReadinessItems = metrics
    ? [
        {
          label: "Belge hazır",
          value: metrics.datasheetsReady,
          hint: "Chunk üreten completed kayıtlar",
        },
        {
          label: "Chunk'sız completed",
          value: metrics.datasheetsCompletedNoChunks,
          hint: "Kalite kontrol gerektirir",
        },
        {
          label: "Kuyruk",
          value: datasheetQueue,
          hint: "Pending + processing",
        },
        {
          label: "Kural kaydı",
          value: metrics.rulesTotal,
          hint: "Rule engine veri omurgası",
        },
      ]
    : [];

  const aiReady =
    metrics &&
    metrics.datasheetsReady > 0 &&
    metrics.datasheetsCompletedNoChunks === 0 &&
    metrics.datasheetsFailed === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Operasyon Radarı"
        title="Yönetilebilir ve aksiyon odaklı admin özeti"
        description="Stabil modülleri tek merkezden gör, veri hazırlık kalitesini izle ve müdahale gerektiren alanları anında fark et."
        actions={
          <Link
            href="/admin/datasheets"
            className="inline-flex items-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:border-sky-500/30 hover:bg-sky-500/15"
          >
            Datasheet Merkezi
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <section
        className={`rounded-3xl border p-5 ${
          governanceReady
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/20 bg-amber-500/10 text-amber-200"
        }`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-black/20 p-2">
              {governanceReady ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold">
                {governanceReady
                  ? "Governance runtime doğrulandı"
                  : "Governance runtime closure için henüz hazır değil"}
              </p>
              <p className="mt-1 text-xs leading-5 opacity-90">
                Audit log ve publish revision yazımı aynı actor runtime bağına dayanır.
                Override açık durumları ise korumaların manuel gevşetildiğini gösterir.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                Database
              </div>
              <div className="mt-2 text-sm font-semibold">
                {databaseHealth.status === "online" ? "Hazır" : "Güvenli mod"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                Audit actor
              </div>
              <div className="mt-2 text-sm font-semibold">
                {auditRuntime.actorRecordStatus === "resolved"
                  ? auditRuntime.roleAligned
                    ? "Doğrulandı"
                    : "Role dikkat"
                  : "Doğrulanmadı"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                Audit / revision
              </div>
              <div className="mt-2 text-sm font-semibold">
                {auditRuntime.writeActive && auditRuntime.publishWriteActive
                  ? "Yazım aktif"
                  : "Safe-degrade"}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-black/10 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                Açık override
              </div>
              <div className="mt-2 text-sm font-semibold">{openOverrideCount}</div>
            </div>
          </div>
        </div>

        {auditRuntime.closureState !== "ready" || openOverrideCount > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/audit"
              className="rounded-2xl border border-black/10 bg-black/10 px-4 py-2 text-xs font-medium transition hover:bg-black/15"
            >
              Audit & Publish yüzeyini aç
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-2xl border border-black/10 bg-black/10 px-4 py-2 text-xs font-medium transition hover:bg-black/15"
            >
              SEO & Ayarlar yüzeyini aç
            </Link>
          </div>
        ) : null}

        {!governanceReady ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-black/10 p-4 text-xs leading-5 opacity-90">
            {auditRuntime.blocker
              ? `${auditRuntime.blocker} ${auditRuntime.reason}`
              : auditRuntime.reason}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            hint={item.hint}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Öncelikli operasyon radarları
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Admin tarafında dikkat gerektiren alanları hızlıca aç.
                </p>
              </div>
            </div>

            {metrics ? (
              radarItems.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {radarItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={`${item.href}-${item.title}`}
                        href={item.href}
                        className={`rounded-2xl border p-4 transition hover:opacity-90 ${getToneClasses(
                          item.tone,
                        )}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-black/20 p-2">
                            <Icon className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 opacity-90">
                              {item.description}
                            </p>
                            <p className="mt-3 text-xs font-medium opacity-100">
                              {item.cta} →
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-black/20 p-2">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        Kritik operasyon uyarısı görünmüyor
                      </p>
                      <p className="mt-1 text-xs leading-5 opacity-90">
                        Şu an dashboard üzerinde doğrudan müdahale gerektiren
                        ana birikim görünmüyor. Bu iyi seviye.
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Veritabanı çevrimdışı olduğu için operasyon radarı üretilemiyor.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Operasyon kısayolları
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Stabil kabul edilen admin modüllerine hızlı geçiş.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white/5 p-2">
                        <Icon className="h-4 w-4 text-neutral-100" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-sky-500/10 p-2 text-sky-300">
                <Bot className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  AI hazırlık radarı
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Belge ve kural girdisi kalitesi
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-400">
                  AI ve rule engine tarafına veri taşıyacak temel hazırlık
                  kalitesini tek panelde özetler.
                </p>
              </div>
            </div>

            {metrics ? (
              <>
                <div
                  className={`mt-5 rounded-2xl border p-4 ${
                    aiReady
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-black/20 p-2">
                      {aiReady ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {aiReady
                          ? "AI hazırlık seviyesi dengeli görünüyor"
                          : "AI hazırlık tarafında dikkat isteyen sinyaller var"}
                      </p>
                      <p className="mt-1 text-xs leading-5 opacity-90">
                        Hazır belge, kuyruk, failed kayıt ve chunk üretimi
                        birlikte izleniyor.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {aiReadinessItems.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {item.value}
                        </p>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-neutral-400">
                        {item.hint}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/admin/datasheets?parsingStatus=completed"
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <p className="text-sm font-medium text-white">
                      Hazır belgeleri aç
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                      Completed ve üretime yakın kayıtları incele.
                    </p>
                  </Link>

                  <Link
                    href="/admin/rules"
                    className="rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
                  >
                    <p className="text-sm font-medium text-white">
                      Kural motorunu aç
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                      Rule engine omurgasını belge kalitesiyle birlikte ilerlet.
                    </p>
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Veritabanı çevrimdışı olduğu için AI hazırlık özeti üretilemedi.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Veri hijyeni
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Hazırlık dengesi
            </h2>

            {metrics ? (
              <div className="mt-4 space-y-3">
                {hygieneItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">
                        {item.label}
                      </p>
                      <p className="text-lg font-semibold text-white">
                        {item.value}
                      </p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-neutral-400">
                      {item.hint}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                Veritabanı çevrimdışı olduğu için detay özeti üretilmedi.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Kontrollü güçlendirme
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Bu batch neden doğru?
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-6 text-neutral-400">
              <p>
                Veri modeline dokunmuyor. Sadece mevcut tablo ve chunk
                üretiminden hazırlık sinyali çıkarıyor.
              </p>

              <p>
                Dashboard’u sadece sayı gösteren ekran olmaktan çıkarıp AI ve
                rule engine hazırlık seviyesini izleyen bir merkeze yaklaştırıyor.
              </p>

              <p>
                Sonraki adımda rules tarafında kanıt kalitesi görünürlüğü
                açılırken hangi giriş kalitesinden başladığımızı netleştiriyor.
              </p>
            </div>

            {metrics ? (
              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <FileDigit className="mt-0.5 h-4 w-4 text-neutral-300" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Hazır belge oranı
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                      Completed belgeler içinde chunk üreten kayıt sayısı:{" "}
                      <span className="font-semibold text-white">
                        {metrics.datasheetsReady}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-neutral-300" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Toplam arşiv yükü
                    </p>
                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                      Modeller + kategoriler + ürünler içinde toplam{" "}
                      <span className="font-semibold text-white">
                        {totalArchived}
                      </span>{" "}
                      arşiv kayıt var.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
