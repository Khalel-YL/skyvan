import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Edit,
  ExternalLink,
  FileDigit,
  FileWarning,
  Link2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { asc, count, desc } from "drizzle-orm";

import { PageHeader } from "../_components/page-header";
import { StatCard } from "../_components/stat-card";
import AddDatasheetDrawer from "./AddDatasheetDrawer";
import DeleteDatasheetButton from "./DeleteDatasheetButton";

import { db } from "@/db/db";
import { aiDocumentChunks, aiKnowledgeDocuments, products } from "@/db/schema";

type SearchParams = Promise<{
  q?: string;
  docType?: string;
  parsingStatus?: string;
  audit?: string;
  edit?: string;
  saved?: string;
  created?: string;
  updated?: string;
  docAction?: string;
  docCode?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

type ProductOption = {
  id: string;
  sku: string;
  name: string;
  status: string;
};

type DatasheetRow = {
  id: string;
  productId: string | null;
  title: string;
  docType: "datasheet" | "manual" | "rulebook";
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  s3Key: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  productLabel: string;
  chunkCount: number;
  hasMissingProductReference: boolean;
};

type AuditKey =
  | "all"
  | "duplicates"
  | "unsafe"
  | "orphan-product"
  | "completed-no-chunks"
  | "queue"
  | "failed";

const docTypeLabelMap: Record<DatasheetRow["docType"], string> = {
  datasheet: "Teknik datasheet",
  manual: "Kullanım kılavuzu",
  rulebook: "Kural kitabı",
};

const parsingStatusLabelMap: Record<DatasheetRow["parsingStatus"], string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Tamamlandı",
  failed: "Hatalı",
};

function normalizeDocType(value?: string) {
  if (value === "datasheet" || value === "manual" || value === "rulebook") {
    return value;
  }

  return "all";
}

function normalizeParsingStatus(value?: string) {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }

  return "all";
}

function normalizeAudit(value?: string): AuditKey {
  if (
    value === "duplicates" ||
    value === "unsafe" ||
    value === "orphan-product" ||
    value === "completed-no-chunks" ||
    value === "queue" ||
    value === "failed"
  ) {
    return value;
  }

  return "all";
}

function hasBlockedScheme(value: string) {
  const lowered = value.trim().toLowerCase();

  return (
    lowered.startsWith("javascript:") ||
    lowered.startsWith("data:") ||
    lowered.startsWith("vbscript:")
  );
}

function isOpenableHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getFlashMessage(
  params: Awaited<SearchParams>,
): { tone: "success" | "error"; message: string } | null {
  if (params.saved && params.created) {
    return {
      tone: "success",
      message: "Datasheet kaydı oluşturuldu.",
    };
  }

  if (params.saved && params.updated) {
    return {
      tone: "success",
      message: "Datasheet kaydı güncellendi.",
    };
  }

  if (params.docAction === "deleted") {
    return {
      tone: "success",
      message: "Datasheet kaydı kaldırıldı.",
    };
  }

  if (params.docAction === "error") {
    switch (params.docCode) {
      case "invalid-id":
        return {
          tone: "error",
          message: "Geçersiz datasheet silme isteği alındı.",
        };
      case "db-offline":
        return {
          tone: "error",
          message: "Veritabanı çevrimdışı olduğu için işlem tamamlanamadı.",
        };
      case "delete-failed":
        return {
          tone: "error",
          message: "Datasheet silinirken beklenmeyen bir hata oluştu.",
        };
      default:
        return {
          tone: "error",
          message: "Datasheet işlemi sırasında beklenmeyen bir hata oluştu.",
        };
    }
  }

  return null;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function buildHref(params: {
  q: string;
  docType: string;
  parsingStatus: string;
  audit: AuditKey;
}) {
  const search = new URLSearchParams();

  if (params.q.trim()) {
    search.set("q", params.q.trim());
  }

  if (params.docType !== "all") {
    search.set("docType", params.docType);
  }

  if (params.parsingStatus !== "all") {
    search.set("parsingStatus", params.parsingStatus);
  }

  if (params.audit !== "all") {
    search.set("audit", params.audit);
  }

  const query = search.toString();
  return query ? `/admin/datasheets?${query}` : "/admin/datasheets";
}

async function getProductsSafely(): Promise<ProductOption[]> {
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        id: products.id,
        sku: products.sku,
        name: products.name,
        status: products.status,
      })
      .from(products)
      .orderBy(asc(products.name));
  } catch (error) {
    console.error("Datasheets products fetch error:", error);
    return [];
  }
}

async function getDatasheetsSafely(
  productMap: Map<string, ProductOption>,
): Promise<DatasheetRow[]> {
  if (!db) {
    return [];
  }

  try {
    const [documents, chunkRows] = await Promise.all([
      db
        .select({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          s3Key: aiKnowledgeDocuments.s3Key,
          createdAt: aiKnowledgeDocuments.createdAt,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        })
        .from(aiKnowledgeDocuments)
        .orderBy(
          desc(aiKnowledgeDocuments.updatedAt),
          desc(aiKnowledgeDocuments.createdAt),
        ),
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

    return documents.map((document) => {
      const hasMissingProductReference = Boolean(
        document.productId && !productMap.has(document.productId),
      );

      const product = document.productId
        ? productMap.get(document.productId)
        : null;

      return {
        ...document,
        docType: document.docType as "datasheet" | "manual" | "rulebook",
        parsingStatus: document.parsingStatus as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        productLabel:
          document.docType !== "rulebook" && !document.productId
            ? "Eksik ürün referansı"
            : document.productId
              ? product
                ? `${product.sku} · ${product.name}`
                : "Eksik ürün referansı"
              : "Genel doküman",
        chunkCount: chunkMap.get(document.id) ?? 0,
        hasMissingProductReference:
          document.docType !== "rulebook" &&
          (!document.productId || hasMissingProductReference),
      };
    });
  } catch (error) {
    console.error("Datasheets fetch error:", error);
    return [];
  }
}

function getStatusTone(status: DatasheetRow["parsingStatus"]) {
  switch (status) {
    case "completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "processing":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200";
    case "pending":
    default:
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }
}

function getAuditTone(countValue: number, mode: "critical" | "warning") {
  if (countValue <= 0) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (mode === "critical") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

export default async function DatasheetsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = typeof params.q === "string" ? params.q : "";
  const docTypeFilter = normalizeDocType(params.docType);
  const parsingStatusFilter = normalizeParsingStatus(params.parsingStatus);
  const auditFilter = normalizeAudit(params.audit);

  const allProducts = await getProductsSafely();
  const productMap = new Map(allProducts.map((product) => [product.id, product]));
  const allDocs = await getDatasheetsSafely(productMap);

  const s3KeyCountMap = new Map<string, number>();

  for (const doc of allDocs) {
    const key = doc.s3Key.trim();

    if (!key) {
      continue;
    }

    s3KeyCountMap.set(key, (s3KeyCountMap.get(key) ?? 0) + 1);
  }

  const duplicateS3Keys = new Set(
    Array.from(s3KeyCountMap.entries())
      .filter(([, value]) => value > 1)
      .map(([key]) => key),
  );

  const filteredDocs = allDocs.filter((doc) => {
    const needle = q.trim().toLowerCase();
    const isDuplicate = duplicateS3Keys.has(doc.s3Key.trim());
    const isUnsafe = hasBlockedScheme(doc.s3Key);
    const isQueue =
      doc.parsingStatus === "pending" || doc.parsingStatus === "processing";
    const isCompletedWithoutChunks =
      doc.parsingStatus === "completed" && doc.chunkCount === 0;

    const matchesQuery = needle
      ? doc.title.toLowerCase().includes(needle) ||
        doc.productLabel.toLowerCase().includes(needle) ||
        doc.s3Key.toLowerCase().includes(needle)
      : true;

    const matchesDocType =
      docTypeFilter === "all" ? true : doc.docType === docTypeFilter;

    const matchesParsingStatus =
      parsingStatusFilter === "all"
        ? true
        : doc.parsingStatus === parsingStatusFilter;

    const matchesAudit =
      auditFilter === "all"
        ? true
        : auditFilter === "duplicates"
          ? isDuplicate
          : auditFilter === "unsafe"
            ? isUnsafe
            : auditFilter === "orphan-product"
              ? doc.hasMissingProductReference
              : auditFilter === "completed-no-chunks"
                ? isCompletedWithoutChunks
                : auditFilter === "queue"
                  ? isQueue
                  : doc.parsingStatus === "failed";

    return matchesQuery && matchesDocType && matchesParsingStatus && matchesAudit;
  });

  const summary = allDocs.reduce(
    (acc, item) => {
      const isGeneral = !item.productId;
      const isUnsafe = hasBlockedScheme(item.s3Key);
      const isQueue =
        item.parsingStatus === "pending" || item.parsingStatus === "processing";
      const isDuplicate = duplicateS3Keys.has(item.s3Key.trim());
      const isCompletedWithoutChunks =
        item.parsingStatus === "completed" && item.chunkCount === 0;

      acc.total += 1;
      acc.totalChunks += item.chunkCount;

      if (isGeneral) {
        acc.general += 1;
      } else {
        acc.linked += 1;
      }

      if (item.parsingStatus === "failed") {
        acc.failed += 1;
      }

      if (isQueue) {
        acc.queue += 1;
      }

      if (isUnsafe) {
        acc.unsafe += 1;
      }

      if (isDuplicate) {
        acc.duplicates += 1;
      }

      if (item.hasMissingProductReference) {
        acc.orphanProduct += 1;
      }

      if (isCompletedWithoutChunks) {
        acc.completedNoChunks += 1;
      }

      return acc;
    },
    {
      total: 0,
      linked: 0,
      general: 0,
      queue: 0,
      failed: 0,
      unsafe: 0,
      duplicates: 0,
      orphanProduct: 0,
      completedNoChunks: 0,
      totalChunks: 0,
    },
  );

  const flashMessage = getFlashMessage(params);
  const editData = params.edit
    ? allDocs.find((doc) => doc.id === params.edit) ?? null
    : null;

  const databaseReady = Boolean(db);

  const criticalChecks = [
    summary.duplicates === 0,
    summary.unsafe === 0,
    summary.orphanProduct === 0,
    summary.completedNoChunks === 0,
  ];

  const passedChecks = criticalChecks.filter(Boolean).length;
  const totalChecks = criticalChecks.length;
  const criticalIssueCount =
    summary.duplicates +
    summary.unsafe +
    summary.orphanProduct +
    summary.completedNoChunks;

  const statusTabs = [
    { key: "all", label: `Tümü (${summary.total})` },
    {
      key: "pending",
      label: `Bekliyor (${allDocs.filter((doc) => doc.parsingStatus === "pending").length})`,
    },
    {
      key: "processing",
      label: `İşleniyor (${allDocs.filter((doc) => doc.parsingStatus === "processing").length})`,
    },
    {
      key: "completed",
      label: `Tamamlandı (${allDocs.filter((doc) => doc.parsingStatus === "completed").length})`,
    },
    {
      key: "failed",
      label: `Hatalı (${allDocs.filter((doc) => doc.parsingStatus === "failed").length})`,
    },
  ] as const;

  const auditTabs: { key: AuditKey; label: string }[] = [
    { key: "all", label: `Tüm auditler (${summary.total})` },
    { key: "duplicates", label: `Tekrar anahtar (${summary.duplicates})` },
    { key: "unsafe", label: `Güvensiz bağlantı (${summary.unsafe})` },
    { key: "orphan-product", label: `Eksik ürün (${summary.orphanProduct})` },
    {
      key: "completed-no-chunks",
      label: `Chunk'sız tamamlandı (${summary.completedNoChunks})`,
    },
    { key: "queue", label: `Kuyruk (${summary.queue})` },
    { key: "failed", label: `Hatalı (${summary.failed})` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / AI Bilgi Kayıt Katmanı"
        title="Datasheet Merkezi"
        description="AI bilgi tabanı, rule engine ve ileride mobil/API istemcilerinin besleneceği teknik belge kayıt katmanı."
      />

      {!databaseReady ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          Veritabanı yapılandırılmadığı için liste ve kayıt işlemleri pasif
          durumda.
        </div>
      ) : null}

      {flashMessage ? (
        <div
          className={`rounded-3xl px-5 py-4 text-sm ${
            flashMessage.tone === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-200"
          }`}
        >
          {flashMessage.message}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Toplam Kayıt"
          value={String(summary.total)}
          hint="Belge envanteri"
        />
        <StatCard
          label="Ürüne Bağlı"
          value={String(summary.linked)}
          hint="Ürün referanslı kayıtlar"
        />
        <StatCard
          label="Genel Doküman"
          value={String(summary.general)}
          hint="Üründen bağımsız kayıtlar"
        />
        <StatCard
          label="Kuyruk"
          value={String(summary.queue)}
          hint="Bekleyen + işlenen kayıtlar"
        />
        <StatCard
          label="Hatalı"
          value={String(summary.failed)}
          hint="İnceleme gerektiren kayıtlar"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start gap-3">
              <div
                className={`rounded-2xl p-2 ${
                  criticalIssueCount === 0
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-amber-500/10 text-amber-300"
                }`}
              >
                {criticalIssueCount === 0 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">
                  Datasheet simülasyon radarı
                </h2>
                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  Bu panel gerçek kayıtlar üstünden canlı smoke-check üretir.
                  Local uygulamayı burada çalıştırmadığım için, güvenli test
                  katmanını doğrudan modül içine ekliyorum.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Kritik kontrol sonucu
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Duplicate anahtar, güvensiz bağlantı, eksik ürün referansı ve
                    chunk&apos;sız tamamlanan kayıtlar denetlenir.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-semibold text-white">
                    {passedChecks}/{totalChecks}
                  </p>
                  <p className="text-xs text-neutral-400">geçen kontrol</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "duplicates",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.duplicates,
                  "critical",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Tekrar anahtar
                </p>
                <p className="mt-2 text-2xl font-semibold">{summary.duplicates}</p>
                <p className="mt-1 text-xs opacity-90">
                  Aynı belge bağlantısı / storage anahtarı birden fazla kayıtta
                  geçiyor mu?
                </p>
              </Link>

              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "unsafe",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.unsafe,
                  "critical",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Güvensiz bağlantı
                </p>
                <p className="mt-2 text-2xl font-semibold">{summary.unsafe}</p>
                <p className="mt-1 text-xs opacity-90">
                  `javascript:` benzeri riskli şema tespiti.
                </p>
              </Link>

              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "orphan-product",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.orphanProduct,
                  "critical",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Eksik ürün referansı
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {summary.orphanProduct}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Ürün bağı zorunlu olan kayıtlar için eksik ya da bozuk referans.
                </p>
              </Link>

              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "completed-no-chunks",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.completedNoChunks,
                  "critical",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Chunk&apos;sız tamamlandı
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {summary.completedNoChunks}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  `completed` olup içerik parçası üretmeyen kayıtlar.
                </p>
              </Link>

              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "queue",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.queue,
                  "warning",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Kuyruk yoğunluğu
                </p>
                <p className="mt-2 text-2xl font-semibold">{summary.queue}</p>
                <p className="mt-1 text-xs opacity-90">
                  Bekleyen + işlenen kayıt toplamı.
                </p>
              </Link>

              <Link
                href={buildHref({
                  q,
                  docType: docTypeFilter,
                  parsingStatus: "all",
                  audit: "failed",
                })}
                className={`rounded-2xl border p-4 transition hover:opacity-90 ${getAuditTone(
                  summary.failed,
                  "warning",
                )}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  Hatalı kayıtlar
                </p>
                <p className="mt-2 text-2xl font-semibold">{summary.failed}</p>
                <p className="mt-1 text-xs opacity-90">
                  Operasyon müdahalesi gerektiren belge kayıtları.
                </p>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-2 text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Kayıt güvenliği özeti
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-400">
                    Aynı storage anahtarı tekrar kullanılamaz. Riskli bağlantı
                    şemaları kayıt aşamasında bloklanır.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-neutral-300">
                Şüpheli bağlantı sayısı:{" "}
                <span className="font-semibold text-white">{summary.unsafe}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-2 text-amber-300">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Operasyon sinyali
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-neutral-400">
                    Kuyruk ve hatalı belge yoğunluğu AI hazırlık kalitesini
                    doğrudan etkiler.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Kuyruk
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {summary.queue}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Toplam parça
                  </p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {summary.totalChunks}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  name="q"
                  defaultValue={q}
                  placeholder="Başlık, ürün veya bağlantı ara"
                  className="w-full rounded-2xl border border-white/10 bg-neutral-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-sky-500/40"
                />
              </div>

              <select
                name="docType"
                defaultValue={docTypeFilter}
                className="rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-500/40"
              >
                <option value="all">Tüm tipler</option>
                <option value="datasheet">Teknik datasheet</option>
                <option value="manual">Kullanım kılavuzu</option>
                <option value="rulebook">Kural kitabı</option>
              </select>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                >
                  Filtrele
                </button>

                <Link
                  href="/admin/datasheets"
                  className="rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-medium text-neutral-300 transition hover:bg-white/[0.04] hover:text-white"
                >
                  Sıfırla
                </Link>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {statusTabs.map((tab) => {
                const isActive = parsingStatusFilter === tab.key;

                return (
                  <Link
                    key={tab.key}
                    href={buildHref({
                      q,
                      docType: docTypeFilter,
                      parsingStatus: tab.key,
                      audit: auditFilter,
                    })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "border border-sky-500/20 bg-sky-500/10 text-sky-200"
                        : "border border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {auditTabs.map((tab) => {
                const isActive = auditFilter === tab.key;

                return (
                  <Link
                    key={tab.key}
                    href={buildHref({
                      q,
                      docType: docTypeFilter,
                      parsingStatus: parsingStatusFilter,
                      audit: tab.key,
                    })}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      isActive
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : "border border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/8 px-1 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">Kayıt listesi</p>
                <p className="mt-1 text-xs text-neutral-400">
                  Alt blok tablo yerine kompakt kayıt kartları olarak stabilize edildi.
                </p>
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-neutral-300">
                {filteredDocs.length} kayıt
              </div>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="px-2 py-8 text-sm text-neutral-400">
                Filtreye uyan datasheet kaydı bulunamadı.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDocs.map((doc) => {
                  const blocked = hasBlockedScheme(doc.s3Key);
                  const openable = isOpenableHttpUrl(doc.s3Key) && !blocked;
                  const duplicate = duplicateS3Keys.has(doc.s3Key.trim());
                  const completedWithoutChunks =
                    doc.parsingStatus === "completed" && doc.chunkCount === 0;

                  return (
                    <div
                      key={doc.id}
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-xl bg-sky-500/10 p-2 text-sky-300">
                              <FileDigit className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {doc.title}
                              </p>

                              <p className="mt-2 truncate text-xs text-neutral-400">
                                {doc.productLabel}
                              </p>

                              <p
                                className="mt-1 truncate text-xs text-neutral-500"
                                title={doc.s3Key}
                              >
                                {doc.s3Key}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-300">
                                  {doc.productId ? "Ürüne bağlı" : "Genel doküman"}
                                </span>

                                <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-300">
                                  {docTypeLabelMap[doc.docType]}
                                </span>

                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                                    doc.parsingStatus,
                                  )}`}
                                >
                                  {parsingStatusLabelMap[doc.parsingStatus]}
                                </span>

                                <span
                                  className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] ${
                                    blocked
                                      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                                      : openable
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                        : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                                  }`}
                                >
                                  {blocked
                                    ? "Güvenli değil"
                                    : openable
                                      ? "Web bağlantısı"
                                      : "Storage anahtarı"}
                                </span>

                                <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-neutral-300">
                                  Parça: {doc.chunkCount}
                                </span>

                                {duplicate ? (
                                  <span className="inline-flex whitespace-nowrap rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] text-rose-200">
                                    Tekrar anahtar
                                  </span>
                                ) : null}

                                {doc.hasMissingProductReference ? (
                                  <span className="inline-flex whitespace-nowrap rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] text-rose-200">
                                    Eksik ürün referansı
                                  </span>
                                ) : null}

                                {completedWithoutChunks ? (
                                  <span className="inline-flex whitespace-nowrap rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-200">
                                    Chunk yok
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-end gap-3 xl:min-w-[190px] xl:flex-col xl:items-stretch">
                          <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 xl:w-full">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                              Güncelleme
                            </p>
                            <p className="mt-1 text-xs text-neutral-300">
                              {formatDate(doc.updatedAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 xl:w-full xl:justify-end">
                            <Link
                              href={`/admin/datasheets?edit=${doc.id}`}
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>

                            {openable ? (
                              <a
                                href={doc.s3Key}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            ) : (
                              <span
                                className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-neutral-600"
                                title={
                                  blocked
                                    ? "Bu bağlantı güvenli değil"
                                    : "Bu kayıt web URL değil, storage anahtarı olarak tutuluyor"
                                }
                              >
                                {blocked ? (
                                  <FileWarning className="h-4 w-4" />
                                ) : (
                                  <Link2 className="h-4 w-4" />
                                )}
                              </span>
                            )}

                            <DeleteDatasheetButton datasheetId={doc.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <AddDatasheetDrawer
            initialData={editData}
            availableProducts={allProducts}
            disabled={!databaseReady}
          />
        </div>
      </div>
    </div>
  );
}
