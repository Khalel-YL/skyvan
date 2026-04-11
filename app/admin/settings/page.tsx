import Link from "next/link";
import { inArray } from "drizzle-orm";
import {
  ExternalLink,
  Settings2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { PageHeader } from "../_components/page-header";
import { StatCard } from "../_components/stat-card";
import { getAuditRuntimeSummary } from "@/app/lib/admin/audit";
import { getGovernanceRuntime } from "@/app/lib/admin/governance";

type SettingsSearchParams = Promise<{
  entityType?: string;
  seo?: string;
}>;

type EntityTypeFilter = "all" | "page" | "blog";
type SeoFilter = "all" | "needs-attention" | "ready";

type ContentRow = {
  id: string;
  entityType: string;
  entityId: string;
  locale: string;
  title: string;
  slug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentJson: unknown;
};

type SeoRecord = {
  id: string;
  entityType: "page" | "blog";
  entityId: string;
  locale: string;
  title: string;
  slug: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  missingFields: string[];
};

function normalizeEntityTypeFilter(value: string): EntityTypeFilter {
  if (value === "page" || value === "blog") {
    return value;
  }

  return "all";
}

function normalizeSeoFilter(value: string): SeoFilter {
  if (value === "needs-attention" || value === "ready") {
    return value;
  }

  return "all";
}

function parsePublishedState(entityType: "page" | "blog", contentJson: unknown) {
  if (!contentJson || typeof contentJson !== "object" || Array.isArray(contentJson)) {
    return entityType === "page";
  }

  const raw = contentJson as Record<string, unknown>;

  if (entityType === "page") {
    return raw.isPublished !== false;
  }

  return raw.isPublished === true;
}

function getMissingFields(row: ContentRow) {
  const missingFields: string[] = [];

  if (!String(row.slug ?? "").trim()) {
    missingFields.push("Slug");
  }

  if (!String(row.seoTitle ?? "").trim()) {
    missingFields.push("SEO başlığı");
  }

  if (!String(row.seoDescription ?? "").trim()) {
    missingFields.push("SEO açıklaması");
  }

  return missingFields;
}

function getEditorHref(entityType: "page" | "blog", id: string) {
  return entityType === "page" ? `/admin/pages?edit=${id}` : `/admin/blog?edit=${id}`;
}

function runtimeCardClass(enabled: boolean) {
  return enabled
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SettingsSearchParams;
}) {
  const params = await searchParams;
  const databaseHealth = getDatabaseHealth();
  const governanceRuntime = getGovernanceRuntime();
  const auditRuntime = getAuditRuntimeSummary();
  const entityTypeFilter = normalizeEntityTypeFilter(String(params.entityType ?? "all"));
  const seoFilter = normalizeSeoFilter(String(params.seo ?? "all"));

  let seoRecords: SeoRecord[] = [];
  let loadWarning: string | null = null;

  if (db) {
    try {
      const rows = (await db
        .select({
          id: localizedContent.id,
          entityType: localizedContent.entityType,
          entityId: localizedContent.entityId,
          locale: localizedContent.locale,
          title: localizedContent.title,
          slug: localizedContent.slug,
          seoTitle: localizedContent.seoTitle,
          seoDescription: localizedContent.seoDescription,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(inArray(localizedContent.entityType, ["page", "blog"]))) as ContentRow[];

      seoRecords = rows
        .map((row) => {
          const entityType = row.entityType as "page" | "blog";
          return {
            id: row.id,
            entityType,
            entityId: row.entityId,
            locale: row.locale,
            title: row.title,
            slug: row.slug,
            seoTitle: row.seoTitle,
            seoDescription: row.seoDescription,
            isPublished: parsePublishedState(entityType, row.contentJson),
            missingFields: getMissingFields(row),
          };
        })
        .sort((left, right) => {
          if (left.isPublished !== right.isPublished) {
            return left.isPublished ? -1 : 1;
          }

          if (left.entityType !== right.entityType) {
            return left.entityType.localeCompare(right.entityType, "tr");
          }

          return left.title.localeCompare(right.title, "tr");
        });
    } catch (error) {
      console.error("settings page error:", error);
      loadWarning =
        "SEO kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const filteredSeoRecords = seoRecords.filter((row) => {
    const matchesType =
      entityTypeFilter === "all" ? true : row.entityType === entityTypeFilter;
    const seoReady = row.missingFields.length === 0;
    const matchesSeo =
      seoFilter === "all"
        ? true
        : seoFilter === "ready"
          ? seoReady
          : !seoReady;

    return matchesType && matchesSeo;
  });

  const pageRecords = seoRecords.filter((row) => row.entityType === "page");
  const blogRecords = seoRecords.filter((row) => row.entityType === "blog");
  const seoReadyCount = seoRecords.filter((row) => row.missingFields.length === 0).length;
  const publishedWithGapCount = seoRecords.filter(
    (row) => row.isPublished && row.missingFields.length > 0,
  ).length;
  const localeCount = new Set(seoRecords.map((row) => row.locale)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · SEO & Ayarlar"
        title="SEO ve Runtime Ayar Görünürlüğü"
        description="Bu yüzey yeni bir settings tablosu kurmaz. Repo içindeki gerçek runtime governance flag’lerini ve mevcut `localized_content` SEO alanlarını görünür hale getirir."
      />

      {!db ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
          {databaseHealth.note}
        </div>
      ) : null}

      {loadWarning ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200">
          {loadWarning}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Page Kayıtları"
          value={String(pageRecords.length)}
          hint="localized_content içindeki page kayıtları"
        />
        <StatCard
          label="Blog Kayıtları"
          value={String(blogRecords.length)}
          hint="localized_content içindeki blog kayıtları"
        />
        <StatCard
          label="SEO Hazır"
          value={String(seoReadyCount)}
          hint="Slug + SEO başlığı + SEO açıklaması tam kayıtlar"
        />
        <StatCard
          label="Yayında Risk"
          value={String(publishedWithGapCount)}
          hint="Yayında olup SEO alanı eksik kayıtlar"
        />
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-center gap-3">
          <Settings2 className="h-5 w-5 text-zinc-300" />
          <h2 className="text-lg font-semibold text-white">Runtime ayarlar</h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className={`rounded-2xl border p-4 ${runtimeCardClass(databaseHealth.status === "online")}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Database
            </div>
            <div className="mt-2 text-lg font-semibold">
              {databaseHealth.status === "online" ? "Hazır" : "Güvenli mod"}
            </div>
            <div className="mt-2 text-xs leading-5 opacity-90">{databaseHealth.note}</div>
          </div>

          <div className={`rounded-2xl border p-4 ${runtimeCardClass(auditRuntime.enabled)}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Audit actor
            </div>
            <div className="mt-2 text-lg font-semibold">
              {auditRuntime.enabled ? "Aktif" : "Eksik"}
            </div>
            <div className="mt-2 text-xs leading-5 opacity-90">{auditRuntime.reason}</div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${runtimeCardClass(
              !governanceRuntime.allowDirectPublishWithoutSeo,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              SEO publish kilidi
            </div>
            <div className="mt-2 text-lg font-semibold">
              {governanceRuntime.allowDirectPublishWithoutSeo ? "Override açık" : "Koruma açık"}
            </div>
            <div className="mt-2 text-xs leading-5 opacity-90">
              SEO’suz direct publish davranışını kontrol eder.
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${runtimeCardClass(
              !governanceRuntime.allowCriticalOfferStatusTransitions,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Offer governance
            </div>
            <div className="mt-2 text-lg font-semibold">
              {governanceRuntime.allowCriticalOfferStatusTransitions
                ? "Override açık"
                : "Koruma açık"}
            </div>
            <div className="mt-2 text-xs leading-5 opacity-90">
              accepted / rejected / expired geçişlerinin kilit durumunu gösterir.
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${runtimeCardClass(
              !governanceRuntime.allowManualAiReadyStatus,
            )}`}
          >
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              AI-ready kilidi
            </div>
            <div className="mt-2 text-lg font-semibold">
              {governanceRuntime.allowManualAiReadyStatus
                ? "Override açık"
                : "Koruma açık"}
            </div>
            <div className="mt-2 text-xs leading-5 opacity-90">
              Completed sınırına dokunan manuel geçişleri gösterir.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">SEO kapsaması</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Gerçek `page` ve `blog` kayıtları üzerinden SEO alanı bütünlüğünü izle.
            </p>
          </div>

          <form className="flex flex-col gap-3 md:flex-row">
            <select
              name="entityType"
              defaultValue={entityTypeFilter}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm içerik tipleri</option>
              <option value="page">Page</option>
              <option value="blog">Blog</option>
            </select>

            <select
              name="seo"
              defaultValue={seoFilter}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm SEO durumları</option>
              <option value="needs-attention">Dikkat isteyen</option>
              <option value="ready">Hazır</option>
            </select>

            <button
              type="submit"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Uygula
            </button>

            <Link
              href="/admin/settings"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Locale
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{localeCount}</div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Hazır oranı
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {seoRecords.length > 0 ? `%${Math.round((seoReadyCount / seoRecords.length) * 100)}` : "%0"}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              Publish riski
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">{publishedWithGapCount}</div>
          </div>
        </div>

        {filteredSeoRecords.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
            Filtreye uyan içerik kaydı bulunamadı.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {filteredSeoRecords.map((row) => {
              const seoReady = row.missingFields.length === 0;

              return (
                <article
                  key={row.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-[11px] text-zinc-300">
                          {row.entityType}
                        </span>
                        <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-[11px] text-zinc-500">
                          {row.locale}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            row.isPublished
                              ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
                              : "border-zinc-700 bg-zinc-900 text-zinc-300"
                          }`}
                        >
                          {row.isPublished ? "Yayında" : "Taslak"}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] ${
                            seoReady
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {seoReady ? "SEO hazır" : "SEO eksik"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-sm font-semibold text-white">{row.title}</h3>
                      <p className="mt-2 text-xs text-zinc-400">
                        Slug: {row.slug?.trim() ? `/${row.slug}` : "tanımlı değil"}
                      </p>

                      {row.missingFields.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.missingFields.map((field) => (
                            <span
                              key={`${row.id}-${field}`}
                              className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-100"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <Link
                      href={getEditorHref(row.entityType, row.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Düzenle
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-start gap-3">
          {publishedWithGapCount > 0 ? (
            <ShieldAlert className="mt-0.5 h-5 w-5 text-zinc-300" />
          ) : (
            <ShieldCheck className="mt-0.5 h-5 w-5 text-zinc-300" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">Kapanış notu</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
              Skyvan repo gerçekliğinde bağımsız bir global settings tablosu yok. Bu
              yüzden bu yüzey mevcut runtime flag’lerini ve gerçek içerik SEO alanlarını
              yönetilebilir hale getirir; hayali ayar sistemi kurmaz.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
