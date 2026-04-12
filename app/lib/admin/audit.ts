import "server-only";

import { eq } from "drizzle-orm";

import { getAdminAccessState } from "@/app/lib/auth/server";
import { db, getDbOrThrow } from "@/db/db";
import { auditLogs, publishRevisions, users } from "@/db/schema";
import { getGovernanceRuntime } from "./governance";

type AuditAction = "create" | "update" | "delete";
type AuditActorStatus = "configured" | "missing" | "invalid";
type AuditActorRecordStatus = "resolved" | "not_found" | "unavailable";
type SoftAuditActorSource = "session" | "explicit" | "env" | "missing";

type WriteAuditLogInput = {
  entityType: string;
  entityId: string;
  action: AuditAction;
  previousState?: unknown;
  newState?: unknown;
  adminUserId?: string | null;
};

type PublishRevisionInput = {
  revisionName: string;
  status?: "draft" | "published" | "rolled_back";
};

type WriteAdminAuditInput = WriteAuditLogInput & {
  logLabel?: string;
};

type LegacyAuditActorResolution = {
  actorId: string;
  status: AuditActorStatus;
  reason: string;
};

type AuditActorRecord = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
};

type ResolvedSoftAuditActor = {
  actorId: string;
  enabled: boolean;
  reason: string;
  source: SoftAuditActorSource;
};

export type StrictAuditActor = {
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  actorRole: "admin";
  reason: string;
};

export type StrictAuditDatabase = {
  insert: ReturnType<typeof getDbOrThrow>["insert"];
};

export type AuditInsertDatabase = StrictAuditDatabase;

type StrictAuditLogWriteInput = Omit<WriteAuditLogInput, "adminUserId"> & {
  actor: StrictAuditActor;
};

type StrictPublishRevisionWriteInput = PublishRevisionInput & {
  actor: StrictAuditActor;
};

export class AuditActorBindingError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function getActorPreview(actorId: string) {
  const normalized = actorId.trim();

  if (!normalized) {
    return "Tanımlı değil";
  }

  if (normalized.length <= 16) {
    return normalized;
  }

  return `${normalized.slice(0, 8)}…${normalized.slice(-6)}`;
}

function resolveLegacyAuditActorConfig(
  adminUserId?: string | null,
): LegacyAuditActorResolution {
  const runtime = getGovernanceRuntime();
  const actorId = String(adminUserId ?? runtime.auditActorId).trim();

  if (!actorId) {
    return {
      actorId,
      status: "missing",
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID tanımlı değil. Legacy audit/publish fallback yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  if (!isUuid(actorId)) {
    return {
      actorId,
      status: "invalid",
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID geçerli UUID formatında değil. Legacy audit/publish fallback yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  return {
    actorId,
    status: "configured",
    reason: "Legacy audit actor yapılandırılmış.",
  };
}

export function getAuditRuntimeSummary() {
  const actor = resolveLegacyAuditActorConfig();

  return {
    enabled: actor.status === "configured",
    actorId: actor.actorId,
    actorStatus: actor.status,
    reason: actor.reason,
  };
}

async function findAuditActorRecord(actorId: string): Promise<AuditActorRecord | null> {
  const database = getDbOrThrow();

  const rows = await database
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);

  return (rows[0] as AuditActorRecord | undefined) ?? null;
}

async function findStrictAuditActor(): Promise<StrictAuditActor | null> {
  const access = await getAdminAccessState();

  if (!access.allowed || !access.user) {
    return null;
  }

  return {
    actorId: access.user.id,
    actorName: access.user.name,
    actorEmail: access.user.email,
    actorRole: "admin",
    reason:
      "Hard-governance audit actor mevcut authenticated admin session user üzerinden bağlandı.",
  };
}

async function resolveSoftAuditActorById(params: {
  actorId: string;
  source: "explicit" | "env";
}) {
  if (!db) {
    return {
      actorId: params.actorId,
      enabled: false,
      reason:
        params.source === "explicit"
          ? "Veritabanı çevrimdışı olduğu için explicit audit actor users tablosunda doğrulanamadı."
          : "Veritabanı çevrimdışı olduğu için legacy audit actor users tablosunda doğrulanamadı. Fallback yazımı safe-degrade modunda no-op çalışır.",
      source: params.source,
    } satisfies ResolvedSoftAuditActor;
  }

  try {
    const actorRecord = await findAuditActorRecord(params.actorId);

    if (!actorRecord) {
      return {
        actorId: params.actorId,
        enabled: false,
        reason:
          params.source === "explicit"
            ? "Explicit audit actor users tablosunda bulunamadı. Güvenilir fallback audit write açılamadı."
            : "SKYVAN_ADMIN_AUDIT_USER_ID users tablosunda bulunamadı. Fallback yazımı safe-degrade modunda no-op çalışır.",
        source: params.source,
      } satisfies ResolvedSoftAuditActor;
    }

    return {
      actorId: actorRecord.id,
      enabled: true,
      reason:
        params.source === "explicit"
          ? "Explicit audit actor doğrulandı."
          : "Legacy env audit actor doğrulandı. Bu yol yalnızca best-effort/compat kullanım içindir.",
      source: params.source,
    } satisfies ResolvedSoftAuditActor;
  } catch (error) {
    console.warn(`${params.source} audit actor validation warning:`, error);

    return {
      actorId: params.actorId,
      enabled: false,
      reason:
        params.source === "explicit"
          ? "Explicit audit actor doğrulanırken beklenmeyen bir hata oluştu."
          : "Legacy audit actor doğrulanırken beklenmeyen bir hata oluştu. Fallback yazımı safe-degrade modunda no-op çalışır.",
      source: params.source,
    } satisfies ResolvedSoftAuditActor;
  }
}

async function resolveBestEffortAuditActor(
  adminUserId?: string | null,
): Promise<ResolvedSoftAuditActor> {
  const strictActor = await findStrictAuditActor();

  if (strictActor) {
    return {
      actorId: strictActor.actorId,
      enabled: true,
      reason: strictActor.reason,
      source: "session",
    };
  }

  const explicitActorId = String(adminUserId ?? "").trim();

  if (explicitActorId) {
    return resolveSoftAuditActorById({
      actorId: explicitActorId,
      source: "explicit",
    });
  }

  const actor = resolveLegacyAuditActorConfig();

  if (actor.status !== "configured") {
    return {
      actorId: actor.actorId,
      enabled: false,
      reason: actor.reason,
      source: "missing",
    };
  }

  return resolveSoftAuditActorById({
    actorId: actor.actorId,
    source: "env",
  });
}

export async function requireStrictAuditActor(): Promise<StrictAuditActor> {
  const actor = await findStrictAuditActor();

  if (!actor) {
    throw new AuditActorBindingError(
      "audit-actor-required",
      "Hard-governance audit actor mevcut authenticated admin session user üzerinden çözülemedi.",
    );
  }

  return actor;
}

export async function requireCurrentAdminAuditActor(): Promise<StrictAuditActor> {
  return requireStrictAuditActor();
}

export async function getAuditRuntimeValidation() {
  const strictActor = await findStrictAuditActor();

  if (strictActor) {
    return {
      enabled: true,
      writeActive: true,
      publishWriteActive: true,
      closureState: "ready" as const,
      closureBlocked: false,
      blocker: null,
      actorId: strictActor.actorId,
      actorPreview: getActorPreview(strictActor.actorId),
      actorStatus: "configured" as const,
      actorRecordStatus: "resolved" as AuditActorRecordStatus,
      actorName: strictActor.actorName,
      actorEmail: strictActor.actorEmail,
      actorRole: strictActor.actorRole,
      roleAligned: true,
      reason:
        "Audit ve publish actor mevcut authenticated admin session user üzerinden hard-bind ediliyor.",
    };
  }

  const actor = resolveLegacyAuditActorConfig();
  const actorPreview = getActorPreview(actor.actorId);

  if (actor.status !== "configured") {
    return {
      enabled: false,
      writeActive: false,
      publishWriteActive: false,
      closureState: "blocked" as const,
      closureBlocked: true,
      blocker: "Strict audit actor çözülemedi ve legacy fallback de hazır değil.",
      actorId: actor.actorId,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "unavailable" as AuditActorRecordStatus,
      actorName: null,
      actorEmail: null,
      actorRole: null as AuditActorRecord["role"] | null,
      roleAligned: false,
      reason: actor.reason,
    };
  }

  if (!db) {
    return {
      enabled: true,
      writeActive: false,
      publishWriteActive: false,
      closureState: "warning" as const,
      closureBlocked: false,
      blocker: "Strict actor yok. Legacy env actor yalnızca visibility/fallback amacıyla görülebilir.",
      actorId: actor.actorId,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "unavailable" as AuditActorRecordStatus,
      actorName: null,
      actorEmail: null,
      actorRole: null as AuditActorRecord["role"] | null,
      roleAligned: false,
      reason:
        "Current session actor çözülemedi. Legacy env actor da veritabanı doğrulaması olmadan hard-governance için kabul edilmez.",
    };
  }

  try {
    const actorRecord = await findAuditActorRecord(actor.actorId);

    if (!actorRecord) {
      return {
        enabled: true,
        writeActive: false,
        publishWriteActive: false,
        closureState: "warning" as const,
        closureBlocked: false,
        blocker:
          "Strict actor yok. Legacy env actor users tablosunda bulunamadığı için yalnızca degraded visibility kalır.",
        actorId: actor.actorId,
        actorPreview,
        actorStatus: actor.status,
        actorRecordStatus: "not_found" as AuditActorRecordStatus,
        actorName: null,
        actorEmail: null,
        actorRole: null as AuditActorRecord["role"] | null,
        roleAligned: false,
        reason:
          "Legacy env fallback yapılandırılmış görünüyor, ancak hard-governance writes için kabul edilebilir actor çözümü yok.",
      };
    }

    const roleAligned = actorRecord.role === "admin";

    return {
      enabled: true,
      writeActive: false,
      publishWriteActive: false,
      closureState: "warning" as const,
      closureBlocked: false,
      blocker:
        "Strict actor yok. Legacy env actor yalnızca best-effort görünürlük içindir; kritik write yüzeyleri için kabul edilmez.",
      actorId: actorRecord.id,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "resolved" as AuditActorRecordStatus,
      actorName: actorRecord.name,
      actorEmail: actorRecord.email,
      actorRole: actorRecord.role,
      roleAligned,
      reason:
        "Current session actor çözülemediği için runtime yalnızca legacy env actor gösterebilir. Hard-governance writes strict actor ister.",
    };
  } catch (error) {
    console.warn("audit runtime validation warning:", error);

    return {
      enabled: true,
      writeActive: false,
      publishWriteActive: false,
      closureState: "warning" as const,
      closureBlocked: false,
      blocker:
        "Strict actor yok. Legacy env actor doğrulaması tamamlanamadı; hard-governance writes kapalı kabul edilmelidir.",
      actorId: actor.actorId,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "unavailable" as AuditActorRecordStatus,
      actorName: null,
      actorEmail: null,
      actorRole: null as AuditActorRecord["role"] | null,
      roleAligned: false,
      reason:
        "Legacy audit actor doğrulanırken beklenmeyen bir hata oluştu.",
    };
  }
}

export async function writeStrictAuditLogInTransaction(
  database: StrictAuditDatabase,
  input: StrictAuditLogWriteInput,
) {
  await database.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    adminUserId: input.actor.actorId,
    action: input.action,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
  });
}

export async function insertAuditLogWithActor(
  database: StrictAuditDatabase,
  input: WriteAuditLogInput & { adminUserId: string },
) {
  await database.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    adminUserId: input.adminUserId,
    action: input.action,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
  });
}

export async function writeBestEffortAuditLog(input: WriteAuditLogInput) {
  const actor = await resolveBestEffortAuditActor(input.adminUserId);

  if (!actor.enabled) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: actor.reason,
    };
  }

  const database = getDbOrThrow();

  await insertAuditLogWithActor(database, {
    ...input,
    adminUserId: actor.actorId,
  });

  return {
    ok: true as const,
    skipped: false as const,
  };
}

// Compatibility export for existing non-critical modules. Best-effort only.
export async function writeAuditLog(input: WriteAuditLogInput) {
  return writeBestEffortAuditLog(input);
}

export async function writeBestEffortAdminAudit(input: WriteAdminAuditInput) {
  const { logLabel, ...auditInput } = input;
  const label = (logLabel || input.entityType).trim() || "admin";

  try {
    const result = await writeBestEffortAuditLog(auditInput);

    if (!result.ok || result.skipped) {
      console.warn(`${label} audit skipped:`, {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }

    return result;
  } catch (error) {
    console.warn(`${label} audit warning:`, {
      entityId: input.entityId,
      action: input.action,
      error,
    });

    return {
      ok: false as const,
      skipped: true as const,
      reason: "Audit yazımı sırasında beklenmeyen bir hata oluştu.",
    };
  }
}

// Compatibility export for existing non-critical modules. Best-effort only.
export async function writeAdminAudit(input: WriteAdminAuditInput) {
  return writeBestEffortAdminAudit(input);
}

export async function writeStrictPublishRevisionInTransaction(
  database: StrictAuditDatabase,
  input: StrictPublishRevisionWriteInput,
) {
  await database.insert(publishRevisions).values({
    revisionName: input.revisionName,
    publishedBy: input.actor.actorId,
    status: input.status ?? "published",
  });
}

export async function insertPublishRevisionWithActor(
  database: StrictAuditDatabase,
  input: PublishRevisionInput & { publishedBy: string },
) {
  await database.insert(publishRevisions).values({
    revisionName: input.revisionName,
    publishedBy: input.publishedBy,
    status: input.status ?? "published",
  });
}

export async function writeBestEffortPublishRevision(input: PublishRevisionInput) {
  const actor = await resolveBestEffortAuditActor();

  if (!actor.enabled) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: actor.reason,
    };
  }

  const database = getDbOrThrow();

  await insertPublishRevisionWithActor(database, {
    ...input,
    publishedBy: actor.actorId,
  });

  return {
    ok: true as const,
    skipped: false as const,
  };
}

// Compatibility export for existing non-critical modules. Best-effort only.
export async function createPublishRevision(input: PublishRevisionInput) {
  return writeBestEffortPublishRevision(input);
}
