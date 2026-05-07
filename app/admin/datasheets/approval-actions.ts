"use server";

import { and, count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import {
  AuditActorBindingError,
  type AuditInsertDatabase,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { getDbOrThrow } from "@/db/db";
import { aiDocumentChunks, aiKnowledgeDocuments, products } from "@/db/schema";

type KnowledgeApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "revoked";

type KnowledgeParsingStatus = "pending" | "processing" | "completed" | "failed";
type KnowledgeDocType = "datasheet" | "manual" | "rulebook";

type KnowledgeApprovalActionResult = {
  ok: boolean;
  message: string;
};

type KnowledgeDocumentApprovalRecord = {
  id: string;
  productId: string | null;
  title: string;
  docType: KnowledgeDocType;
  s3Key: string;
  parsingStatus: KnowledgeParsingStatus;
  approvalStatus: KnowledgeApprovalStatus;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvalNote: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
  updatedAt: Date;
};

type ApprovalAuditState = {
  id: string;
  productId: string | null;
  title: string;
  docType: KnowledgeDocType;
  parsingStatus: KnowledgeParsingStatus;
  approvalStatus: KnowledgeApprovalStatus;
  approvedAt: Date | null;
  approvedBy: string | null;
  approvalNote: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revokedReason: string | null;
  updatedAt: Date;
  __meta: {
    action: "approve" | "reject" | "revoke" | "reset_review";
    chunkCount?: number;
    note?: string | null;
    reason?: string | null;
  };
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_NOTE_LENGTH = 500;

function normalizeId(value: string) {
  return String(value ?? "").trim();
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, MAX_NOTE_LENGTH);
}

function getInvalidIdResult(): KnowledgeApprovalActionResult {
  return {
    ok: false,
    message: "Geçersiz bilgi kaydı.",
  };
}

function buildApprovalAuditState(
  document: KnowledgeDocumentApprovalRecord,
  meta: ApprovalAuditState["__meta"],
): ApprovalAuditState {
  return {
    id: document.id,
    productId: document.productId,
    title: document.title,
    docType: document.docType,
    parsingStatus: document.parsingStatus,
    approvalStatus: document.approvalStatus,
    approvedAt: document.approvedAt,
    approvedBy: document.approvedBy,
    approvalNote: document.approvalNote,
    rejectedAt: document.rejectedAt,
    rejectedBy: document.rejectedBy,
    rejectionReason: document.rejectionReason,
    revokedAt: document.revokedAt,
    revokedBy: document.revokedBy,
    revokedReason: document.revokedReason,
    updatedAt: document.updatedAt,
    __meta: meta,
  };
}

async function getKnowledgeDocumentById(
  id: string,
): Promise<KnowledgeDocumentApprovalRecord | null> {
  const database = getDbOrThrow();

  const rows = await database
    .select({
      id: aiKnowledgeDocuments.id,
      productId: aiKnowledgeDocuments.productId,
      title: aiKnowledgeDocuments.title,
      docType: aiKnowledgeDocuments.docType,
      s3Key: aiKnowledgeDocuments.s3Key,
      parsingStatus: aiKnowledgeDocuments.parsingStatus,
      approvalStatus: aiKnowledgeDocuments.approvalStatus,
      approvedAt: aiKnowledgeDocuments.approvedAt,
      approvedBy: aiKnowledgeDocuments.approvedBy,
      approvalNote: aiKnowledgeDocuments.approvalNote,
      rejectedAt: aiKnowledgeDocuments.rejectedAt,
      rejectedBy: aiKnowledgeDocuments.rejectedBy,
      rejectionReason: aiKnowledgeDocuments.rejectionReason,
      revokedAt: aiKnowledgeDocuments.revokedAt,
      revokedBy: aiKnowledgeDocuments.revokedBy,
      revokedReason: aiKnowledgeDocuments.revokedReason,
      updatedAt: aiKnowledgeDocuments.updatedAt,
    })
    .from(aiKnowledgeDocuments)
    .where(eq(aiKnowledgeDocuments.id, id))
    .limit(1);

  return (rows[0] as KnowledgeDocumentApprovalRecord | undefined) ?? null;
}

async function getKnowledgeChunkCount(documentId: string) {
  const database = getDbOrThrow();

  const rows = await database
    .select({ chunkCount: count() })
    .from(aiDocumentChunks)
    .where(eq(aiDocumentChunks.documentId, documentId));

  return Number(rows[0]?.chunkCount ?? 0);
}

async function hasValidProductReference(productId: string) {
  const database = getDbOrThrow();

  const rows = await database
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return rows.length > 0;
}

async function writeKnowledgeApprovalAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  previousState: ApprovalAuditState;
  newState: ApprovalAuditState;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "ai_knowledge_document",
    entityId: input.entityId,
    action: "update",
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

function revalidateKnowledgeApprovalPaths(productId: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");
  revalidatePath("/admin/products");

  if (productId) {
    revalidatePath(`/admin/products/${productId}/documents`);
  }
}

function handleApprovalActionError(error: unknown): KnowledgeApprovalActionResult {
  if (error instanceof AuditActorBindingError) {
    return {
      ok: false,
      message: "Yetkili admin aktörü doğrulanamadı.",
    };
  }

  console.error("Knowledge approval action error", {
    errorName: error instanceof Error ? error.name : "Error",
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  return {
    ok: false,
    message: "Bilgi kaydı güncellenirken beklenmeyen bir hata oluştu.",
  };
}

export async function approveKnowledgeDocument(input: {
  id: string;
  approvalNote?: string | null;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);

  if (!id || !isUuid(id)) {
    return getInvalidIdResult();
  }

  try {
    const actor = await requireStrictAuditActor();
    const database = getDbOrThrow();
    const document = await getKnowledgeDocumentById(id);

    if (!document) {
      return {
        ok: false,
        message: "Bilgi kaydı bulunamadı.",
      };
    }

    if (document.parsingStatus !== "completed") {
      return {
        ok: false,
        message: "Tamamlanmamış belge onaylanamaz.",
      };
    }

    if (!document.title.trim() || !document.s3Key.trim()) {
      return {
        ok: false,
        message: "Geçersiz bilgi kaydı.",
      };
    }

    const chunkCount = await getKnowledgeChunkCount(document.id);

    if (chunkCount <= 0) {
      return {
        ok: false,
        message: "Kaynak parçası olmayan belge onaylanamaz.",
      };
    }

    if (document.docType !== "rulebook") {
      if (!document.productId || !(await hasValidProductReference(document.productId))) {
        return {
          ok: false,
          message: "Kural kitabı dışındaki bilgi kayıtları bir ürüne bağlanmalıdır.",
        };
      }
    }

    if (
      document.approvalStatus !== "pending_review" &&
      document.approvalStatus !== "rejected"
    ) {
      return {
        ok: false,
        message: "Bu durum geçişi için bilgi kaydı uygun değil.",
      };
    }

    const now = new Date();
    const approvalNote = normalizeOptionalText(input.approvalNote);
    const nextState: KnowledgeDocumentApprovalRecord = {
      ...document,
      approvalStatus: "approved",
      approvedAt: now,
      approvedBy: actor.actorId,
      approvalNote,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      updatedAt: now,
    };

    try {
      await writeKnowledgeApprovalAudit({
        database,
        actor,
        entityId: document.id,
        previousState: buildApprovalAuditState(document, {
          action: "approve",
          chunkCount,
          note: approvalNote,
        }),
        newState: buildApprovalAuditState(nextState, {
          action: "approve",
          chunkCount,
          note: approvalNote,
        }),
      });
    } catch {
      return {
        ok: false,
        message: "Audit kaydı oluşturulamadığı için işlem tamamlanmadı.",
      };
    }

    const updatedRows = await database
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "approved",
        approvedAt: now,
        approvedBy: actor.actorId,
        approvalNote,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        revokedAt: null,
        revokedBy: null,
        revokedReason: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(aiKnowledgeDocuments.id, document.id),
          eq(aiKnowledgeDocuments.approvalStatus, document.approvalStatus),
        ),
      )
      .returning({ id: aiKnowledgeDocuments.id });

    if (updatedRows.length === 0) {
      return {
        ok: false,
        message: "Bilgi kaydı güncel olmadığı için işlem tamamlanamadı.",
      };
    }

    revalidateKnowledgeApprovalPaths(document.productId);

    return {
      ok: true,
      message: "Bilgi kaydı AI kullanımına açıldı.",
    };
  } catch (error) {
    return handleApprovalActionError(error);
  }
}

export async function rejectKnowledgeDocument(input: {
  id: string;
  rejectionReason: string;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const rejectionReason = normalizeOptionalText(input.rejectionReason);

  if (!id || !isUuid(id)) {
    return getInvalidIdResult();
  }

  if (!rejectionReason) {
    return {
      ok: false,
      message: "Red nedeni zorunludur.",
    };
  }

  try {
    const actor = await requireStrictAuditActor();
    const database = getDbOrThrow();
    const document = await getKnowledgeDocumentById(id);

    if (!document) {
      return {
        ok: false,
        message: "Bilgi kaydı bulunamadı.",
      };
    }

    if (
      document.approvalStatus !== "pending_review" &&
      document.approvalStatus !== "approved"
    ) {
      return {
        ok: false,
        message: "Bu durum geçişi için bilgi kaydı uygun değil.",
      };
    }

    const now = new Date();
    const nextState: KnowledgeDocumentApprovalRecord = {
      ...document,
      approvalStatus: "rejected",
      approvedAt: null,
      approvedBy: null,
      approvalNote: null,
      rejectedAt: now,
      rejectedBy: actor.actorId,
      rejectionReason,
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      updatedAt: now,
    };

    try {
      await writeKnowledgeApprovalAudit({
        database,
        actor,
        entityId: document.id,
        previousState: buildApprovalAuditState(document, {
          action: "reject",
          reason: rejectionReason,
        }),
        newState: buildApprovalAuditState(nextState, {
          action: "reject",
          reason: rejectionReason,
        }),
      });
    } catch {
      return {
        ok: false,
        message: "Audit kaydı oluşturulamadığı için işlem tamamlanmadı.",
      };
    }

    const updatedRows = await database
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "rejected",
        approvedAt: null,
        approvedBy: null,
        approvalNote: null,
        rejectedAt: now,
        rejectedBy: actor.actorId,
        rejectionReason,
        revokedAt: null,
        revokedBy: null,
        revokedReason: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(aiKnowledgeDocuments.id, document.id),
          eq(aiKnowledgeDocuments.approvalStatus, document.approvalStatus),
        ),
      )
      .returning({ id: aiKnowledgeDocuments.id });

    if (updatedRows.length === 0) {
      return {
        ok: false,
        message: "Bilgi kaydı güncel olmadığı için işlem tamamlanamadı.",
      };
    }

    revalidateKnowledgeApprovalPaths(document.productId);

    return {
      ok: true,
      message: "Bilgi kaydı reddedildi.",
    };
  } catch (error) {
    return handleApprovalActionError(error);
  }
}

export async function revokeKnowledgeDocument(input: {
  id: string;
  revokedReason: string;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const revokedReason = normalizeOptionalText(input.revokedReason);

  if (!id || !isUuid(id)) {
    return getInvalidIdResult();
  }

  if (!revokedReason) {
    return {
      ok: false,
      message: "Geri çekme nedeni zorunludur.",
    };
  }

  try {
    const actor = await requireStrictAuditActor();
    const database = getDbOrThrow();
    const document = await getKnowledgeDocumentById(id);

    if (!document) {
      return {
        ok: false,
        message: "Bilgi kaydı bulunamadı.",
      };
    }

    if (document.approvalStatus !== "approved") {
      return {
        ok: false,
        message: "Bu durum geçişi için bilgi kaydı uygun değil.",
      };
    }

    const now = new Date();
    const nextState: KnowledgeDocumentApprovalRecord = {
      ...document,
      approvalStatus: "revoked",
      approvedAt: null,
      approvedBy: null,
      approvalNote: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      revokedAt: now,
      revokedBy: actor.actorId,
      revokedReason,
      updatedAt: now,
    };

    try {
      await writeKnowledgeApprovalAudit({
        database,
        actor,
        entityId: document.id,
        previousState: buildApprovalAuditState(document, {
          action: "revoke",
          reason: revokedReason,
        }),
        newState: buildApprovalAuditState(nextState, {
          action: "revoke",
          reason: revokedReason,
        }),
      });
    } catch {
      return {
        ok: false,
        message: "Audit kaydı oluşturulamadığı için işlem tamamlanmadı.",
      };
    }

    const updatedRows = await database
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "revoked",
        approvedAt: null,
        approvedBy: null,
        approvalNote: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        revokedAt: now,
        revokedBy: actor.actorId,
        revokedReason,
        updatedAt: now,
      })
      .where(
        and(
          eq(aiKnowledgeDocuments.id, document.id),
          eq(aiKnowledgeDocuments.approvalStatus, document.approvalStatus),
        ),
      )
      .returning({ id: aiKnowledgeDocuments.id });

    if (updatedRows.length === 0) {
      return {
        ok: false,
        message: "Bilgi kaydı güncel olmadığı için işlem tamamlanamadı.",
      };
    }

    revalidateKnowledgeApprovalPaths(document.productId);

    return {
      ok: true,
      message: "Bilgi kaydı AI kullanımından geri çekildi.",
    };
  } catch (error) {
    return handleApprovalActionError(error);
  }
}

export async function resetKnowledgeReview(input: {
  id: string;
  reason?: string | null;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const reason = normalizeOptionalText(input.reason);

  if (!id || !isUuid(id)) {
    return getInvalidIdResult();
  }

  try {
    const actor = await requireStrictAuditActor();
    const database = getDbOrThrow();
    const document = await getKnowledgeDocumentById(id);

    if (!document) {
      return {
        ok: false,
        message: "Bilgi kaydı bulunamadı.",
      };
    }

    if (
      document.approvalStatus !== "rejected" &&
      document.approvalStatus !== "revoked"
    ) {
      return {
        ok: false,
        message: "Bu durum geçişi için bilgi kaydı uygun değil.",
      };
    }

    const now = new Date();
    const nextState: KnowledgeDocumentApprovalRecord = {
      ...document,
      approvalStatus: "pending_review",
      approvedAt: null,
      approvedBy: null,
      approvalNote: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      revokedAt: null,
      revokedBy: null,
      revokedReason: null,
      updatedAt: now,
    };

    try {
      await writeKnowledgeApprovalAudit({
        database,
        actor,
        entityId: document.id,
        previousState: buildApprovalAuditState(document, {
          action: "reset_review",
          reason,
        }),
        newState: buildApprovalAuditState(nextState, {
          action: "reset_review",
          reason,
        }),
      });
    } catch {
      return {
        ok: false,
        message: "Audit kaydı oluşturulamadığı için işlem tamamlanmadı.",
      };
    }

    const updatedRows = await database
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "pending_review",
        approvedAt: null,
        approvedBy: null,
        approvalNote: null,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
        revokedAt: null,
        revokedBy: null,
        revokedReason: null,
        updatedAt: now,
      })
      .where(
        and(
          eq(aiKnowledgeDocuments.id, document.id),
          eq(aiKnowledgeDocuments.approvalStatus, document.approvalStatus),
        ),
      )
      .returning({ id: aiKnowledgeDocuments.id });

    if (updatedRows.length === 0) {
      return {
        ok: false,
        message: "Bilgi kaydı güncel olmadığı için işlem tamamlanamadı.",
      };
    }

    revalidateKnowledgeApprovalPaths(document.productId);

    return {
      ok: true,
      message: "Bilgi kaydı yeniden incelemeye alındı.",
    };
  } catch (error) {
    return handleApprovalActionError(error);
  }
}
