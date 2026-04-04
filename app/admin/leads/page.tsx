import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  Activity,
  BadgeEuro,
  ChevronRight,
  GitBranch,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";

import { db } from "@/db/db";
import { builds, buildVersions, leads } from "@/db/schema";

import { deleteLead } from "./action";
import { AddLeadDrawer } from "./AddLeadDrawer";
import { type LeadStatus } from "./types";

type LeadsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    new?: string;
  }>;
};

function getStatusLabel(status: string) {
  if (status === "contacted") return "İletişim";
  if (status === "qualified") return "Nitelikli";
  if (status === "converted") return "Dönüştü";
  if (status === "lost") return "Kaybedildi";
  return "Yeni";
}

function getStatusClassName(status: string) {
  if (status === "converted") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  }

  if (status === "qualified") {
    return "border-blue-500/20 bg-blue-500/10 text-blue-300";
  }

  if (status === "contacted") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  }

  if (status === "lost") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-zinc-700 bg-zinc-800/80 text-zinc-300";
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeStatusFilter(value: string | undefined) {
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

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = (await searchParams) ?? {};
  const isDrawerOpen = params.new === "true";
  const query = (params.q ?? "").trim().toLocaleLowerCase("tr");
  const statusFilter = normalizeStatusFilter(params.status);

  if (!db) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Admin · Leads
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Leads</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400">
            Veritabanı bağlantısı olmadığı için Leads modülü güvenli pasif modda.
          </p>
        </div>
      </section>
    );
  }

  const leadRows = await db
    .select({
      id: leads.id,
      fullName: leads.fullName,
      email: leads.email,
      phoneNumber: leads.phoneNumber,
      whatsappOptIn: leads.whatsappOptIn,
      status: leads.status,
      createdAt: leads.createdAt,
      buildVersionId: leads.buildVersionId,
      versionNumber: buildVersions.versionNumber,
      buildShortCode: builds.shortCode,
    })
    .from(leads)
    .leftJoin(buildVersions, eq(leads.buildVersionId, buildVersions.id))
    .leftJoin(builds, eq(buildVersions.buildId, builds.id))
    .orderBy(desc(leads.createdAt));

  const buildVersionRows = await db
    .select({
      id: buildVersions.id,
      versionNumber: buildVersions.versionNumber,
      createdAt: buildVersions.createdAt,
      buildShortCode: builds.shortCode,
    })
    .from(buildVersions)
    .leftJoin(builds, eq(buildVersions.buildId, builds.id))
    .orderBy(desc(buildVersions.createdAt));

  const buildVersionOptions = buildVersionRows.map((row) => {
    const shortCode = row.buildShortCode ?? "BUILD";
    const versionLabel = `V${row.versionNumber}`;
    const createdAtLabel = formatDate(row.createdAt);

    return {
      id: row.id,
      label: `${shortCode} · ${versionLabel}`,
      meta: `Build: ${shortCode} · Versiyon: ${versionLabel} · Oluşturulma: ${createdAtLabel}`,
    };
  });

  const filteredLeads = leadRows.filter((lead) => {
    const searchable = [
      lead.fullName,
      lead.email ?? "",
      lead.phoneNumber ?? "",
      lead.buildShortCode ?? "",
      `v${lead.versionNumber ?? ""}`,
    ]
      .join(" ")
      .toLocaleLowerCase("tr");

    const matchesQuery = query ? searchable.includes(query) : true;
    const matchesStatus =
      statusFilter === "all" ? true : lead.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const stats = filteredLeads.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.status === "new") acc.new += 1;
      if (item.status === "contacted") acc.contacted += 1;
      if (item.status === "qualified") acc.qualified += 1;
      if (item.status === "converted") acc.converted += 1;
      if (item.status === "lost") acc.lost += 1;
      return acc;
    },
    {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
    },
  );

  const createEnabled = buildVersionOptions.length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Admin · Leads
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-100">
              Leads
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
              Lead akışı doğal dependency ile çalışır. Her lead bir build
              version kaydına bağlıdır ve offer hattı buradan beslenir.
            </p>
          </div>

          {createEnabled ? (
            <Link
              href="/admin/leads?new=true"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <Plus size={16} />
              Yeni Lead
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-800 px-5 py-3 text-sm font-medium text-zinc-500"
            >
              <Plus size={16} />
              Önce Build Version Gerekli
            </button>
          )}
        </div>
      </div>

      {!createEnabled ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
          Leads create akışı için en az bir build version kaydı gerekli.
          Build version oluşmadan lead açılmıyor.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
              <UserRound size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Toplam
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Yeni
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {stats.new}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
              <ChevronRight size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                İletişim
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {stats.contacted}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
              <GitBranch size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Nitelikli
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {stats.qualified}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-300">
              <BadgeEuro size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Dönüşen
              </p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">
                {stats.converted}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form
        method="GET"
        className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ad, e-posta, telefon, build kodu ara..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-zinc-700 lg:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tümü" },
              { value: "new", label: "Yeni" },
              { value: "contacted", label: "İletişim" },
              { value: "qualified", label: "Nitelikli" },
              { value: "converted", label: "Dönüştü" },
              { value: "lost", label: "Kaybedildi" },
            ].map((item) => {
              const isActive = statusFilter === item.value;

              return (
                <button
                  key={item.value}
                  type="submit"
                  name="status"
                  value={item.value}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? "border-zinc-200 bg-zinc-100 text-zinc-900"
                      : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </form>

      <div className="space-y-3">
        {filteredLeads.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6 text-sm text-zinc-400">
            Eşleşen lead kaydı bulunamadı.
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const buildLabel = lead.buildShortCode
              ? `${lead.buildShortCode} · V${lead.versionNumber ?? "?"}`
              : `V${lead.versionNumber ?? "?"}`;

            return (
              <div
                key={lead.id}
                className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-zinc-100">
                        {lead.fullName}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClassName(
                          lead.status,
                        )}`}
                      >
                        {getStatusLabel(lead.status)}
                      </span>
                      {lead.whatsappOptIn ? (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          WhatsApp Onaylı
                        </span>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm text-zinc-400 md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Build Version
                        </p>
                        <p className="mt-1 text-zinc-200">{buildLabel}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          E-posta
                        </p>
                        <p className="mt-1 text-zinc-200">{lead.email || "—"}</p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Telefon
                        </p>
                        <p className="mt-1 text-zinc-200">
                          {lead.phoneNumber || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Oluşturulma
                        </p>
                        <p className="mt-1 text-zinc-200">
                          {formatDate(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    action={async () => {
                      "use server";
                      await deleteLead(lead.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-500/30 hover:bg-red-500/15"
                    >
                      <Trash2 size={15} />
                      Sil
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isDrawerOpen ? (
        <AddLeadDrawer
          buildVersionOptions={buildVersionOptions}
          initialData={null}
        />
      ) : null}
    </section>
  );
}