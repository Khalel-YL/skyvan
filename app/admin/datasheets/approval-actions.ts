"use server";

import { revalidatePath } from "next/cache";
import { validate as validateUuid } from "uuid";

import {
  AuditActorBindingError,
  requireStrictAuditActor,
  type StrictAuditActor,
} from "@/app/lib/admin/audit";

import {
  approveKnowledgeDocumentInTransaction,
  KnowledgeApprovalMutationError,
  rejectKnowledgeDocumentInTransaction,
  resetKnowledgeReviewInTransaction,
  revokeKnowledgeDocumentInTransaction,
  type KnowledgeApprovalMutationResult,
} from "./approval-transactions";

type KnowledgeApprovalActionResult = {
  ok: boolean;
  message: string;
};

const MAX_NOTE_LENGTH = 500;

function normalizeId(value: string) {
  return String(value ?? "").trim();
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

function revalidateKnowledgeApprovalPaths(productId: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");
  revalidatePath("/admin/products");

  if (productId) {
    revalidatePath(`/admin/products/${productId}/documents`);
  }
}

function logApprovalActionError(params: {
  action: string;
  entityId: string | null;
  error: unknown;
}) {
  console.error("Knowledge approval action error", {
    action: params.action,
    entityId: params.entityId,
    errorName: params.error instanceof Error ? params.error.name : "Error",
    errorCode:
      params.error instanceof KnowledgeApprovalMutationError ||
      params.error instanceof AuditActorBindingError
        ? params.error.code
        : undefined,
  });
}

function handleApprovalActionError(params: {
  action: string;
  entityId: string | null;
  error: unknown;
}): KnowledgeApprovalActionResult {
  if (params.error instanceof AuditActorBindingError) {
    logApprovalActionError(params);

    return {
      ok: false,
      message:
        "Admin audit oturumu doğrulanamadı. Lütfen tekrar giriş yapıp işlemi yeniden deneyin.",
    };
  }

  if (params.error instanceof KnowledgeApprovalMutationError) {
    logApprovalActionError(params);

    return {
      ok: false,
      message: params.error.message,
    };
  }

  logApprovalActionError(params);

  return {
    ok: false,
    message: "Bilgi kaydı güncellenirken beklenmeyen bir hata oluştu.",
  };
}

async function runApprovalAction(params: {
  action: string;
  id: string;
  run: (actor: StrictAuditActor) => Promise<KnowledgeApprovalMutationResult>;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(params.id);

  if (!id || !validateUuid(id)) {
    return getInvalidIdResult();
  }

  try {
    const actor = await requireStrictAuditActor();
    const result = await params.run(actor);

    revalidateKnowledgeApprovalPaths(result.productId);

    return {
      ok: true,
      message: result.message,
    };
  } catch (error) {
    return handleApprovalActionError({
      action: params.action,
      entityId: id,
      error,
    });
  }
}

export async function approveKnowledgeDocument(input: {
  id: string;
  approvalNote?: string | null;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const approvalNote = normalizeOptionalText(input.approvalNote);

  return runApprovalAction({
    action: "approve",
    id,
    run: (actor) =>
      approveKnowledgeDocumentInTransaction({ id, approvalNote }, actor),
  });
}

export async function rejectKnowledgeDocument(input: {
  id: string;
  rejectionReason: string;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const rejectionReason = normalizeOptionalText(input.rejectionReason);

  if (!rejectionReason) {
    return {
      ok: false,
      message: "Red nedeni zorunludur.",
    };
  }

  return runApprovalAction({
    action: "reject",
    id,
    run: (actor) =>
      rejectKnowledgeDocumentInTransaction({ id, rejectionReason }, actor),
  });
}

export async function revokeKnowledgeDocument(input: {
  id: string;
  revokedReason: string;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const revokedReason = normalizeOptionalText(input.revokedReason);

  if (!revokedReason) {
    return {
      ok: false,
      message: "Geri çekme nedeni zorunludur.",
    };
  }

  return runApprovalAction({
    action: "revoke",
    id,
    run: (actor) =>
      revokeKnowledgeDocumentInTransaction({ id, revokedReason }, actor),
  });
}

export async function resetKnowledgeReview(input: {
  id: string;
  reason?: string | null;
}): Promise<KnowledgeApprovalActionResult> {
  const id = normalizeId(input.id);
  const reason = normalizeOptionalText(input.reason);

  return runApprovalAction({
    action: "reset_review",
    id,
    run: (actor) => resetKnowledgeReviewInTransaction({ id, reason }, actor),
  });
}
