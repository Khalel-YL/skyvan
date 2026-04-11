import "server-only";

import { eq } from "drizzle-orm";

import { db, getDbOrThrow } from "@/db/db";
import { auditLogs, publishRevisions, users } from "@/db/schema";
import { getGovernanceRuntime } from "./governance";

type AuditAction = "create" | "update" | "delete";
type AuditActorStatus = "configured" | "missing" | "invalid";
type AuditActorRecordStatus = "resolved" | "not_found" | "unavailable";

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

type AuditActorResolution = {
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

type ResolvedAuditWriteActor = {
  actorId: string;
  enabled: boolean;
  reason: string;
};

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

function resolveAuditActor(adminUserId?: string | null): AuditActorResolution {
  const runtime = getGovernanceRuntime();
  const actorId = String(adminUserId ?? runtime.auditActorId).trim();

  if (!actorId) {
    return {
      actorId,
      status: "missing",
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID tanımlı değil. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  if (!isUuid(actorId)) {
    return {
      actorId,
      status: "invalid",
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID geçerli UUID formatında değil. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  return {
    actorId,
    status: "configured",
    reason: "Audit actor yapılandırılmış. Audit ve publish revision yazımı aktif.",
  };
}

export function getAuditRuntimeSummary() {
  const actor = resolveAuditActor();

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

async function resolveAuditWriteActor(
  adminUserId?: string | null,
): Promise<ResolvedAuditWriteActor> {
  const actor = resolveAuditActor(adminUserId);

  if (actor.status !== "configured") {
    return {
      actorId: actor.actorId,
      enabled: false,
      reason: actor.reason,
    };
  }

  if (!db) {
    return {
      actorId: actor.actorId,
      enabled: false,
      reason:
        "Veritabanı çevrimdışı olduğu için audit actor users tablosunda doğrulanamadı. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  let actorRecord: AuditActorRecord | null = null;

  try {
    actorRecord = await findAuditActorRecord(actor.actorId);
  } catch (error) {
    console.warn("audit write actor validation warning:", error);

    return {
      actorId: actor.actorId,
      enabled: false,
      reason:
        "Audit actor users tablosunda doğrulanırken beklenmeyen bir hata oluştu. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  if (!actorRecord) {
    return {
      actorId: actor.actorId,
      enabled: false,
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID geçerli UUID olsa da users tablosunda karşılık gelen kayıt yok. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
    };
  }

  return {
    actorId: actor.actorId,
    enabled: true,
    reason: "Audit actor doğrulandı. Audit ve publish revision yazımı aktif.",
  };
}

export async function getAuditRuntimeValidation() {
  const actor = resolveAuditActor();
  const actorPreview = getActorPreview(actor.actorId);

  if (actor.status !== "configured") {
    return {
      enabled: false,
      writeActive: false,
      publishWriteActive: false,
      closureState: "blocked" as const,
      closureBlocked: true,
      blocker: "Audit actor eksik veya geçersiz.",
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
      enabled: false,
      writeActive: false,
      publishWriteActive: false,
      closureState: "blocked" as const,
      closureBlocked: true,
      blocker: "Veritabanı çevrimdışı olduğu için audit actor doğrulanamadı.",
      actorId: actor.actorId,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "unavailable" as AuditActorRecordStatus,
      actorName: null,
      actorEmail: null,
      actorRole: null as AuditActorRecord["role"] | null,
      roleAligned: false,
      reason:
        "Veritabanı çevrimdışı olduğu için audit actor users tablosunda doğrulanamadı. Audit ve publish revision yazımı doğrulanmış kabul edilemez.",
    };
  }

  try {
    const actorRecord = await findAuditActorRecord(actor.actorId);

    if (!actorRecord) {
      return {
        enabled: false,
        writeActive: false,
        publishWriteActive: false,
        closureState: "blocked" as const,
        closureBlocked: true,
        blocker: "Audit actor users tablosunda bulunamadı.",
        actorId: actor.actorId,
        actorPreview,
        actorStatus: actor.status,
        actorRecordStatus: "not_found" as AuditActorRecordStatus,
        actorName: null,
        actorEmail: null,
        actorRole: null as AuditActorRecord["role"] | null,
        roleAligned: false,
        reason:
          "SKYVAN_ADMIN_AUDIT_USER_ID geçerli UUID olsa da users tablosunda karşılık gelen kayıt yok. Audit ve publish revision yazımı safe-degrade modunda no-op çalışır.",
      };
    }

    const roleAligned = actorRecord.role === "admin";

    return {
      enabled: true,
      writeActive: true,
      publishWriteActive: true,
      closureState: roleAligned ? ("ready" as const) : ("warning" as const),
      closureBlocked: false,
      blocker: null,
      actorId: actorRecord.id,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "resolved" as AuditActorRecordStatus,
      actorName: actorRecord.name,
      actorEmail: actorRecord.email,
      actorRole: actorRecord.role,
      roleAligned,
      reason: roleAligned
        ? "Audit actor doğrulandı. Audit ve publish revision yazımı aktif."
        : "Audit actor users tablosunda bulundu ancak rolü admin değil. Yazım aktif kalır; final closure için admin rolüyle hizalama önerilir.",
    };
  } catch (error) {
    console.warn("audit runtime validation warning:", error);

    return {
      enabled: false,
      writeActive: false,
      publishWriteActive: false,
      closureState: "blocked" as const,
      closureBlocked: true,
      blocker: "Audit actor doğrulaması tamamlanamadı.",
      actorId: actor.actorId,
      actorPreview,
      actorStatus: actor.status,
      actorRecordStatus: "unavailable" as AuditActorRecordStatus,
      actorName: null,
      actorEmail: null,
      actorRole: null as AuditActorRecord["role"] | null,
      roleAligned: false,
      reason:
        "Audit actor users tablosunda doğrulanırken beklenmeyen bir hata oluştu. Audit ve publish revision yazımı doğrulanmış kabul edilmemelidir.",
    };
  }
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  const actor = await resolveAuditWriteActor(input.adminUserId);

  if (!actor.enabled) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: actor.reason,
    };
  }

  const db = getDbOrThrow();

  await db.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    adminUserId: actor.actorId,
    action: input.action,
    previousState: input.previousState ?? null,
    newState: input.newState ?? null,
  });

  return {
    ok: true as const,
    skipped: false as const,
  };
}

export async function writeAdminAudit(input: WriteAdminAuditInput) {
  const { logLabel, ...auditInput } = input;
  const label = (logLabel || input.entityType).trim() || "admin";

  try {
    const result = await writeAuditLog(auditInput);

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

export async function createPublishRevision(input: PublishRevisionInput) {
  const actor = await resolveAuditWriteActor();

  if (!actor.enabled) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: actor.reason,
    };
  }

  const db = getDbOrThrow();

  await db.insert(publishRevisions).values({
    revisionName: input.revisionName,
    publishedBy: actor.actorId,
    status: input.status ?? "published",
  });

  return {
    ok: true as const,
    skipped: false as const,
  };
}
