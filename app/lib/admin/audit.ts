import "server-only";

import { getDbOrThrow } from "@/db/db";
import { auditLogs, publishRevisions } from "@/db/schema";
import { getGovernanceRuntime } from "./governance";

type AuditAction = "create" | "update" | "delete";

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function getAuditRuntimeSummary() {
  const runtime = getGovernanceRuntime();

  if (!runtime.auditActorId || !isUuid(runtime.auditActorId)) {
    return {
      enabled: false,
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID tanımlı değil veya geçerli UUID formatında değil.",
    };
  }

  return {
    enabled: true,
    reason: "Audit yazımı aktif.",
  };
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  const runtime = getGovernanceRuntime();

  if (!runtime.auditActorId || !isUuid(runtime.auditActorId)) {
    return {
      ok: false as const,
      skipped: true as const,
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID tanımlı değil veya geçerli UUID formatında değil.",
    };
  }

  const db = getDbOrThrow();

  await db.insert(auditLogs).values({
    entityType: input.entityType,
    entityId: input.entityId,
    adminUserId: runtime.auditActorId,
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
  const runtime = getGovernanceRuntime();

  if (!runtime.auditActorId || !isUuid(runtime.auditActorId)) {
    return {
      ok: false as const,
      skipped: true as const,
      reason:
        "SKYVAN_ADMIN_AUDIT_USER_ID tanımlı değil veya geçerli UUID formatında değil.",
    };
  }

  const db = getDbOrThrow();

  await db.insert(publishRevisions).values({
    revisionName: input.revisionName,
    publishedBy: runtime.auditActorId,
    status: input.status ?? "published",
  });

  return {
    ok: true as const,
    skipped: false as const,
  };
}