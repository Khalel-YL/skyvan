import Link from "next/link";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  ExternalLink,
  FileClock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { auditLogs, publishRevisions, users } from "@/db/schema";
import { getAuditRuntimeValidation } from "@/app/lib/admin/audit";

type AuditSearchParams = Promise<{
  q?: string;
  action?: string;
  entityType?: string;
  revisionStatus?: string;
  auditPage?: string;
  revisionPage?: string;
  view?: string;
}>;

type AuditActionFilter = "all" | "create" | "update" | "delete";
type RevisionStatusFilter = "all" | "draft" | "published" | "rolled_back";
type AuditView = "audit" | "revisions";

const AUDIT_PAGE_SIZE = 25;
const REVISION_PAGE_SIZE = 25;

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

type AuditRuntimeValidation = Awaited<ReturnType<typeof getAuditRuntimeValidation>>;

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

function normalizeView(value: string): AuditView {
  return value === "revisions" ? "revisions" : "audit";
}

function normalizePage(value: string | undefined) {
  const page = Number.parseInt(String(value ?? "1"), 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
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

function getRuntimeCardClass(tone: "ready" | "warning" | "blocked") {
  if (tone === "ready") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

function getClosureTone(runtime: AuditRuntimeValidation) {
  if (runtime.closureState === "ready") {
    return "ready" as const;
  }

  if (runtime.closureState === "warning") {
    return "warning" as const;
  }

  return "blocked" as const;
}

function getBindingTone(runtime: AuditRuntimeValidation) {
  if (runtime.actorRecordStatus === "resolved" && runtime.roleAligned) {
    return "ready" as const;
  }

  if (runtime.actorRecordStatus === "resolved") {
    return "warning" as const;
  }

  return "blocked" as const;
}

function getWriteTone(enabled: boolean) {
  return enabled
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

function getClosureLabel(runtime: AuditRuntimeValidation) {
  if (runtime.closureState === "ready") {
    return "Çalışma durumu doğrulandı";
  }

  if (runtime.closureState === "warning") {
    return "Dikkat gerekli";
  }

  return "Kapanış engeli";
}

function getAuditRuntimeLabel(runtime: AuditRuntimeValidation) {
  return runtime.writeActive ? "Yazım aktif" : "Güvenli düşüş";
}

function getPublishRuntimeLabel(runtime: AuditRuntimeValidation) {
  return runtime.publishWriteActive ? "Yazım aktif" : "Güvenli düşüş";
}

function getActorBindingLabel(runtime: AuditRuntimeValidation) {
  if (runtime.actorRecordStatus === "resolved") {
    return runtime.roleAligned ? "Aktör doğrulandı" : "Rol dikkat istiyor";
  }

  if (runtime.actorRecordStatus === "not_found") {
    return "Aktör bağlanmamış";
  }

  return runtime.actorStatus === "invalid" ? "Aktör geçersiz" : "Aktör eksik";
}

function getActorRoleLabel(runtime: AuditRuntimeValidation) {
  if (!runtime.actorRole) {
    return "Rol doğrulanamadı";
  }

  return runtime.actorRole === "admin" ? "Rol: admin" : "Rol: standart";
}

function actionLabel(action: AuditLogRow["action"]) {
  if (action === "create") {
    return "Oluşturma";
  }

  if (action === "update") {
    return "Güncelleme";
  }

  return "Silme";
}

function revisionLabel(status: PublishRevisionRow["status"]) {
  if (status === "published") {
    return "Yayında";
  }

  if (status === "rolled_back") {
    return "Geri alındı";
  }

  return "Taslak";
}

function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>
    </div>
  );
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
    .sort((left, right) => left.localeCompare(right, "tr"));
}

function buildChangeSummary(row: AuditLogRow) {
  const changedKeys = getChangedKeys(row.previousState, row.newState);
  const visibleKeys = changedKeys.slice(0, 3);
  const extraCount = Math.max(0, changedKeys.length - visibleKeys.length);

  if (row.action === "create") {
    const nextKeys = Object.keys(asObject(row.newState) ?? {});
    const visibleNextKeys = nextKeys.slice(0, 3);
    return {
      label:
        visibleNextKeys.length > 0
          ? `Yeni kayıt alanları: ${visibleNextKeys.join(", ")}`
          : "Yeni kayıt oluşturuldu.",
      changedKeys: visibleNextKeys,
      extraCount: Math.max(0, nextKeys.length - visibleNextKeys.length),
      detailLabel:
        nextKeys.length > 0
          ? `${nextKeys.length} alan yeni kayıt içinde izleniyor.`
          : "Yeni kayıt için alan özeti bulunamadı.",
    };
  }

  if (row.action === "delete") {
    const previousKeys = Object.keys(asObject(row.previousState) ?? {});
    const visiblePreviousKeys = previousKeys.slice(0, 3);
    return {
      label:
        visiblePreviousKeys.length > 0
          ? `Silinen kayıt alanları: ${visiblePreviousKeys.join(", ")}`
          : "Kayıt silindi.",
      changedKeys: visiblePreviousKeys,
      extraCount: Math.max(0, previousKeys.length - visiblePreviousKeys.length),
      detailLabel:
        previousKeys.length > 0
          ? `${previousKeys.length} alan silinen kayıt içinde izleniyor.`
          : "Silinen kayıt için alan özeti bulunamadı.",
    };
  }

  return {
    label:
      visibleKeys.length > 0
        ? `Güncellenen alanlar: ${visibleKeys.join(", ")}`
        : "Alan bazlı fark tespit edilemedi.",
    changedKeys: visibleKeys,
    extraCount,
    detailLabel:
      changedKeys.length > 0
        ? `${changedKeys.length} alan değişikliği tespit edildi.`
        : "Bu kayıtta sınırlı özet dışında gösterilecek değişim yok.",
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

function buildAuditHref(params: {
  q: string;
  entityType: string;
  action: AuditActionFilter;
  revisionStatus: RevisionStatusFilter;
  view: AuditView;
  auditPage: number;
  revisionPage: number;
}) {
  const search = new URLSearchParams();

  if (params.q.trim()) {
    search.set("q", params.q.trim());
  }

  if (params.entityType.trim()) {
    search.set("entityType", params.entityType.trim());
  }

  if (params.action !== "all") {
    search.set("action", params.action);
  }

  if (params.revisionStatus !== "all") {
    search.set("revisionStatus", params.revisionStatus);
  }

  if (params.view !== "audit") {
    search.set("view", params.view);
  }

  if (params.auditPage > 1) {
    search.set("auditPage", String(params.auditPage));
  }

  if (params.revisionPage > 1) {
    search.set("revisionPage", String(params.revisionPage));
  }

  const query = search.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}

function PaginationControls({
  page,
  hasNextPage,
  previousHref,
  nextHref,
}: {
  page: number;
  hasNextPage: boolean;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3">
      {page > 1 ? (
        <Link
          href={previousHref}
          className="rounded-xl border border-zinc-800 bg-black px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Önceki
        </Link>
      ) : (
        <span className="rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-600">
          Önceki
        </span>
      )}

      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400">
        Sayfa {page}
      </span>

      {hasNextPage ? (
        <Link
          href={nextHref}
          className="rounded-xl border border-zinc-800 bg-black px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
        >
          Sonraki
        </Link>
      ) : (
        <span className="rounded-xl border border-zinc-900 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-600">
          Sonraki
        </span>
      )}
    </div>
  );
}

export default async function AuditVisibilityPage({
  searchParams,
}: {
  searchParams: AuditSearchParams;
}) {
  const params = await searchParams;
  const databaseHealth = getDatabaseHealth();
  const auditRuntime = await getAuditRuntimeValidation();
  const query = String(params.q ?? "").trim().toLowerCase();
  const actionFilter = normalizeActionFilter(String(params.action ?? "all"));
  const entityTypeFilter = String(params.entityType ?? "").trim().toLowerCase();
  const revisionStatusFilter = normalizeRevisionStatus(
    String(params.revisionStatus ?? "all"),
  );
  const activeView = normalizeView(String(params.view ?? "audit"));
  const auditPage = normalizePage(params.auditPage);
  const revisionPage = normalizePage(params.revisionPage);
  const auditOffset = (auditPage - 1) * AUDIT_PAGE_SIZE;
  const revisionOffset = (revisionPage - 1) * REVISION_PAGE_SIZE;

  let auditRows: AuditLogRow[] = [];
  let revisionRows: PublishRevisionRow[] = [];
  let hasNextAuditPage = false;
  let hasNextRevisionPage = false;
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

      if (query) {
        const pattern = `%${query}%`;
        auditWhere.push(
          or(
            ilike(auditLogs.entityType, pattern),
            ilike(auditLogs.entityId, pattern),
          )!,
        );
        revisionWhere.push(
          or(
            ilike(publishRevisions.revisionName, pattern),
            ilike(publishRevisions.status, pattern),
          )!,
        );
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
          .limit(AUDIT_PAGE_SIZE + 1)
          .offset(auditOffset),
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
          .limit(REVISION_PAGE_SIZE + 1)
          .offset(revisionOffset),
      ]);

      hasNextAuditPage = rawAuditRows.length > AUDIT_PAGE_SIZE;
      hasNextRevisionPage = rawRevisionRows.length > REVISION_PAGE_SIZE;
      auditRows = rawAuditRows.slice(0, AUDIT_PAGE_SIZE) as AuditLogRow[];
      revisionRows = rawRevisionRows.slice(0, REVISION_PAGE_SIZE) as PublishRevisionRow[];

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
        "Audit veya yayın izi kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const filteredAuditRows = auditRows;
  const filteredRevisionRows = revisionRows;

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
  const auditViewHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "audit",
    auditPage,
    revisionPage,
  });
  const revisionsViewHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "revisions",
    auditPage,
    revisionPage,
  });
  const previousAuditHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "audit",
    auditPage: Math.max(1, auditPage - 1),
    revisionPage,
  });
  const nextAuditHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "audit",
    auditPage: auditPage + 1,
    revisionPage,
  });
  const previousRevisionHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "revisions",
    auditPage,
    revisionPage: Math.max(1, revisionPage - 1),
  });
  const nextRevisionHref = buildAuditHref({
    q: query,
    entityType: entityTypeFilter,
    action: actionFilter,
    revisionStatus: revisionStatusFilter,
    view: "revisions",
    auditPage,
    revisionPage: revisionPage + 1,
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-zinc-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            ADMIN · İZ KAYITLARI
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            İzlenebilirlik Merkezi
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
            İz kayıtlarını ve yayın izlerini kompakt bir operasyon günlüğü
            olarak gösterir.
          </p>
        </div>
      </header>

      {!db ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {databaseHealth.note}
        </div>
      ) : null}

      {auditRuntime.closureState !== "ready" ? (
        <div
          className={`rounded-2xl border px-3 py-2 text-sm ${
            auditRuntime.closureState === "blocked"
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">{getClosureLabel(auditRuntime)}</p>
              <p className="mt-2 leading-6">
                {auditRuntime.blocker ? `${auditRuntime.blocker} ` : ""}
                {auditRuntime.reason} Bu nedenle boş iz listesi tek başına
                “işlem yapılmadı” anlamına gelmez.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {loadWarning ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {loadWarning}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <StatPill
          label="İz Kayıt"
          value={String(auditStats.total)}
          hint="Bu sayfada görünen iz kayıtları"
        />
        <StatPill
          label="Oluşturma / Güncelleme"
          value={`${auditStats.create} / ${auditStats.update}`}
          hint="Oluşturma ve güncelleme dağılımı"
        />
        <StatPill
          label="Silme"
          value={String(auditStats.delete)}
          hint="Silme aksiyonu iz görünürlüğü"
        />
        <StatPill
          label="Yayın İzi"
          value={`${revisionStats.published} / ${revisionStats.rolledBack}`}
          hint="Yayın ve geri alma izleri"
        />
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex items-center gap-3">
          {auditRuntime.closureState === "ready" ? (
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-zinc-300" />
          )}
          <h2 className="text-sm font-semibold text-white">Çalışma durumu</h2>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-2xl border p-3 ${getRuntimeCardClass(getClosureTone(auditRuntime))}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Kapanış kontrolü
            </div>
            <div className="mt-1 text-base font-semibold">{getClosureLabel(auditRuntime)}</div>
            <div className="mt-1 text-xs leading-5 opacity-90">
              {auditRuntime.blocker ?? "Temel doğrulamalar geçti."}
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${getRuntimeCardClass(getBindingTone(auditRuntime))}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Audit aktörü
            </div>
            <div className="mt-1 truncate text-base font-semibold">{auditRuntime.actorPreview}</div>
            <div className="mt-1 text-xs leading-5 opacity-90">
              {getActorBindingLabel(auditRuntime)} · {getActorRoleLabel(auditRuntime)}
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${getWriteTone(auditRuntime.writeActive)}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              İz yazımı
            </div>
            <div className="mt-1 text-base font-semibold">
              {getAuditRuntimeLabel(auditRuntime)}
            </div>
            <div className="mt-1 text-xs leading-5 opacity-90">
              İz yazımı doğrulanmış admin bağına dayanır.
            </div>
          </div>

          <div className={`rounded-2xl border p-3 ${getWriteTone(auditRuntime.publishWriteActive)}`}>
            <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
              Yayın izi
            </div>
            <div className="mt-1 text-base font-semibold">
              {getPublishRuntimeLabel(auditRuntime)}
            </div>
            <div className="mt-1 text-xs leading-5 opacity-90">
              Yayın izleri aynı doğrulanmış aktör bağıyla çalışır.
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-400">
          {auditRuntime.reason}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Filtreler</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Aksiyon, kayıt tipi ve serbest arama ile daralt.
            </p>
          </div>

          <form className="flex flex-col gap-2 md:flex-row">
            <input type="hidden" name="view" value={activeView} />
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Kayıt, aktör, yayın izi veya değişim ara"
              className="min-w-[260px] rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <input
              type="text"
              name="entityType"
              defaultValue={params.entityType ?? ""}
              placeholder="Kayıt tipi"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <select
              name="action"
              defaultValue={actionFilter}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm aksiyonlar</option>
              <option value="create">Oluşturma</option>
              <option value="update">Güncelleme</option>
              <option value="delete">Silme</option>
            </select>

            <select
              name="revisionStatus"
              defaultValue={revisionStatusFilter}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm yayın durumları</option>
              <option value="draft">Taslak</option>
              <option value="published">Yayında</option>
              <option value="rolled_back">Geri alındı</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Uygula
            </button>

            <Link
              href="/admin/audit"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-col gap-3 border-b border-zinc-800 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit rounded-xl border border-zinc-800 bg-black p-1">
            <Link
              href={auditViewHref}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeView === "audit"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              İz kayıtları
            </Link>
            <Link
              href={revisionsViewHref}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeView === "revisions"
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Yayın izleri
            </Link>
          </div>

          <div className="text-xs text-zinc-500">
            {activeView === "audit"
              ? `${AUDIT_PAGE_SIZE} kayıtlık sayfalı iz listesi`
              : `${REVISION_PAGE_SIZE} kayıtlık sayfalı yayın izi listesi`}
          </div>
        </div>

        {activeView === "audit" ? (
          <div className="mt-3">
          {filteredAuditRows.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
              {auditRuntime.writeActive
                ? "İz filtresine uyan kayıt bulunamadı."
                : "İz filtresine uyan kayıt bulunamadı. Güvenli düşüş modunda yeni iz satırı oluşmamış olabilir."}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredAuditRows.map((row) => {
                const actorLabel = getActorLabel(row.adminUserId, actorMap);
                const changeSummary = buildChangeSummary(row);
                const entityHref = getEntityHref(row.entityType, row.entityId);

                return (
                  <article
                    key={row.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-zinc-800 bg-black px-2.5 py-0.5 text-[11px] text-zinc-300">
                            {row.entityType}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] ${actionClasses(
                              row.action,
                            )}`}
                          >
                            {actionLabel(row.action)}
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-black px-2.5 py-0.5 text-[11px] text-zinc-500">
                            {formatDateTime(row.createdAt)}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-1 text-sm font-medium text-white">
                          {changeSummary.label}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-400">
                          <span className="truncate">Aktör: {actorLabel}</span>
                          <span>Kayıt: {shortenId(row.entityId)}</span>
                        </div>

                        {changeSummary.changedKeys.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {changeSummary.changedKeys.map((key) => (
                              <span
                                key={`${row.id}-${key}`}
                                className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300"
                              >
                                {key}
                              </span>
                            ))}
                            {changeSummary.extraCount > 0 ? (
                              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                                +{changeSummary.extraCount} alan daha
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <details className="mt-2 text-xs text-zinc-500">
                          <summary className="cursor-pointer select-none text-zinc-400 transition hover:text-white">
                            Detay
                          </summary>
                          <div className="mt-2 max-h-20 overflow-hidden rounded-xl border border-zinc-800 bg-black px-3 py-2 leading-5">
                            {changeSummary.detailLabel} Tam JSON farkı bu listede
                            açık gösterilmez.
                          </div>
                        </details>
                      </div>

                      {entityHref ? (
                        <Link
                          href={entityHref}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-black px-2.5 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
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
          <div className="mt-3">
            <PaginationControls
              page={auditPage}
              hasNextPage={hasNextAuditPage}
              previousHref={previousAuditHref}
              nextHref={nextAuditHref}
            />
          </div>
        </div>
        ) : (
          <div className="mt-3">
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Bu sayfa
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {revisionStats.total}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Yayın / geri alma
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {revisionStats.published} / {revisionStats.rolledBack}
                </div>
              </div>
            </div>

          {filteredRevisionRows.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
              {auditRuntime.publishWriteActive
                ? "Yayın izi kaydı bulunamadı."
                : "Yayın izi kaydı bulunamadı. Güvenli düşüş modunda kayıt üretilmemiş olabilir."}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {filteredRevisionRows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-2"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] ${revisionClasses(
                          row.status,
                        )}`}
                      >
                        {revisionLabel(row.status)}
                      </span>
                      <span className="rounded-full border border-zinc-800 bg-black px-2.5 py-0.5 text-[11px] text-zinc-500">
                        {formatDateTime(row.publishedAt)}
                      </span>
                    </div>

                    <div>
                      <p className="line-clamp-1 text-sm font-medium text-white">{row.revisionName}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Aktör: {getActorLabel(row.publishedBy, actorMap)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-3">
            <PaginationControls
              page={revisionPage}
              hasNextPage={hasNextRevisionPage}
              previousHref={previousRevisionHref}
              nextHref={nextRevisionHref}
            />
          </div>
        </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex items-start gap-3">
          <FileClock className="mt-0.5 h-5 w-5 text-zinc-300" />
          <div>
            <h2 className="text-sm font-semibold text-white">Kapanış notu</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-400">
              Bu yüzey yalnızca gerçek audit ve yayın izi kayıtlarını okur. Yazım
              mantığı, yayın akışı veya aktör çözümlemesi yeniden tasarlanmadı.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
