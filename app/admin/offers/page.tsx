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

function formatMoney(amount: string | number | null) {
  if (amount == null) return "—";

  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return String(amount);

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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
    return <div className="p-6 text-white">DB yok</div>;
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
        )
      : undefined,
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

  const summaryMap = new Map<string, number>(
    summaryRows.map((row) => [row.status, Number(row.count ?? 0)]),
  );

  const totalOffers = summaryRows.reduce(
    (acc, row) => acc + Number(row.count ?? 0),
    0,
  );

  const leadOptions = leadRows.map((lead) => ({
    id: lead.id,
    label: lead.fullName,
    meta: [
      lead.email ?? null,
      lead.buildShortCode ? `${lead.buildShortCode} · v${lead.versionNumber ?? "—"}` : null,
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
        validUntil: editItem.validUntil
          ? new Date(editItem.validUntil).toISOString().slice(0, 10)
          : "",
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

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Admin · Offers
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Teklif Yönetimi</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Offer çekirdeği lead kaydına bağlıdır. İmza, mühür ve order geçişi bu omurga
            üstüne eklenecek.
          </p>
        </div>

        <Link
          href={leadOptions.length > 0 ? "/admin/offers?new=true" : "/admin/leads"}
          className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
            leadOptions.length > 0
              ? "bg-white text-black hover:bg-zinc-200"
              : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
          }`}
        >
          {leadOptions.length > 0 ? "Yeni teklif" : "Önce lead oluştur"}
        </Link>
      </div>

      {leadOptions.length === 0 ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
          Teklif oluşturma kapalı. Çünkü gerçek şemada offers kaydı bir lead’e bağlıdır ve
          lead kaydı da build version bağı ister. Önce uygun bir lead oluşturulmalı.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Toplam teklif</p>
          <p className="mt-3 text-2xl font-semibold text-white">{totalOffers}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Gönderildi</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {summaryMap.get("sent") ?? 0}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Kabul</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {summaryMap.get("accepted") ?? 0}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Riskli</p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {(summaryMap.get("rejected") ?? 0) + (summaryMap.get("expired") ?? 0)}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
        <form className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={{
                    pathname: "/admin/offers",
                    query: {
                      ...(q ? { q } : {}),
                      ...(tab.key !== "all" ? { status: tab.key } : {}),
                    },
                  }}
                  className={`rounded-2xl border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-white bg-white text-black"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Referans, ad veya e-posta ara"
              className="w-72 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-700"
            />
            <input type="hidden" name="status" value={selectedStatus} />
            <button
              type="submit"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:text-white"
            >
              Uygula
            </button>
            <Link
              href="/admin/offers"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </div>
        </form>
      </div>

      {offerRows.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <p className="text-lg font-medium">Henüz teklif yok</p>
          <p className="mt-2 text-sm text-zinc-500">
            {leadOptions.length > 0
              ? "İlk teklifi oluşturup satış hattını başlat."
              : "Önce lead üret, sonra teklif omurgasını aç."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offerRows.map((offer) => (
            <div
              key={offer.id}
              className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"
            >
              <div className="space-y-1">
                <p className="text-lg font-medium">{offer.offerReference}</p>
                <p className="text-sm text-zinc-400">
                  {offer.leadName ?? "Lead yok"}
                  {offer.leadEmail ? ` · ${offer.leadEmail}` : ""}
                </p>
                <p className="text-sm text-zinc-500">
                  {offer.buildShortCode
                    ? `${offer.buildShortCode} · v${offer.versionNumber ?? "—"}`
                    : "Build bağı yok"}
                  {offer.modelSlug ? ` · Model: ${offer.modelSlug}` : ""}
                </p>
                <p className="text-sm text-zinc-300">₺ {formatMoney(offer.totalAmount)}</p>
                <p className="text-xs text-zinc-500">
                  Geçerlilik: {formatDate(offer.validUntil)} · Oluşturma:{" "}
                  {formatDate(offer.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${getStatusBadge(
                    offer.status as OfferStatus,
                  )}`}
                >
                  {offer.status}
                </span>

                <Link
                  href={`/admin/offers?edit=${offer.id}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                >
                  Düzenle
                </Link>

                <form
                  action={async () => {
                    "use server";
                    await deleteOffer(offer.id);
                  }}
                >
                  <button className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-500/30">
                    Sil
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDrawerOpen && leadOptions.length > 0 ? (
        <AddOfferDrawer leadOptions={leadOptions} initialData={initialData} />
      ) : null}
    </div>
  );
}