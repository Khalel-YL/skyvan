import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  ExternalLink,
  FileClock,
  History,
  ShieldCheck,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { auditLogs, publishRevisions, users } from "@/db/schema";
import { PageHeader } from "../_components/page-header";
import { StatCard } from "../_components/stat-card";
import { getAuditRuntimeSummary } from "@/app/lib/admin/audit";

type AuditSearchParams = Promise<{
  q?: string;
  action?: string;
  entityType?: string;
  revisionStatus?: string;
}>;

type AuditActionFilter = "all" | "create" | "update" | "delete";
type RevisionStatusFilter = "all" | "draft" | "published" | "rolled_back";

type AuditLogRow = {
  id: string;
  entityType: string;
  entityId: string;
  adminUserId: string;
  action: "create" | "update" | "delete";
  previousState: unknown;
  newState: unknown;
  createdAt: Date | string;
};

type PublishRevisionRow = {
  id: string;
  revisionName: string;
  publishedBy: string;
  publishedAt: Date | string;
  status: "draft" | "published" | "rolled_back";
};

type ActorRecord = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

function normalizeActionFilter(value: string): AuditActionFilter {
  if (value === "create" || value === "update" || value === "delete") {
    return value;
  }

  return "all";
}

function normalizeRevisionStatus(value: string): RevisionStatusFilter {
  if (value === "draft" || value === "published" || value === "rolled_back") {
    return value;
  }

  return "all";
}

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih okunamadı";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function shortenId(value: string) {
  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function getActorLabel(actorId: string, actorMap: Map<string, ActorRecord>) {
  const actor = actorMap.get(actorId);

  if (!actor) {
    return shortenId(actorId);
  }

  if (actor.name?.trim()) {
    return actor.email?.trim()
      ? `${actor.name} · ${actor.email}`
      : actor.name;
  }

  if (actor.email?.trim()) {
    return actor.email;
  }

  return shortenId(actorId);
}

function asObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getChangedKeys(previousState: unknown, newState: unknown) {
  const previousObject = asObject(previousState);
  const nextObject = asObject(newState);

  if (!previousObject && !nextObject) {
    return [];
  }

  const allKeys = new Set([
    ...Object.keys(previousObject ?? {}),
    ...Object.keys(nextObject ?? {}),
  ]);

  return Array.from(allKeys)
    .filter((key) => {
      return JSON.stringify(previousObject?.[key] ?? null) !== JSON.stringify(nextObject?.[key] ?? null);
    })
    .sort((left, right) => left.localeCompare(right, "tr"))
    .slice(0, 6);
}

function buildChangeSummary(row: AuditLogRow) {
  const changedKeys = getChangedKeys(row.previousState, row.newState);

  if (row.action === "create") {
    const nextKeys = Object.keys(asObject(row.newState) ?? {}).slice(0, 6);
    return {
      label:
        nextKeys.length > 0
          ? `Yeni kayıt alanları: ${nextKeys.join(", ")}`
          : "Yeni kayıt oluşturuldu.",
      changedKeys: nextKeys,
    };
  }

  if (row.action === "delete") {
    const previousKeys = Object.keys(asObject(row.previousState) ?? {}).slice(0, 6);
    return {
      label:
        previousKeys.length > 0
          ? `Silinen kayıt alanları: ${previousKeys.join(", ")}`
          : "Kayıt silindi.",
      changedKeys: previousKeys,
    };
  }

  return {
    label:
      changedKeys.length > 0
        ? `Güncellenen alanlar: ${changedKeys.join(", ")}`
        : "Alan bazlı fark tespit edilemedi.",
    changedKeys,
  };
}

function actionClasses(action: AuditLogRow["action"]) {
  if (action === "create") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (action === "delete") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

function revisionClasses(status: PublishRevisionRow["status"]) {
  if (status === "published") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "rolled_back") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-zinc-800 bg-zinc-950 text-zinc-300";
}

function getEntityHref(entityType: string, entityId: string) {
  switch (entityType) {
    case "page":
      return `/admin/pages?edit=${entityId}`;
    case "blog":
      return `/admin/blog?edit=${entityId}`;
    case "media":
      return "/admin/media";
    case "model":
      return "/admin/models";
    case "package":
      return "/admin/packages";
    case "category":
      return "/admin/categories";
    case "product":
      return "/admin/products";
    case "rule":
      return "/admin/rules";
    case "datasheet":
      return "/admin/datasheets";
    case "user":
      return "/admin/users";
    default:
      return null;
  }
}

export default async function AuditVisibilityPage({
  searchParams,
}: {
  searchParams: AuditSearchParams;
}) {
  const params = await searchParams;
  const databaseHealth = getDatabaseHealth();
  const auditRuntime = getAuditRuntimeSummary();
  const query = String(params.q ?? "").trim().toLowerCase();
  const actionFilter = normalizeActionFilter(String(params.action ?? "all"));
  const entityTypeFilter = String(params.entityType ?? "").trim().toLowerCase();
  const revisionStatusFilter = normalizeRevisionStatus(
    String(params.revisionStatus ?? "all"),
  );

  let auditRows: AuditLogRow[] = [];
  let revisionRows: PublishRevisionRow[] = [];
  let actorMap = new Map<string, ActorRecord>();
  let loadWarning: string | null = null;

  if (db) {
    try {
      const auditWhere = [];
      const revisionWhere = [];

      if (actionFilter !== "all") {
        auditWhere.push(eq(auditLogs.action, actionFilter));
      }

      if (entityTypeFilter) {
        auditWhere.push(eq(auditLogs.entityType, entityTypeFilter));
      }

      if (revisionStatusFilter !== "all") {
        revisionWhere.push(eq(publishRevisions.status, revisionStatusFilter));
      }

      const [rawAuditRows, rawRevisionRows] = await Promise.all([
        db
          .select({
            id: auditLogs.id,
            entityType: auditLogs.entityType,
            entityId: auditLogs.entityId,
            adminUserId: auditLogs.adminUserId,
            action: auditLogs.action,
            previousState: auditLogs.previousState,
            newState: auditLogs.newState,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
          .where(auditWhere.length > 0 ? and(...auditWhere) : undefined)
          .orderBy(desc(auditLogs.createdAt))
          .limit(200),
        db
          .select({
            id: publishRevisions.id,
            revisionName: publishRevisions.revisionName,
            publishedBy: publishRevisions.publishedBy,
            publishedAt: publishRevisions.publishedAt,
            status: publishRevisions.status,
          })
          .from(publishRevisions)
          .where(revisionWhere.length > 0 ? and(...revisionWhere) : undefined)
          .orderBy(desc(publishRevisions.publishedAt))
          .limit(80),
      ]);

      auditRows = rawAuditRows as AuditLogRow[];
      revisionRows = rawRevisionRows as PublishRevisionRow[];

      const actorIds = Array.from(
        new Set([
          ...auditRows.map((row) => row.adminUserId),
          ...revisionRows.map((row) => row.publishedBy),
        ]),
      );

      if (actorIds.length > 0) {
        const actorRows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(inArray(users.id, actorIds));

        actorMap = new Map(
          actorRows.map((row) => [
            row.id,
            {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role,
            },
          ]),
        );
      }
    } catch (error) {
      console.error("audit visibility page error:", error);
      loadWarning =
        "Audit veya publish kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const filteredAuditRows = query
    ? auditRows.filter((row) => {
        const actorLabel = getActorLabel(row.adminUserId, actorMap).toLowerCase();
        const changeSummary = buildChangeSummary(row).label.toLowerCase();
        const searchFields = [
          row.entityType.toLowerCase(),
          row.entityId.toLowerCase(),
          row.action.toLowerCase(),
          actorLabel,
          changeSummary,
        ];

        return searchFields.some((field) => field.includes(query));
      })
    : auditRows;

  const filteredRevisionRows = query
    ? revisionRows.filter((row) => {
        const actorLabel = getActorLabel(row.publishedBy, actorMap).toLowerCase();
        return (
          row.revisionName.toLowerCase().includes(query) ||
          row.status.toLowerCase().includes(query) ||
          actorLabel.includes(query)
        );
      })
    : revisionRows;

  const auditStats = {
    total: filteredAuditRows.length,
    create: filteredAuditRows.filter((row) => row.action === "create").length,
    update: filteredAuditRows.filter((row) => row.action === "update").length,
    delete: filteredAuditRows.filter((row) => row.action === "delete").length,
  };

  const revisionStats = {
    total: filteredRevisionRows.length,
    draft: filteredRevisionRows.filter((row) => row.status === "draft").length,
    published: filteredRevisionRows.filter((row) => row.status === "published").length,
    rolledBack: filteredRevisionRows.filter((row) => row.status === "rolled_back").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Audit & Publish"
        title="İzlenebilirlik Merkezi"
        description="Audit logları ile publish revision kayıtlarını tek ekranda görünür kılar. Bu yüzey yeni bir audit sistemi kurmaz; mevcut tablo gerçekliğini operasyonel olarak izlenebilir hale getirir."
      />

      {!db ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
          {databaseHealth.note}
        </div>
      ) : null}

      {!auditRuntime.enabled ? (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-200">
          Audit actor yapılandırılmadığı için yeni audit ve publish revision yazımları safe-degrade modda no-op kalabilir. Mevcut görünürlük yüzeyi yine de okunabilir.
        </div>
      ) : null}

      {loadWarning ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-200">
          {loadWarning}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Audit Kayıt"
          value={String(auditStats.total)}
          hint="Mevcut filtrelerle görünen audit log sayısı"
        />
        <StatCard
          label="Create / Update"
          value={`${auditStats.create} / ${auditStats.update}`}
          hint="Oluşturma ve güncelleme dağılımı"
        />
        <StatCard
          label="Delete"
          value={String(auditStats.delete)}
          hint="Silme aksiyonu audit görünürlüğü"
        />
        <StatCard
          label="Revision"
          value={`${revisionStats.published} / ${revisionStats.rolledBack}`}
          hint="Published ve rollback revision görünürlüğü"
        />
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Filtreler</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Audit kayıtlarında aksiyon, entity type ve serbest arama ile daraltma yap.
            </p>
          </div>

          <form className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Entity, actor, revision veya değişim ara"
              className="min-w-[280px] rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <input
              type="text"
              name="entityType"
              defaultValue={params.entityType ?? ""}
              placeholder="entityType"
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <select
              name="action"
              defaultValue={actionFilter}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm audit aksiyonları</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>

            <select
              name="revisionStatus"
              defaultValue={revisionStatusFilter}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm revision durumları</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="rolled_back">Rolled back</option>
            </select>

            <button
              type="submit"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Uygula
            </button>

            <Link
              href="/admin/audit"
              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">Son audit kayıtları</h2>
          </div>

          {filteredAuditRows.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
              Audit filtresine uyan kayıt bulunamadı.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filteredAuditRows.map((row) => {
                const actorLabel = getActorLabel(row.adminUserId, actorMap);
                const changeSummary = buildChangeSummary(row);
                const entityHref = getEntityHref(row.entityType, row.entityId);

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
                          <span
                            className={`rounded-full border px-3 py-1 text-[11px] ${actionClasses(
                              row.action,
                            )}`}
                          >
                            {row.action}
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-[11px] text-zinc-500">
                            {formatDateTime(row.createdAt)}
                          </span>
                        </div>

                        <p className="mt-3 text-sm font-medium text-white">
                          {changeSummary.label}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
                          <span>Actor: {actorLabel}</span>
                          <span>Entity: {shortenId(row.entityId)}</span>
                        </div>

                        {changeSummary.changedKeys.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {changeSummary.changedKeys.map((key) => (
                              <span
                                key={`${row.id}-${key}`}
                                className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {entityHref ? (
                        <Link
                          href={entityHref}
                          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          İlgili yüzey
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">Publish revisions</h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Toplam revision
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {revisionStats.total}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Draft / Published
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {revisionStats.draft} / {revisionStats.published}
              </div>
            </div>
          </div>

          {filteredRevisionRows.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
              Publish revision kaydı bulunamadı.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filteredRevisionRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] ${revisionClasses(
                          row.status,
                        )}`}
                      >
                        {row.status}
                      </span>
                      <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-[11px] text-zinc-500">
                        {formatDateTime(row.publishedAt)}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-white">{row.revisionName}</p>
                      <p className="mt-2 text-xs text-zinc-400">
                        Actor: {getActorLabel(row.publishedBy, actorMap)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
            Pages modülü publish ve rollback geçişlerinde `publish_revisions` kaydı üretir. Bu ekran yeni bir publish sistemi kurmaz; mevcut revision izini görünür hale getirir.
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-start gap-3">
          <FileClock className="mt-0.5 h-5 w-5 text-zinc-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Kapanış notu</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
              Bu yüzey yalnızca repo içindeki gerçek `audit_logs` ve `publish_revisions`
              tablolarını okur. Audit yazım mantığı, publish helper akışı veya actor
              çözümlemesi yeniden tasarlanmadı; sadece operasyonel görünürlük tamamlandı.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
