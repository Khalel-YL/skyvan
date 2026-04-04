import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleDashed,
  MessageSquare,
  Plus,
  Search,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { db } from "@/db/db";
import { builds, buildVersions, leads, models, packages } from "@/db/schema";
import { AddLeadDrawer } from "./AddLeadDrawer";
import { deleteLead } from "./action";
import type { LeadStatus } from "./types";
import { PageHeader } from "../_components/page-header";
import EmptyState from "../_components/empty-state";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  new?: string;
  edit?: string;
}>;

type PageProps = {
  searchParams: SearchParams;
};

const statusTabs: Array<{ key: "all" | LeadStatus; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni" },
  { key: "contacted", label: "Temas" },
  { key: "qualified", label: "Nitelikli" },
  { key: "converted", label: "Dönüştü" },
  { key: "lost", label: "Kaybedildi" },
];

function normalizeStatus(value: string | undefined): "all" | LeadStatus {
  if (
    value === "new" ||
    value === "contacted" ||
    value === "qualified" ||
    value === "converted" ||
    value === "lost"
  ) {
    return value;
  }

  return "all";
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getStatusUi(status: LeadStatus) {
  switch (status) {
    case "new":
      return {
        label: "Yeni",
        className: "border-sky-500/20 bg-sky-500/10 text-sky-200",
        icon: CircleDashed,
      };
    case "contacted":
      return {
        label: "Temas kuruldu",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-200",
        icon: MessageSquare,
      };
    case "qualified":
      return {
        label: "Nitelikli",
        className: "border-violet-500/20 bg-violet-500/10 text-violet-200",
        icon: Target,
      };
    case "converted":
      return {
        label: "Dönüştü",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
        icon: CheckCircle2,
      };
    case "lost":
      return {
        label: "Kaybedildi",
        className: "border-rose-500/20 bg-rose-500/10 text-rose-200",
        icon: XCircle,
      };
  }
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = normalizeStatus(typeof params.status === "string" ? params.status : undefined);
  const isDrawerOpen = params.new === "true" || typeof params.edit === "string";

  if (!db) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin · Leads"
          title="Lead Yönetimi"
          description="Veritabanı bağlantısı olmadığı için leads modülü güvenli modda."
        />
        <EmptyState
          title="Veritabanı bağlantısı yok"
          description="DATABASE_URL aktif olduğunda native leads omurgası çalışır."
        />
      </div>
    );
  }

  const whereClause = and(
    status !== "all" ? eq(leads.status, status) : undefined,
    q
      ? or(
          ilike(leads.fullName, `%${q}%`),
          ilike(leads.email, `%${q}%`),
          ilike(leads.phoneNumber, `%${q}%`),
        )
      : undefined,
  );

  const [leadRows, buildVersionRows, summaryRows] = await Promise.all([
    db
      .select({
        id: leads.id,
        buildVersionId: leads.buildVersionId,
        fullName: leads.fullName,
        email: leads.email,
        phoneNumber: leads.phoneNumber,
        whatsappOptIn: leads.whatsappOptIn,
        status: leads.status,
        createdAt: leads.createdAt,
        buildShortCode: builds.shortCode,
        versionNumber: buildVersions.versionNumber,
        modelSlug: models.slug,
        packageName: packages.name,
      })
      .from(leads)
      .leftJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
      .leftJoin(builds, eq(buildVersions.buildId, builds.id))
      .leftJoin(models, eq(builds.modelId, models.id))
      .leftJoin(packages, eq(buildVersions.packageId, packages.id))
      .where(whereClause)
      .orderBy(desc(leads.createdAt)),

    db
      .select({
        id: buildVersions.id,
        versionNumber: buildVersions.versionNumber,
        buildShortCode: builds.shortCode,
        modelSlug: models.slug,
        packageName: packages.name,
        createdAt: buildVersions.createdAt,
      })
      .from(buildVersions)
      .leftJoin(builds, eq(buildVersions.buildId, builds.id))
      .leftJoin(models, eq(builds.modelId, models.id))
      .leftJoin(packages, eq(buildVersions.packageId, packages.id))
      .orderBy(desc(buildVersions.createdAt)),

    db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .groupBy(leads.status),
  ]);

  const summaryMap = new Map<LeadStatus, number>(
    summaryRows.map((item) => [item.status as LeadStatus, Number(item.count ?? 0)]),
  );

  const totalLeads = summaryRows.reduce((acc, item) => acc + Number(item.count ?? 0), 0);
  const convertedCount = summaryMap.get("converted") ?? 0;
  const contactedCount = summaryMap.get("contacted") ?? 0;
  const qualifiedCount = summaryMap.get("qualified") ?? 0;
  const lostCount = summaryMap.get("lost") ?? 0;

  const buildVersionOptions = buildVersionRows.map((row) => ({
    id: row.id,
    label: `${row.buildShortCode ?? "BUILD"} · v${row.versionNumber}`,
    meta: [
      row.modelSlug ? `Model: ${row.modelSlug}` : null,
      row.packageName ? `Paket: ${row.packageName}` : null,
      row.createdAt ? `Tarih: ${formatDate(row.createdAt)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const editLead =
    typeof params.edit === "string"
      ? leadRows.find((item) => item.id === params.edit) ?? null
      : null;

  const editData = editLead
    ? {
        id: editLead.id,
        buildVersionId: editLead.buildVersionId,
        fullName: editLead.fullName,
        email: editLead.email ?? "",
        phoneNumber: editLead.phoneNumber ?? "",
        whatsappOptIn: editLead.whatsappOptIn,
        status: editLead.status as LeadStatus,
      }
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Leads"
        title="Lead Yönetimi"
        description="Native CRM giriş omurgası. Lead kaydı doğrudan build version ile bağlıdır."
        actions={
          <Link
            href="/admin/leads?new=true"
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              buildVersionOptions.length === 0
                ? "cursor-not-allowed border border-zinc-800 bg-zinc-900 text-zinc-500"
                : "bg-white text-black hover:bg-zinc-200"
            }`}
          >
            <Plus size={16} />
            Yeni lead
          </Link>
        }
      />

      {buildVersionOptions.length === 0 ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          Lead oluşturmak için önce en az bir build version kaydı gerekli.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Toplam lead</p>
          <p className="mt-3 text-2xl font-semibold text-white">{totalLeads}</p>
          <p className="mt-1 text-xs text-zinc-500">Native CRM omurgası</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Temas + nitelikli
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {contactedCount + qualifiedCount}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Pipeline orta katman</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Dönüştü</p>
          <p className="mt-3 text-2xl font-semibold text-white">{convertedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Teklif öncesi güçlü sinyal</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Kaybedildi</p>
          <p className="mt-3 text-2xl font-semibold text-white">{lostCount}</p>
          <p className="mt-1 text-xs text-zinc-500">Takip kalite sinyali</p>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
        <form className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => {
              const isActive = status === tab.key;

              return (
                <Link
                  key={tab.key}
                  href={{
                    pathname: "/admin/leads",
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Ad, e-posta veya telefon ara"
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-3 text-sm text-zinc-100 outline-none transition focus:border-zinc-700 sm:w-72"
              />
              <input type="hidden" name="status" value={status} />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 transition hover:border-zinc-700 hover:text-white"
              >
                Uygula
              </button>
              <Link
                href="/admin/leads"
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              >
                Sıfırla
              </Link>
            </div>
          </div>
        </form>
      </div>

      {leadRows.length === 0 ? (
        <EmptyState
          title="Lead kaydı bulunamadı"
          description="Filtreyi genişlet veya yeni bir lead ekleyerek CRM hattını başlat."
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-900">
              <thead className="bg-zinc-950/90">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Build bağı</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium">İletişim</th>
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {leadRows.map((lead) => {
                  const statusUi = getStatusUi(lead.status as LeadStatus);
                  const StatusIcon = statusUi.icon;

                  return (
                    <tr key={lead.id} className="align-top">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">{lead.fullName}</p>
                          <p className="text-xs text-zinc-500">ID: {lead.id.slice(0, 8)}</p>
                          {lead.whatsappOptIn ? (
                            <p className="text-xs text-emerald-400">WhatsApp onayı mevcut</p>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-zinc-200">
                            {lead.buildShortCode ?? "—"} · v{lead.versionNumber ?? "—"}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {lead.modelSlug ? `Model: ${lead.modelSlug}` : "Model yok"}
                            {lead.packageName ? ` · Paket: ${lead.packageName}` : ""}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div
                          className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs ${statusUi.className}`}
                        >
                          <StatusIcon size={14} />
                          {statusUi.label}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm text-zinc-300">
                          <p>{lead.email ?? "E-posta yok"}</p>
                          <p className="text-zinc-500">{lead.phoneNumber ?? "Telefon yok"}</p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {formatDate(lead.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/leads?edit=${lead.id}`}
                            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-700 hover:text-white"
                          >
                            Düzenle
                            <ArrowUpRight size={14} />
                          </Link>

                          <form
                            action={async () => {
                              "use server";
                              await deleteLead(lead.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 transition hover:border-rose-500/30 hover:text-rose-300"
                            >
                              Sil
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300">
            <Trophy size={18} />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Batch sonucu</h3>
            <p className="text-sm leading-6 text-zinc-400">
              Leads modülü artık placeholder içerik mantığı yerine native tabloyu kullanır.
              Böylece Offers ve Orders hattı için doğru başlangıç omurgası açılmış olur.
            </p>
          </div>
        </div>
      </div>

      {isDrawerOpen ? (
        <AddLeadDrawer
          buildVersionOptions={buildVersionOptions}
          initialData={editData}
        />
      ) : null}
    </div>
  );
}