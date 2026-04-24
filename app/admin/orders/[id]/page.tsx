import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { buildVersions, leads, offers, orders, productionUpdates } from "@/db/schema";

import { AddProductionUpdateForm } from "../AddProductionUpdateForm";
import { EditOrderForm } from "../EditOrderForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type ProductionStatus =
  | "pending"
  | "chassis"
  | "insulation"
  | "furniture"
  | "systems"
  | "testing"
  | "completed";

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

function normalizeDateValue(value: Date | string | null) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
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

function emptyTimelineTitle(status: ProductionStatus) {
  switch (status) {
    case "pending":
      return "Sipariş açıldı, üretim henüz başlamadı";
    case "chassis":
    case "insulation":
    case "furniture":
    case "systems":
    case "testing":
      return "Durum ilerlemiş görünüyor ama timeline boş";
    case "completed":
      return "Sipariş tamamlanmış görünüyor ama timeline boş";
    default:
      return "Henüz üretim güncellemesi yok";
  }
}

function emptyTimelineDescription(status: ProductionStatus) {
  switch (status) {
    case "pending":
      return "İlk üretim kaydını ekleyerek operasyon akışını başlat.";
    case "chassis":
    case "insulation":
    case "furniture":
    case "systems":
    case "testing":
      return "Mevcut durumu açıklayan ilk timeline kaydını girerek kayıt bütünlüğünü tamamla.";
    case "completed":
      return "Completed öncesi geçmiş üretim adımlarını kısaca girmen önerilir.";
    default:
      return "İlk kayıt bu ekrandan girilecek.";
  }
}

function buildOperationNote(params: {
  productionStatus: ProductionStatus;
  hasVin: boolean;
  deliveryDays: number | null;
  staleDays: number | null;
  updatesCount: number;
}) {
  const { productionStatus, hasVin, deliveryDays, staleDays, updatesCount } = params;

  if (!hasVin && (productionStatus === "testing" || productionStatus === "completed")) {
    return "VIN gerekli";
  }

  if (deliveryDays !== null && deliveryDays < 0 && productionStatus !== "completed") {
    return "Teslim gecikmiş";
  }

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

export default async function OrderDetailPage({ params }: Props) {
  const db = getDbOrThrow();
  const { id } = await params;

  const orderRows = await db
    .select({
      id: orders.id,
      offerId: orders.offerId,
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
    })
    .from(orders)
    .innerJoin(offers, eq(orders.offerId, offers.id))
    .innerJoin(leads, eq(offers.leadId, leads.id))
    .innerJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
    .where(eq(orders.id, id))
    .limit(1);

  const order = orderRows[0] ?? null;

  if (!order) {
    notFound();
  }

  const updates = await db
    .select({
      id: productionUpdates.id,
      stage: productionUpdates.stage,
      description: productionUpdates.description,
      imageUrl: productionUpdates.imageUrl,
      createdAt: productionUpdates.createdAt,
    })
    .from(productionUpdates)
    .where(eq(productionUpdates.orderId, order.id))
    .orderBy(desc(productionUpdates.createdAt));

  const updatesCount = updates.length;
  const latestUpdate = updates[0] ?? null;
  const lastActivityAt = latestUpdate?.createdAt ?? order.updatedAt;
  const staleDays = daysSince(lastActivityAt);
  const deliveryDays = daysUntil(order.estimatedDeliveryDate);
  const hasVin = Boolean(order.vinNumber?.trim());
  const isRiskStage =
    order.productionStatus === "testing" || order.productionStatus === "completed";
  const operationNote = buildOperationNote({
    productionStatus: order.productionStatus,
    hasVin,
    deliveryDays,
    staleDays,
    updatesCount,
  });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Link
              href="/admin/orders"
              className="inline-flex rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              ← Orders listesine dön
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400">
                {order.offerReference}
              </div>
              <div
                className={`rounded-full border px-3 py-1 text-xs ${statusBadgeClass(
                  order.productionStatus,
                )}`}
              >
                {stageLabel(order.productionStatus)}
              </div>

              {latestUpdate ? (
                <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                  Son kayıt: {stageLabel(latestUpdate.stage)}
                </div>
              ) : null}

              {!hasVin && isRiskStage ? (
                <div className="rounded-full border border-red-900/80 bg-red-950/50 px-3 py-1 text-xs text-red-200">
                  VIN zorunlu
                </div>
              ) : null}

              {deliveryDays !== null && deliveryDays < 0 && order.productionStatus !== "completed" ? (
                <div className="rounded-full border border-red-900/80 bg-red-950/50 px-3 py-1 text-xs text-red-200">
                  Teslim gecikmiş
                </div>
              ) : null}

              {deliveryDays !== null &&
              deliveryDays >= 0 &&
              deliveryDays <= 7 &&
              order.productionStatus !== "completed" ? (
                <div className="rounded-full border border-amber-900/80 bg-amber-950/50 px-3 py-1 text-xs text-amber-200">
                  Teslim yakın
                </div>
              ) : null}

              {staleDays !== null && staleDays >= 10 && order.productionStatus !== "completed" ? (
                <div className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
                  {staleDays} gündür sessiz
                </div>
              ) : null}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-white">{order.leadName}</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Build Version: V{order.buildVersionNumber} · Tutar:{" "}
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:w-[520px]">
            <InfoLine label="E-posta" value={order.leadEmail || "-"} />
            <InfoLine label="Telefon" value={order.leadPhoneNumber || "-"} />
            <InfoLine label="Tahmini teslim" value={formatDate(order.estimatedDeliveryDate)} />
            <InfoLine label="VIN" value={order.vinNumber || "-"} />
            <InfoLine label="Teklif geçerliliği" value={formatDate(order.validUntil)} />
            <InfoLine label="Order oluşturma" value={formatDateTime(order.createdAt)} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Güncelleme sayısı" value={String(updatesCount)} />
        <MetricCard label="Son hareket" value={formatDateTime(lastActivityAt)} />
        <MetricCard
          label="Teslim görünümü"
          value={
            deliveryDays === null
              ? "-"
              : deliveryDays < 0
                ? `${Math.abs(deliveryDays)} gün gecikmiş`
                : deliveryDays === 0
                  ? "Bugün"
                  : `${deliveryDays} gün kaldı`
          }
        />
        <MetricCard label="Operasyon notu" value={operationNote} />
      </section>

      <section className="grid gap-5 2xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Üretim zaman akışı</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Bu order için eklenen üretim kayıtları burada tutulur.
                </p>
              </div>

              {latestUpdate ? (
                <div className="rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs text-zinc-400">
                  Son kayıt: {stageLabel(latestUpdate.stage)} · {formatDateTime(latestUpdate.createdAt)}
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              {updates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 p-5">
                  <div className="text-sm font-medium text-white">
                    {emptyTimelineTitle(order.productionStatus)}
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    {emptyTimelineDescription(order.productionStatus)}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.map((update, index) => (
                    <div key={update.id} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border border-zinc-700 bg-zinc-200" />
                      {index !== updates.length - 1 ? (
                        <div className="absolute left-[5px] top-5 h-[calc(100%+12px)] w-px bg-zinc-800" />
                      ) : null}

                      <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-300">
                            {stageLabel(update.stage)}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {formatDateTime(update.createdAt)}
                          </div>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">
                          {update.description}
                        </p>

                        {update.imageUrl ? (
                          <div className="mt-3">
                            <a
                              href={update.imageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white transition hover:border-zinc-700"
                            >
                              Görsel bağlantısını aç
                            </a>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <EditOrderForm
            id={order.id}
            offerId={order.offerId}
            productionStatus={order.productionStatus}
            estimatedDeliveryDate={normalizeDateValue(order.estimatedDeliveryDate)}
            vinNumber={order.vinNumber ?? ""}
            updatesCount={updatesCount}
          />

          <AddProductionUpdateForm
            orderId={order.id}
            currentStatus={order.productionStatus}
            hasVin={hasVin}
          />
        </div>
      </section>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      <div className="mt-2 text-sm font-medium text-white">{value}</div>
    </div>
  );
}