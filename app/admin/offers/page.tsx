import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db/db";
import { buildVersions, builds, leads, models, offers } from "@/db/schema";

import { AddOfferDrawer } from "./AddOfferDrawer";
import { deleteOffer } from "./actions";

type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

function getStatusBadge(status: OfferStatus) {
  if (status === "accepted") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "sent") {
    return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }

  if (status === "rejected") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-300";
  }

  if (status === "expired") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  return "border-zinc-700 bg-zinc-800 text-zinc-300";
}

function getStatusLabel(status: OfferStatus) {
  if (status === "draft") return "Taslak";
  if (status === "sent") return "Gönderildi";
  if (status === "accepted") return "Kabul edildi";
  if (status === "rejected") return "Reddedildi";
  return "Süresi geçti";
}

function formatMoney(amount: string | number | null) {
  if (amount == null) return "—";

  const numeric = Number(amount);

  if (Number.isNaN(numeric)) {
    return String(amount);
  }

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isPastDate(value: Date | string | null | undefined) {
  if (!value) return false;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const target = new Date(date);
  target.setHours(23, 59, 59, 999);

  return target.getTime() < Date.now();
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1.5 text-xs">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    new?: string;
    edit?: string;
  }>;
}) {
  if (!db) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-400">
        Veritabanı bağlantısı kurulamadı.
      </div>
    );
  }

  const params = await searchParams;
  const isDrawerOpen = params.new === "true" || typeof params.edit === "string";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const selectedStatus =
    typeof params.status === "string" ? params.status.trim() : "all";

  const whereClause = and(
    selectedStatus !== "all"
      ? eq(offers.status, selectedStatus as OfferStatus)
      : undefined,
    q
      ? or(
          ilike(offers.offerReference, `%${q}%`),
          ilike(leads.fullName, `%${q}%`),
          ilike(leads.email, `%${q}%`),
          ilike(builds.shortCode, `%${q}%`),
          ilike(models.slug, `%${q}%`)
        )
      : undefined
  );

  const [offerRows, leadRows, summaryRows] = await Promise.all([
    db
      .select({
        id: offers.id,
        leadId: offers.leadId,
        offerReference: offers.offerReference,
        validUntil: offers.validUntil,
        totalAmount: offers.totalAmount,
        status: offers.status,
        createdAt: offers.createdAt,
        leadName: leads.fullName,
        leadEmail: leads.email,
        buildVersionId: leads.buildVersionId,
        buildShortCode: builds.shortCode,
        versionNumber: buildVersions.versionNumber,
        modelSlug: models.slug,
      })
      .from(offers)
      .leftJoin(leads, eq(offers.leadId, leads.id))
      .leftJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
      .leftJoin(builds, eq(buildVersions.buildId, builds.id))
      .leftJoin(models, eq(builds.modelId, models.id))
      .where(whereClause)
      .orderBy(desc(offers.createdAt)),

    db
      .select({
        id: leads.id,
        fullName: leads.fullName,
        email: leads.email,
        buildVersionId: leads.buildVersionId,
        buildShortCode: builds.shortCode,
        versionNumber: buildVersions.versionNumber,
        modelSlug: models.slug,
      })
      .from(leads)
      .leftJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
      .leftJoin(builds, eq(buildVersions.buildId, builds.id))
      .leftJoin(models, eq(builds.modelId, models.id))
      .orderBy(desc(leads.createdAt)),

    db
      .select({
        status: offers.status,
        count: sql<number>`count(*)::int`,
      })
      .from(offers)
      .groupBy(offers.status),
  ]);

  const summaryMap = new Map(
    summaryRows.map((row) => [row.status, Number(row.count ?? 0)])
  );

  const totalOffers = summaryRows.reduce(
    (acc, row) => acc + Number(row.count ?? 0),
    0
  );

  const leadOptions = leadRows.map((lead) => ({
    id: lead.id,
    label: lead.fullName,
    meta: [
      lead.email ?? null,
      lead.buildShortCode
        ? `${lead.buildShortCode} · v${lead.versionNumber ?? "—"}`
        : null,
      lead.modelSlug ? `Model: ${lead.modelSlug}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const editItem =
    typeof params.edit === "string"
      ? offerRows.find((item) => item.id === params.edit) ?? null
      : null;

  const initialData = editItem
    ? {
        id: editItem.id,
        leadId: editItem.leadId,
        offerReference: editItem.offerReference,
        validUntil: toDateInputValue(editItem.validUntil),
        totalAmount: String(editItem.totalAmount ?? ""),
        status: editItem.status as OfferStatus,
      }
    : null;

  const statusTabs: Array<{ key: "all" | OfferStatus; label: string }> = [
    { key: "all", label: "Tümü" },
    { key: "draft", label: "Taslak" },
    { key: "sent", label: "Gönderildi" },
    { key: "accepted", label: "Kabul" },
    { key: "rejected", label: "Red" },
    { key: "expired", label: "Süresi geçti" },
  ];

  const enrichedOffers = offerRows
    .map((offer) => {
      const overdue =
        offer.status !== "accepted" &&
        offer.status !== "rejected" &&
        offer.status !== "expired" &&
        isPastDate(offer.validUntil);

      const sortPriority =
        overdue ? 0 : offer.status === "sent" ? 1 : offer.status === "draft" ? 2 : 3;

      return {
        ...offer,
        overdue,
        sortPriority,
      };
    })
    .sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) {
        return a.sortPriority - b.sortPriority;
      }

      const aCreatedAt = new Date(a.createdAt).getTime();
      const bCreatedAt = new Date(b.createdAt).getTime();

      return bCreatedAt - aCreatedAt;
    });

  const riskyCount =
    enrichedOffers.filter((item) => item.overdue).length +
    (summaryMap.get("rejected") ?? 0) +
    (summaryMap.get("expired") ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Teklifler
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Teklif Yönetimi
          </h1>
          <p className="max-w-3xl text-sm leading-5 text-zinc-400">
            Müşteri adayına bağlı teklifleri durum, geçerlilik ve tutar sinyalleriyle izle.
          </p>
        </div>

        <Link
          href={leadOptions.length > 0 ? "/admin/offers?new=true" : "/admin/leads"}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            leadOptions.length > 0
              ? "bg-white text-black hover:bg-zinc-200"
              : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
          }`}
        >
          {leadOptions.length > 0 ? "Yeni teklif" : "Önce lead oluştur"}
        </Link>
      </div>

      {leadOptions.length === 0 ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm leading-5 text-amber-200">
          Teklif oluşturma kapalı. Çünkü teklif kaydı bir müşteri adayına
          bağlıdır ve müşteri adayı da proje sürümü bağı ister. Önce uygun bir
          müşteri adayı oluşturulmalı.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatChip label="Toplam" value={totalOffers} />
        <StatChip label="Gönderildi" value={summaryMap.get("sent") ?? 0} />
        <StatChip label="Kabul" value={summaryMap.get("accepted") ?? 0} />
        <StatChip label="Riskli" value={riskyCount} />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <form className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.key;

              const nextParams = new URLSearchParams();
              if (q) nextParams.set("q", q);
              if (tab.key !== "all") nextParams.set("status", tab.key);

              return (
                <Link
                  key={tab.key}
                  href={`/admin/offers${
                    nextParams.toString() ? `?${nextParams.toString()}` : ""
                  }`}
                  className={`rounded-full px-2.5 py-1 text-xs transition ${
                    isActive
                      ? "bg-white text-black"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Referans, ad, e-posta veya proje kodu ara"
              className="w-full min-w-[260px] rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <input type="hidden" name="status" value={selectedStatus} />

            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200"
              >
                Uygula
              </button>

              <Link
                href="/admin/offers"
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Sıfırla
              </Link>
            </div>
          </div>
        </form>
      </div>

      {enrichedOffers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-8 text-center">
          <p className="text-lg font-medium text-white">Henüz teklif yok</p>
          <p className="mt-2 text-sm text-zinc-400">
            {leadOptions.length > 0
              ? "İlk teklifi oluşturup satış hattını başlat."
              : "Önce müşteri adayı oluştur, sonra teklif omurgasını aç."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {enrichedOffers.map((offer) => (
            <article
              key={offer.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-zinc-700"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold tracking-tight text-white">
                      {offer.offerReference}
                    </h2>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusBadge(
                        offer.status as OfferStatus
                      )}`}
                    >
                      {getStatusLabel(offer.status as OfferStatus)}
                    </span>

                    {offer.overdue ? (
                      <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                        geçerlilik geçmiş
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-zinc-200">
                    {offer.leadName ?? "Müşteri adayı yok"}
                    {offer.leadEmail ? ` · ${offer.leadEmail}` : ""}
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    {offer.buildShortCode
                      ? `${offer.buildShortCode} · v${offer.versionNumber ?? "—"}`
                      : "Proje bağı yok"}
                    {offer.modelSlug ? ` · Model: ${offer.modelSlug}` : ""}
                  </p>

                  <p className="mt-2 text-base font-medium text-white">
                    ₺ {formatMoney(offer.totalAmount)}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Geçerlilik: {formatDate(offer.validUntil)} · Oluşturma:{" "}
                    {formatDate(offer.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                  <Link
                    href={`/admin/offers?edit=${offer.id}`}
                    className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                  >
                    Düzenle
                  </Link>

                  <form action={deleteOffer.bind(null, offer.id)}>
                    <button
                      type="submit"
                      className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isDrawerOpen ? (
        <AddOfferDrawer leadOptions={leadOptions} initialData={initialData} />
      ) : null}
    </div>
  );
}
