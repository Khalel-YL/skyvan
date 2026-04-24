import { asc } from "drizzle-orm";

import { db, getDatabaseHealth } from "@/db/db";
import { manufacturerSourceRegistries } from "@/db/schema";

import { AddManufacturerSourceDrawer } from "./AddManufacturerSourceDrawer";
import { ManufacturerSourceFilters } from "./ManufacturerSourceFilters";
import { ManufacturerSourceList } from "./ManufacturerSourceList";
import {
  type ManufacturerSourceContentType,
  type ManufacturerSourceFetchMode,
  type ManufacturerSourceRegistryFilterStatus,
  type ManufacturerSourceRegistryFilterType,
  type ManufacturerSourceRegistryListItem,
} from "./types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function normalizeStatus(value: string): ManufacturerSourceRegistryFilterStatus {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "all";
}

function normalizeType(value: string): ManufacturerSourceRegistryFilterType {
  const allowed: ManufacturerSourceContentType[] = [
    "manuals",
    "datasheets",
    "technical_pages",
    "support_pages",
  ];

  if (allowed.includes(value as ManufacturerSourceContentType)) {
    return value as ManufacturerSourceRegistryFilterType;
  }

  return "all";
}

function normalizeFetchMode(value: string): ManufacturerSourceFetchMode {
  if (
    value === "manual_review" ||
    value === "allowed_paths_only" ||
    value === "full_domain_review"
  ) {
    return value;
  }

  return "manual_review";
}

function formatDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

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

export default async function ManufacturerSourcesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};

  const q = getSingleValue(params.q).trim();
  const status = normalizeStatus(getSingleValue(params.status, "all"));
  const type = normalizeType(getSingleValue(params.type, "all"));
  const normalizedQuery = q.toLowerCase();

  const databaseHealth = getDatabaseHealth();

  let loadError: string | null = null;
  let allItems: ManufacturerSourceRegistryListItem[] = [];

  if (db) {
    try {
      const rows = await db
        .select()
        .from(manufacturerSourceRegistries)
        .orderBy(
          asc(manufacturerSourceRegistries.status),
          asc(manufacturerSourceRegistries.manufacturerName),
        );

      allItems = rows.map((row) => ({
        id: row.id,
        manufacturerName: row.manufacturerName,
        domain: row.domain,
        normalizedDomain: row.normalizedDomain,
        allowedContentTypes: Array.isArray(row.allowedContentTypes)
          ? (row.allowedContentTypes as ManufacturerSourceContentType[])
          : [],
        notes: row.notes,
        ingestionEnabled: Boolean(row.ingestionEnabled),
        allowSubdomains: Boolean(row.allowSubdomains),
        respectRobotsTxt:
          typeof row.respectRobotsTxt === "boolean" ? row.respectRobotsTxt : true,
        defaultFetchMode: normalizeFetchMode(String(row.defaultFetchMode ?? "manual_review")),
        pathAllowlist: Array.isArray(row.pathAllowlist) ? (row.pathAllowlist as string[]) : [],
        pathBlocklist: Array.isArray(row.pathBlocklist) ? (row.pathBlocklist as string[]) : [],
        status: row.status === "archived" ? "archived" : "active",
        createdAtLabel: formatDateLabel(row.createdAt),
        updatedAtLabel: formatDateLabel(row.updatedAt),
      }));
    } catch (error) {
      loadError =
        error instanceof Error
          ? error.message
          : "Registry verisi okunurken bilinmeyen bir hata oluştu.";
    }
  }

  const filteredItems = allItems.filter((item) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      item.manufacturerName.toLowerCase().includes(normalizedQuery) ||
      item.domain.toLowerCase().includes(normalizedQuery) ||
      item.normalizedDomain.toLowerCase().includes(normalizedQuery) ||
      (item.notes ?? "").toLowerCase().includes(normalizedQuery);

    const matchesStatus = status === "all" ? true : item.status === status;
    const matchesType = type === "all" ? true : item.allowedContentTypes.includes(type);

    return matchesQuery && matchesStatus && matchesType;
  });

  const activeCount = allItems.filter((item) => item.status === "active").length;
  const archivedCount = allItems.filter((item) => item.status === "archived").length;
  const allowedDomainCount = allItems.length;
  const ingestionEnabledCount = allItems.filter((item) => item.ingestionEnabled).length;

  const canWrite = Boolean(db && !loadError);

  let disabledReason: string | null = null;

  if (!db) {
    disabledReason = "DATABASE_URL tanımlı değil. Admin güvenli statik modda çalışıyor.";
  } else if (loadError) {
    disabledReason =
      "Registry tablosu veya policy kolonları hazır değil. Şema güncellemesini uygulayıp tekrar dene.";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200">
              Üretici Kaynak Kaydı / Final Polish
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Üretici kaynak kayıt ve önizleme paneli
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              Bu ekran, izin verilen üretici domain kayıtlarını, içe alma ayarlarını,
              dry-run kontrolünü ve tekil fetch önizlemesini tek yerde yönetmek için kullanılır.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-5 xl:max-w-[950px]">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/35">
                İzinli domain
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">{allowedDomainCount}</div>
              <div className="mt-1 text-xs text-white/45">kayıt</div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/35">
                Aktif kayıt
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">{activeCount}</div>
              <div className="mt-1 text-xs text-white/45">operasyona açık</div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-wide text-white/35">
                Arşiv kayıt
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">{archivedCount}</div>
              <div className="mt-1 text-xs text-white/45">pasif</div>
            </div>

            <div className="rounded-[24px] border border-sky-400/20 bg-sky-400/10 p-4">
              <div className="text-xs uppercase tracking-wide text-sky-200/70">
                İçe alma açık
              </div>
              <div className="mt-2 text-2xl font-semibold text-sky-100">
                {ingestionEnabledCount}
              </div>
              <div className="mt-1 text-xs text-sky-100/70">aktif kayıt</div>
            </div>

            <div
              className={[
                "rounded-[24px] p-4",
                databaseHealth.status === "online"
                  ? "border border-emerald-400/20 bg-emerald-400/10"
                  : "border border-amber-400/20 bg-amber-400/10",
              ].join(" ")}
            >
              <div
                className={[
                  "text-xs uppercase tracking-wide",
                  databaseHealth.status === "online"
                    ? "text-emerald-200/70"
                    : "text-amber-200/70",
                ].join(" ")}
              >
                Sistem durumu
              </div>
              <div
                className={[
                  "mt-2 text-sm font-semibold",
                  databaseHealth.status === "online"
                    ? "text-emerald-100"
                    : "text-amber-100",
                ].join(" ")}
              >
                {databaseHealth.status === "online" ? "Veritabanı hazır" : "Güvenli mod"}
              </div>
              <div
                className={[
                  "mt-1 text-xs",
                  databaseHealth.status === "online"
                    ? "text-emerald-100/70"
                    : "text-amber-100/70",
                ].join(" ")}
              >
                {databaseHealth.note}
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4">
          <h2 className="text-sm font-semibold text-amber-100">Registry yükleme uyarısı</h2>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">
            Sayfa açıldı ancak registry verisi okunamadı.
          </p>
          <div className="mt-3 rounded-2xl border border-amber-400/20 bg-black/20 px-4 py-3 text-xs text-amber-100/85">
            {loadError}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Bu ekranda olanlar</div>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            <li>- kayıt oluşturma</li>
            <li>- içe alma ayarı</li>
            <li>- dry-run kontrolü</li>
            <li>- fetch önizleme</li>
            <li>- archive / restore</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Bu aşamada yapılmayanlar</div>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            <li>- otomatik crawl</li>
            <li>- kuyruk işlemleri</li>
            <li>- otomatik parse</li>
            <li>- otomatik kayıt üretimi</li>
            <li>- AI evidence bağlama</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">Amaç</div>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Üretici kaynak yönetimini, gereksiz karmaşa olmadan tek ekranda daha sade ve daha
            okunur hale getirmek.
          </p>
        </div>
      </section>

      <ManufacturerSourceFilters q={q} status={status} type={type} />

      <section className="grid gap-6 xl:grid-cols-[1.02fr_1.48fr]">
        <AddManufacturerSourceDrawer
          canWrite={canWrite}
          disabledReason={disabledReason}
        />
        <ManufacturerSourceList items={filteredItems} canMutate={canWrite} />
      </section>
    </div>
  );
}