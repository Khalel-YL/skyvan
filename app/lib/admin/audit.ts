import "server-only";

import { getDbOrThrow } from "@/db/db";
import { auditLogs, publishRevisions } from "@/db/schema";
import { getGovernanceRuntime } from "./governance";

type AuditAction = "create" | "update" | "delete";
type AuditActorStatus = "configured" | "missing" | "invalid";

type WriteAuditLogInput = {
  entityType: string;
  entityId: string;
  action: AuditAction;
  previousState?: unknown;
  newState?: unknown;
};

type PublishRevisionInput = {
  revisionName: string;
  status?: "draft" | "published" | "rolled_back";
};

type AuditActorResolution = {
  actorId: string;
  status: AuditActorStatus;
  reason: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function resolveAuditActor(): AuditActorResolution {
  const runtime = getGovernanceRuntime();
  const actorId = runtime.auditActorId.trim();

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

export async function writeAuditLog(input: WriteAuditLogInput) {
  const actor = resolveAuditActor();

  if (actor.status !== "configured") {
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

export async function createPublishRevision(input: PublishRevisionInput) {
  const actor = resolveAuditActor();

  if (actor.status !== "configured") {
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
