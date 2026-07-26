import { and, count, eq, sql } from "drizzle-orm";

import {
  type StrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { runDatabaseTransaction, type TransactionClient } from "@/db/db";
import { aiDocumentChunks, aiKnowledgeDocuments, products } from "@/db/schema";

type KnowledgeApprovalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "revoked";

type KnowledgeParsingStatus = "pending" | "processing" | "completed" | "failed";
type KnowledgeDocType = "datasheet" | "manual" | "rulebook";
type KnowledgeApprovalAction = "approve" | "reject" | "revoke" | "reset_review";

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

type KnowledgeApprovalAuditState = {
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
};

type KnowledgeApprovalMutationErrorCode =
  | "invalid-id"
  | "not-found"
  | "invalid-transition"
  | "parsing-not-completed"
  | "missing-document-fields"
  | "missing-chunks"
  | "missing-product-reference"
  | "concurrent-approval-change"
  | "update-failed";

export type KnowledgeApprovalMutationResult = {
  documentId: string;
  productId: string | null;
  message: string;
};

export class KnowledgeApprovalMutationError extends Error {
  code: KnowledgeApprovalMutationErrorCode;

  constructor(code: KnowledgeApprovalMutationErrorCode, message: string) {
    super(message);
    this.name = "KnowledgeApprovalMutationError";
    this.code = code;
  }
}

const knowledgeDocumentReturningFields = {
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
};

function toKnowledgeApprovalAuditState(
  document: KnowledgeDocumentApprovalRecord,
): KnowledgeApprovalAuditState {
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
  };
}

async function acquireKnowledgeDocumentLock(
  tx: TransactionClient,
  documentId: string,
) {
  await tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${`ai-knowledge-document:${documentId}`}))`,
  );
}

async function findKnowledgeDocumentById(
  tx: TransactionClient,
  id: string,
): Promise<KnowledgeDocumentApprovalRecord | null> {
  const rows = await tx
    .select(knowledgeDocumentReturningFields)
    .from(aiKnowledgeDocuments)
    .where(eq(aiKnowledgeDocuments.id, id))
    .limit(1);

  return (rows[0] as KnowledgeDocumentApprovalRecord | undefined) ?? null;
}

async function getKnowledgeChunkCount(tx: TransactionClient, documentId: string) {
  const rows = await tx
    .select({ chunkCount: count() })
    .from(aiDocumentChunks)
    .where(eq(aiDocumentChunks.documentId, documentId));

  return Number(rows[0]?.chunkCount ?? 0);
}

async function assertProductReferenceForApproval(
  tx: TransactionClient,
  document: KnowledgeDocumentApprovalRecord,
) {
  if (document.docType === "rulebook") {
    return;
  }

  if (!document.productId) {
    throw new KnowledgeApprovalMutationError(
      "missing-product-reference",
      "Kural kitabı dışındaki bilgi kayıtları bir ürüne bağlanmalıdır.",
    );
  }

  const productRows = await tx
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, document.productId))
    .limit(1);

  if (!productRows[0]) {
    throw new KnowledgeApprovalMutationError(
      "missing-product-reference",
      "Kural kitabı dışındaki bilgi kayıtları bir ürüne bağlanmalıdır.",
    );
  }
}

async function assertApprovalReadiness(
  tx: TransactionClient,
  document: KnowledgeDocumentApprovalRecord,
) {
  if (document.parsingStatus !== "completed") {
    throw new KnowledgeApprovalMutationError(
      "parsing-not-completed",
      "Tamamlanmamış belge onaylanamaz.",
    );
  }

  if (!document.title.trim() || !document.s3Key.trim()) {
    throw new KnowledgeApprovalMutationError(
      "missing-document-fields",
      "Geçersiz bilgi kaydı.",
    );
  }

  const chunkCount = await getKnowledgeChunkCount(tx, document.id);

  if (chunkCount <= 0) {
    throw new KnowledgeApprovalMutationError(
      "missing-chunks",
      "Kaynak parçası olmayan belge onaylanamaz.",
    );
  }

  await assertProductReferenceForApproval(tx, document);
}

function assertAllowedTransition(
  action: KnowledgeApprovalAction,
  status: KnowledgeApprovalStatus,
) {
  const allowedStatuses: Record<
    KnowledgeApprovalAction,
    KnowledgeApprovalStatus[]
  > = {
    approve: ["pending_review", "rejected"],
    reject: ["pending_review", "approved"],
    revoke: ["approved"],
    reset_review: ["rejected", "revoked"],
  };

  if (!allowedStatuses[action].includes(status)) {
    throw new KnowledgeApprovalMutationError(
      "invalid-transition",
      "Bu durum geçişi için bilgi kaydı uygun değil.",
    );
  }
}

function getSuccessMessage(action: KnowledgeApprovalAction) {
  switch (action) {
    case "approve":
      return "Bilgi kaydı AI kullanımına açıldı.";
    case "reject":
      return "Bilgi kaydı reddedildi.";
    case "revoke":
      return "Bilgi kaydı AI kullanımından geri çekildi.";
    case "reset_review":
      return "Bilgi kaydı yeniden incelemeye alındı.";
  }
}

async function updateKnowledgeDocumentApproval(params: {
  tx: TransactionClient;
  document: KnowledgeDocumentApprovalRecord;
  action: KnowledgeApprovalAction;
  actor: StrictAuditActor;
  noteOrReason: string | null;
  now: Date;
}) {
  const { tx, document, action, actor, noteOrReason, now } = params;

  if (action === "approve") {
    return tx
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "approved",
        approvedAt: now,
        approvedBy: actor.actorId,
        approvalNote: noteOrReason,
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
      .returning(knowledgeDocumentReturningFields);
  }

  if (action === "reject") {
    return tx
      .update(aiKnowledgeDocuments)
      .set({
        approvalStatus: "rejected",
        approvedAt: null,
        approvedBy: null,
        approvalNote: null,
        rejectedAt: now,
        rejectedBy: actor.actorId,
        rejectionReason: noteOrReason,
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
      .returning(knowledgeDocumentReturningFields);
  }

  if (action === "revoke") {
    return tx
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
        revokedReason: noteOrReason,
        updatedAt: now,
      })
      .where(
        and(
          eq(aiKnowledgeDocuments.id, document.id),
          eq(aiKnowledgeDocuments.approvalStatus, document.approvalStatus),
        ),
      )
      .returning(knowledgeDocumentReturningFields);
  }

  return tx
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
    .returning(knowledgeDocumentReturningFields);
}

async function mutateKnowledgeApprovalInTransaction(params: {
  id: string;
  action: KnowledgeApprovalAction;
  actor: StrictAuditActor;
  noteOrReason: string | null;
}): Promise<KnowledgeApprovalMutationResult> {
  return runDatabaseTransaction(async (tx) => {
    await acquireKnowledgeDocumentLock(tx, params.id);

    const existingDocument = await findKnowledgeDocumentById(tx, params.id);

    if (!existingDocument) {
      throw new KnowledgeApprovalMutationError(
        "not-found",
        "Bilgi kaydı bulunamadı.",
      );
    }

    if (params.action === "approve") {
      await assertApprovalReadiness(tx, existingDocument);
    }

    assertAllowedTransition(params.action, existingDocument.approvalStatus);

    const previousState = toKnowledgeApprovalAuditState(existingDocument);
    const updatedRows = await updateKnowledgeDocumentApproval({
      tx,
      document: existingDocument,
      action: params.action,
      actor: params.actor,
      noteOrReason: params.noteOrReason,
      now: new Date(),
    });
    const updatedDocument =
      (updatedRows[0] as KnowledgeDocumentApprovalRecord | undefined) ?? null;

    if (!updatedDocument) {
      throw new KnowledgeApprovalMutationError(
        "concurrent-approval-change",
        "Bilgi kaydı başka bir işlem tarafından değiştirildi. Listeyi yenileyip tekrar deneyin.",
      );
    }

    await writeStrictAuditLogInTransaction(tx, {
      entityType: "ai_knowledge_document",
      entityId: updatedDocument.id,
      action: "update",
      previousState,
      newState: toKnowledgeApprovalAuditState(updatedDocument),
      actor: params.actor,
    });

    return {
      documentId: updatedDocument.id,
      productId: updatedDocument.productId,
      message: getSuccessMessage(params.action),
    };
  });
}

export async function approveKnowledgeDocumentInTransaction(
  input: { id: string; approvalNote: string | null },
  actor: StrictAuditActor,
) {
  return mutateKnowledgeApprovalInTransaction({
    id: input.id,
    action: "approve",
    actor,
    noteOrReason: input.approvalNote,
  });
}

export async function rejectKnowledgeDocumentInTransaction(
  input: { id: string; rejectionReason: string },
  actor: StrictAuditActor,
) {
  return mutateKnowledgeApprovalInTransaction({
    id: input.id,
    action: "reject",
    actor,
    noteOrReason: input.rejectionReason,
  });
}

export async function revokeKnowledgeDocumentInTransaction(
  input: { id: string; revokedReason: string },
  actor: StrictAuditActor,
) {
  return mutateKnowledgeApprovalInTransaction({
    id: input.id,
    action: "revoke",
    actor,
    noteOrReason: input.revokedReason,
  });
}

export async function resetKnowledgeReviewInTransaction(
  input: { id: string; reason: string | null },
  actor: StrictAuditActor,
) {
  return mutateKnowledgeApprovalInTransaction({
    id: input.id,
    action: "reset_review",
    actor,
    noteOrReason: input.reason,
  });
}
