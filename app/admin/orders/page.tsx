import Link from "next/link";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { buildVersions, leads, offers, orders, productionUpdates } from "@/db/schema";

import { AddOrderDrawer } from "./AddOrderDrawer";

type SearchParamsInput =
  | Promise<{
      q?: string;
      status?: string;
    }>
  | {
      q?: string;
      status?: string;
    }
  | undefined;

type Props = {
  searchParams?: SearchParamsInput;
};

type ProductionStatus =
  | "pending"
  | "chassis"
  | "insulation"
  | "furniture"
  | "systems"
  | "testing"
  | "completed";

type AcceptedOfferOption = {
  offerId: string;
  offerReference: string;
  leadName: string;
  leadEmail: string | null;
  buildVersionNumber: number;
};

const STATUS_OPTIONS: Array<{ value: "all" | ProductionStatus; label: string }> = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Bekliyor" },
  { value: "chassis", label: "Şasi" },
  { value: "insulation", label: "İzolasyon" },
  { value: "furniture", label: "Mobilya" },
  { value: "systems", label: "Sistemler" },
  { value: "testing", label: "Test" },
  { value: "completed", label: "Tamamlandı" },
];

function normalizeStatus(value: string): "all" | ProductionStatus {
  if (
    value === "pending" ||
    value === "chassis" ||
    value === "insulation" ||
    value === "furniture" ||
    value === "systems" ||
    value === "testing" ||
    value === "completed"
  ) {
    return value;
  }

  return "all";
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value: string | number | null) {
  if (value === null || value === undefined) return "-";

  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function stageLabel(value: string) {
  switch (value) {
    case "pending":
      return "Bekliyor";
    case "chassis":
      return "Şasi";
    case "insulation":
      return "İzolasyon";
    case "furniture":
      return "Mobilya";
    case "systems":
      return "Sistemler";
    case "testing":
      return "Test";
    case "completed":
      return "Tamamlandı";
    default:
      return value;
  }
}

function statusBadgeClass(status: ProductionStatus) {
  switch (status) {
    case "pending":
      return "border-zinc-700 bg-zinc-900 text-zinc-200";
    case "chassis":
      return "border-sky-900/80 bg-sky-950/70 text-sky-200";
    case "insulation":
      return "border-amber-900/80 bg-amber-950/70 text-amber-200";
    case "furniture":
      return "border-orange-900/80 bg-orange-950/70 text-orange-200";
    case "systems":
      return "border-cyan-900/80 bg-cyan-950/70 text-cyan-200";
    case "testing":
      return "border-violet-900/80 bg-violet-950/70 text-violet-200";
    case "completed":
      return "border-emerald-900/80 bg-emerald-950/70 text-emerald-200";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-200";
  }
}

function daysUntil(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function daysSince(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function operationNote(params: {
  productionStatus: ProductionStatus;
  vinNumber: string | null;
  estimatedDeliveryDate: Date | string | null;
  lastActivityAt: Date | string | null;
  updatesCount: number;
}) {
  const { productionStatus, vinNumber, estimatedDeliveryDate, lastActivityAt, updatesCount } = params;

  if (!vinNumber && (productionStatus === "testing" || productionStatus === "completed")) {
    return "VIN gerekli";
  }

  const deliveryDays = daysUntil(estimatedDeliveryDate);
  if (deliveryDays !== null && deliveryDays < 0 && productionStatus !== "completed") {
    return "Teslim gecikmiş";
  }

  const staleDays = daysSince(lastActivityAt);
  if (staleDays !== null && staleDays >= 10 && productionStatus !== "completed") {
    return "Sessiz kayıt";
  }

  if (updatesCount === 0 && productionStatus !== "pending") {
    return "Timeline boş";
  }

  if (updatesCount > 0) {
    return "Timeline aktif";
  }

  return "Normal";
}

export default async function OrdersPage({ searchParams }: Props) {
  const db = getDbOrThrow();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const q = String(resolvedSearchParams?.q ?? "").trim();
  const status = normalizeStatus(String(resolvedSearchParams?.status ?? "all"));

  const whereConditions = [];

  if (status !== "all") {
    whereConditions.push(eq(orders.productionStatus, status));
  }

  if (q) {
    whereConditions.push(
      or(
        ilike(offers.offerReference, `%${q}%`),
        ilike(leads.fullName, `%${q}%`),
        ilike(leads.email, `%${q}%`),
        ilike(orders.vinNumber, `%${q}%`),
      )!,
    );
  }

  const rows = await db
    .select({
      id: orders.id,
      productionStatus: orders.productionStatus,
      estimatedDeliveryDate: orders.estimatedDeliveryDate,
      vinNumber: orders.vinNumber,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,

      offerReference: offers.offerReference,
      validUntil: offers.validUntil,
      totalAmount: offers.totalAmount,

      leadName: leads.fullName,
      leadEmail: leads.email,
      leadPhoneNumber: leads.phoneNumber,

      buildVersionNumber: buildVersions.versionNumber,

      updatesCount: sql<number>`cast(count(${productionUpdates.id}) as int)`,
      lastUpdateAt: sql<Date | null>`max(${productionUpdates.createdAt})`,
      latestStage: sql<string | null>`(
        select pu.stage
        from production_updates pu
        where pu.order_id = ${orders.id}
        order by pu.created_at desc
        limit 1
      )`,
    })
    .from(orders)
    .innerJoin(offers, eq(orders.offerId, offers.id))
    .innerJoin(leads, eq(offers.leadId, leads.id))
    .innerJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
    .leftJoin(productionUpdates, eq(productionUpdates.orderId, orders.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .groupBy(
      orders.id,
      orders.productionStatus,
      orders.estimatedDeliveryDate,
      orders.vinNumber,
      orders.createdAt,
      orders.updatedAt,
      offers.offerReference,
      offers.validUntil,
      offers.totalAmount,
      leads.fullName,
      leads.email,
      leads.phoneNumber,
      buildVersions.versionNumber,
    )
    .orderBy(desc(orders.updatedAt), desc(orders.createdAt));

  const availableOffers: AcceptedOfferOption[] = await db
    .select({
      offerId: offers.id,
      offerReference: offers.offerReference,
      leadName: leads.fullName,
      leadEmail: leads.email,
      buildVersionNumber: buildVersions.versionNumber,
    })
    .from(offers)
    .innerJoin(leads, eq(offers.leadId, leads.id))
    .innerJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
    .leftJoin(orders, eq(orders.offerId, offers.id))
    .where(and(eq(offers.status, "accepted"), isNull(orders.id)))
    .orderBy(desc(offers.createdAt));

  const metrics = {
    total: rows.length,
    pending: rows.filter((row) => row.productionStatus === "pending").length,
    inProgress: rows.filter(
      (row) =>
        row.productionStatus === "chassis" ||
        row.productionStatus === "insulation" ||
        row.productionStatus === "furniture" ||
        row.productionStatus === "systems" ||
        row.productionStatus === "testing",
    ).length,
    completed: rows.filter((row) => row.productionStatus === "completed").length,
    missingVin: rows.filter((row) => !row.vinNumber).length,
    dueSoon: rows.filter((row) => {
      const days = daysUntil(row.estimatedDeliveryDate);
      return days !== null && days >= 0 && days <= 7 && row.productionStatus !== "completed";
    }).length,
    overdue: rows.filter((row) => {
      const days = daysUntil(row.estimatedDeliveryDate);
      return days !== null && days < 0 && row.productionStatus !== "completed";
    }).length,
    stale: rows.filter((row) => {
      const lastActivityAt = row.lastUpdateAt ?? row.updatedAt;
      const days = daysSince(lastActivityAt);
      return days !== null && days >= 10 && row.productionStatus !== "completed";
    }).length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Operasyon Merkezi
            </div>
            <h1 className="text-2xl font-semibold text-white">Orders</h1>
            <p className="max-w-3xl text-sm text-zinc-400">
              Kabul edilmiş tekliflerdен açılan siparişleri yönet. Bu batch ile order
              listesinden detay sayfasına geçiş yapılır; üretim güncellemeleri ise artık
              order detayında timeline olarak izlenir.
            </p>
          </div>

          <AddOrderDrawer offers={availableOffers} />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Toplam" value={metrics.total} />
        <MetricCard label="Bekliyor" value={metrics.pending} />
        <MetricCard label="Üretimde" value={metrics.inProgress} />
        <MetricCard label="Tamamlandı" value={metrics.completed} />
        <MetricCard label="VIN Eksik" value={metrics.missingVin} />
        <MetricCard label="Teslime Yakın" value={metrics.dueSoon} />
        <MetricCard label="Teslim Gecikmiş" value={metrics.overdue} />
        <MetricCard label="Sessiz Kayıt" value={metrics.stale} />
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((item) => {
              const href =
                item.value === "all"
                  ? q
                    ? `/admin/orders?q=${encodeURIComponent(q)}`
                    : "/admin/orders"
                  : q
                    ? `/admin/orders?status=${item.value}&q=${encodeURIComponent(q)}`
                    : `/admin/orders?status=${item.value}`;

              const isActive = status === item.value;

              return (
                <Link
                  key={item.value}
                  href={href}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-zinc-200 bg-zinc-100 text-black"
                      : "border-zinc-800 bg-black text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <form className="flex w-full gap-2 lg:max-w-md">
            <input type="hidden" name="status" value={status} />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Offer, müşteri, e-posta veya VIN ara"
              className="w-full rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />
            <button
              type="submit"
              className="rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Ara
            </button>
          </form>
        </div>
      </section>

      {rows.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
          <h2 className="text-lg font-medium text-white">Henüz order kaydı yok</h2>
          <p className="mt-2 text-sm text-zinc-400">
            İlk order yalnızca accepted durumundaki ve henüz order’a bağlanmamış bir
            offer kaydından açılabilir.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {rows.map((row) => {
            const deliveryDays = daysUntil(row.estimatedDeliveryDate);
            const lastActivityAt = row.lastUpdateAt ?? row.updatedAt;
            const staleDays = daysSince(lastActivityAt);
            const note = operationNote({
              productionStatus: row.productionStatus,
              vinNumber: row.vinNumber,
              estimatedDeliveryDate: row.estimatedDeliveryDate,
              lastActivityAt,
              updatesCount: row.updatesCount,
            });

            return (
              <article
                key={row.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3 xl:flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400">
                        {row.offerReference}
                      </div>
                      <div
                        className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(
                          row.productionStatus,
                        )}`}
                      >
                        {stageLabel(row.productionStatus)}
                      </div>

                      {row.latestStage ? (
                        <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                          Son kayıt: {stageLabel(row.latestStage)}
                        </div>
                      ) : null}

                      {note === "VIN gerekli" ? (
                        <div className="rounded-full border border-red-900/70 bg-red-950/50 px-3 py-1 text-xs text-red-200">
                          VIN eksik
                        </div>
                      ) : null}

                      {note === "Teslim gecikmiş" ? (
                        <div className="rounded-full border border-red-900/70 bg-red-950/50 px-3 py-1 text-xs text-red-200">
                          Teslim gecikmiş
                        </div>
                      ) : null}

                      {deliveryDays !== null &&
                      deliveryDays >= 0 &&
                      deliveryDays <= 7 &&
                      row.productionStatus !== "completed" ? (
                        <div className="rounded-full border border-amber-900/70 bg-amber-950/50 px-3 py-1 text-xs text-amber-200">
                          Teslim yakın
                        </div>
                      ) : null}

                      {note === "Sessiz kayıt" ? (
                        <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                          {staleDays} gündür sessiz
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold text-white">{row.leadName}</h2>
                      <p className="mt-1 text-sm text-zinc-400">
                        Build Version: V{row.buildVersionNumber} · Tutar:{" "}
                        {formatCurrency(row.totalAmount)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-zinc-300 md:grid-cols-2 xl:grid-cols-4">
                      <InfoLine label="E-posta" value={row.leadEmail || "-"} />
                      <InfoLine label="Telefon" value={row.leadPhoneNumber || "-"} />
                      <InfoLine label="Tahmini teslim" value={formatDate(row.estimatedDeliveryDate)} />
                      <InfoLine label="VIN" value={row.vinNumber || "-"} />
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-zinc-400 xl:w-[240px] xl:min-w-[240px]">
                    <InfoLine label="Güncelleme sayısı" value={String(row.updatesCount)} />
                    <InfoLine label="Son hareket" value={formatDateTime(lastActivityAt)} />
                    <InfoLine label="Operasyon notu" value={note} />
                    <InfoLine label="Teklif geçerliliği" value={formatDate(row.validUntil)} />

                    <Link
                      href={`/admin/orders/${row.id}`}
                      className="mt-2 inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-black px-4 py-2 text-sm text-white transition hover:border-zinc-700"
                    >
                      Detaya git
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-1 text-sm text-zinc-200">{value}</div>
    </div>
  );
}