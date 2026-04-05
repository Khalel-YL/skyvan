import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";

import { getDbOrThrow } from "@/db/db";
import { buildVersions, leads, offers, orders, productionUpdates } from "@/db/schema";

import { AddOrderDrawer } from "./AddOrderDrawer";
import { AddProductionUpdateForm } from "./AddProductionUpdateForm";
import { EditOrderForm } from "./EditOrderForm";

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

type OrderUpdateItem = {
  id: string;
  orderId: string;
  stage: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
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

function normalizeStageToProductionStatus(value: string): ProductionStatus {
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

  return "pending";
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

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

  if (!Number.isFinite(numeric)) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(numeric);
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

function daysUntil(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function daysSince(value: Date | string | null) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const now = Date.now();
  return Math.floor((now - date.getTime()) / 86400000);
}

function riskChipClass(kind: "warning" | "danger" | "neutral") {
  switch (kind) {
    case "danger":
      return "border-red-900/70 bg-red-950/50 text-red-200";
    case "warning":
      return "border-amber-900/70 bg-amber-950/50 text-amber-200";
    default:
      return "border-zinc-800 bg-zinc-950 text-zinc-300";
  }
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

      offerId: offers.id,
      offerReference: offers.offerReference,
      validUntil: offers.validUntil,
      totalAmount: offers.totalAmount,

      leadId: leads.id,
      leadName: leads.fullName,
      leadEmail: leads.email,
      leadPhoneNumber: leads.phoneNumber,

      buildVersionId: buildVersions.id,
      buildVersionNumber: buildVersions.versionNumber,

      updatesCount: sql<number>`cast(count(${productionUpdates.id}) as int)`,
      lastUpdateAt: sql<Date | null>`max(${productionUpdates.createdAt})`,
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
      offers.id,
      offers.offerReference,
      offers.validUntil,
      offers.totalAmount,
      leads.id,
      leads.fullName,
      leads.email,
      leads.phoneNumber,
      buildVersions.id,
      buildVersions.versionNumber,
    )
    .orderBy(desc(orders.updatedAt), desc(orders.createdAt));

  const orderIds = rows.map((row) => row.id);

  const updateRows: OrderUpdateItem[] =
    orderIds.length > 0
      ? await db
          .select({
            id: productionUpdates.id,
            orderId: productionUpdates.orderId,
            stage: productionUpdates.stage,
            description: productionUpdates.description,
            imageUrl: productionUpdates.imageUrl,
            createdAt: productionUpdates.createdAt,
          })
          .from(productionUpdates)
          .where(inArray(productionUpdates.orderId, orderIds))
          .orderBy(desc(productionUpdates.createdAt))
      : [];

  const updatesByOrderId = new Map<string, OrderUpdateItem[]>();

  for (const update of updateRows) {
    const existing = updatesByOrderId.get(update.orderId) ?? [];
    existing.push(update);
    updatesByOrderId.set(update.orderId, existing);
  }

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
    eligibleOffers: availableOffers.length,
    overdueDelivery: rows.filter((row) => {
      const days = daysUntil(row.estimatedDeliveryDate);
      return days !== null && days < 0 && row.productionStatus !== "completed";
    }).length,
    dueSoon: rows.filter((row) => {
      const days = daysUntil(row.estimatedDeliveryDate);
      return days !== null && days >= 0 && days <= 7 && row.productionStatus !== "completed";
    }).length,
    stale: rows.filter((row) => {
      const days = daysSince(row.lastUpdateAt ?? row.updatedAt);
      return days !== null && days >= 10 && row.productionStatus !== "completed";
    }).length,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-900 bg-black/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              Operasyon Merkezi
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Orders</h1>
            <p className="max-w-3xl text-sm text-zinc-400">
              Kabul edilmiş tekliflerden açılan siparişleri üretim akışıyla birlikte yönet.
              Order artık doğrudan uygun offer listesinden açılır, üretim güncellemeleri kart
              içinde görünür ve operasyon bilgileri aynı ekranda kontrol edilir.
            </p>
          </div>

          <div className="w-full xl:max-w-xl">
            <AddOrderDrawer offers={availableOffers} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Toplam</div>
          <div className="mt-2 text-2xl font-semibold text-white">{metrics.total}</div>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Bekliyor</div>
          <div className="mt-2 text-2xl font-semibold text-white">{metrics.pending}</div>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Üretimde</div>
          <div className="mt-2 text-2xl font-semibold text-white">{metrics.inProgress}</div>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Tamamlandı</div>
          <div className="mt-2 text-2xl font-semibold text-white">{metrics.completed}</div>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">VIN Eksik</div>
          <div className="mt-2 text-2xl font-semibold text-white">{metrics.missingVin}</div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Uygun Offer</div>
          <div className="mt-2 text-xl font-semibold text-white">{metrics.eligibleOffers}</div>
          <p className="mt-2 text-xs text-zinc-500">
            Accepted ve henüz order’a bağlanmamış teklif sayısı.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-900/30 bg-amber-950/10 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-amber-300/80">
            Teslime Yakın
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{metrics.dueSoon}</div>
          <p className="mt-2 text-xs text-zinc-500">
            7 gün içinde teslimi görünen ve tamamlanmamış kayıtlar.
          </p>
        </div>

        <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-red-300/80">Teslim Gecikmiş</div>
          <div className="mt-2 text-xl font-semibold text-white">{metrics.overdueDelivery}</div>
          <p className="mt-2 text-xs text-zinc-500">
            Tahmini teslim tarihi geçmiş ama tamamlanmamış kayıtlar.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Sessiz Kayıt</div>
          <div className="mt-2 text-xl font-semibold text-white">{metrics.stale}</div>
          <p className="mt-2 text-xs text-zinc-500">
            10+ gündür güncelleme almayan ve hâlâ açık durumda olan kayıtlar.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-900 bg-zinc-950/40 p-4">
        <form className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-2">
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
                <a
                  key={item.value}
                  href={href}
                  className={[
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white",
                  ].join(" ")}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Müşteri, teklif, e-posta veya VIN ara"
              className="w-full min-w-[260px] rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700 lg:w-[320px]"
            />
            {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
            <button
              type="submit"
              className="rounded-2xl border border-zinc-800 bg-zinc-100 px-4 py-2 text-sm font-medium text-black transition hover:bg-white"
            >
              Ara
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/30 p-8 text-center">
            <div className="text-sm font-medium text-white">Henüz order kaydı yok</div>
            <p className="mt-2 text-sm text-zinc-400">
              İlk order yalnızca accepted durumundaki ve henüz order’a bağlanmamış bir offer
              kaydından açılabilir.
            </p>
          </div>
        ) : (
          rows.map((row) => {
            const hasRisk =
              (row.productionStatus === "testing" || row.productionStatus === "completed") &&
              !row.vinNumber;

            const deliveryDays = daysUntil(row.estimatedDeliveryDate);
            const staleDays = daysSince(row.lastUpdateAt ?? row.updatedAt);
            const timeline = updatesByOrderId.get(row.id) ?? [];
            const latestUpdate = timeline[0] ?? null;

            return (
              <article
                key={row.id}
                className="rounded-3xl border border-zinc-900 bg-zinc-950/50 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-zinc-800 bg-black px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-300">
                          {row.offerReference}
                        </span>
                        <h2 className="text-base font-semibold text-white">{row.leadName}</h2>
                        <span
                          className={[
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                            statusBadgeClass(row.productionStatus),
                          ].join(" ")}
                        >
                          {stageLabel(row.productionStatus)}
                        </span>

                        {hasRisk ? (
                          <span className="rounded-full border border-amber-900/70 bg-amber-950/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200">
                            VIN eksik
                          </span>
                        ) : null}

                        {deliveryDays !== null &&
                        deliveryDays < 0 &&
                        row.productionStatus !== "completed" ? (
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                              riskChipClass("danger"),
                            ].join(" ")}
                          >
                            Teslim gecikmiş
                          </span>
                        ) : null}

                        {deliveryDays !== null &&
                        deliveryDays >= 0 &&
                        deliveryDays <= 7 &&
                        row.productionStatus !== "completed" ? (
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                              riskChipClass("warning"),
                            ].join(" ")}
                          >
                            Teslim yakın
                          </span>
                        ) : null}

                        {staleDays !== null &&
                        staleDays >= 10 &&
                        row.productionStatus !== "completed" ? (
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                              riskChipClass("neutral"),
                            ].join(" ")}
                          >
                            {staleDays} gündür sessiz
                          </span>
                        ) : null}
                      </div>

                      <div className="grid gap-2 text-sm text-zinc-400 md:grid-cols-2 xl:grid-cols-4">
                        <div>
                          <span className="text-zinc-500">Build Version:</span> V{row.buildVersionNumber}
                        </div>
                        <div>
                          <span className="text-zinc-500">Tutar:</span> {formatCurrency(row.totalAmount)}
                        </div>
                        <div>
                          <span className="text-zinc-500">E-posta:</span> {row.leadEmail || "-"}
                        </div>
                        <div>
                          <span className="text-zinc-500">Telefon:</span> {row.leadPhoneNumber || "-"}
                        </div>
                        <div>
                          <span className="text-zinc-500">Teslim:</span> {formatDate(row.estimatedDeliveryDate)}
                        </div>
                        <div>
                          <span className="text-zinc-500">VIN:</span> {row.vinNumber || "-"}
                        </div>
                        <div>
                          <span className="text-zinc-500">Güncelleme:</span> {row.updatesCount}
                        </div>
                        <div>
                          <span className="text-zinc-500">Son hareket:</span> {formatDateTime(row.lastUpdateAt)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                              Son üretim özeti
                            </div>
                            {latestUpdate ? (
                              <div className="mt-2 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={[
                                      "rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em]",
                                      statusBadgeClass(normalizeStageToProductionStatus(latestUpdate.stage)),
                                    ].join(" ")}
                                  >
                                    {stageLabel(latestUpdate.stage)}
                                  </span>
                                  <span className="text-xs text-zinc-500">
                                    {formatDateTime(latestUpdate.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-300">{latestUpdate.description}</p>
                                {latestUpdate.imageUrl ? (
                                  <a
                                    href={latestUpdate.imageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex text-xs text-zinc-400 underline underline-offset-4 hover:text-white"
                                  >
                                    Görsel bağlantısını aç
                                  </a>
                                ) : null}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-zinc-500">
                                Henüz üretim güncellemesi eklenmemiş.
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-zinc-500">
                            Toplam {timeline.length} kayıt
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <EditOrderForm
                      id={row.id}
                      offerId={row.offerId}
                      productionStatus={row.productionStatus}
                      estimatedDeliveryDate={
                        row.estimatedDeliveryDate ? String(row.estimatedDeliveryDate) : ""
                      }
                      vinNumber={row.vinNumber ?? ""}
                    />
                    <AddProductionUpdateForm orderId={row.id} />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}