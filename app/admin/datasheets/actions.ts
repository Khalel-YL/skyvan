"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { aiKnowledgeDocuments } from "@/db/schema";
import {
  hasBlockedScheme,
  normalizeWhitespace,
} from "./validation";
import { writeAuditLog } from "@/app/lib/admin/audit";
import { getDatasheetGuardrailBlockers } from "@/app/lib/admin/governance";

type FieldName = "title" | "docType" | "parsingStatus" | "s3Key";

type DatasheetActionState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<FieldName, string>>;
};

type DatasheetParsingStatus = "pending" | "processing" | "completed" | "failed";
type DatasheetDocType = "datasheet" | "manual" | "rulebook";

type DatasheetRecord = {
  id: string;
  productId: string | null;
  title: string;
  docType: DatasheetDocType;
  parsingStatus: DatasheetParsingStatus;
  s3Key: string;
  updatedAt: Date | string;
};

type GovernanceBlockerSeverity = "error" | "warning";
type GovernanceBlockerGroup =
  | "Veri eksikliği"
  | "AI readiness problemi"
  | "Güvenlik / integrity";

type ExplainableGovernanceBlocker = {
  code: string;
  message: string;
  severity: GovernanceBlockerSeverity;
  group: GovernanceBlockerGroup;
};

const allowedDocTypes = new Set(["datasheet", "manual", "rulebook"]);
const allowedParsingStatuses = new Set([
  "pending",
  "processing",
  "completed",
  "failed",
]);

const GOVERNANCE_BLOCKER_GROUP_ORDER: GovernanceBlockerGroup[] = [
  "Veri eksikliği",
  "AI readiness problemi",
  "Güvenlik / integrity",
];

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function mapGovernanceBlocker(blocker: string): ExplainableGovernanceBlocker {
  const normalized = blocker.trim();
  const lowered = normalized.toLowerCase();

  if (
    lowered.includes("productid missing") ||
    lowered.includes("ürüne bağlanmalıdır") ||
    lowered.includes("ürün bağı")
  ) {
    return {
      code: "missing_product",
      message: "ürün bağı eksik",
      severity: "error",
      group: "Veri eksikliği",
    };
  }

  if (
    lowered.includes("chunk count is zero") ||
    lowered.includes("chunk üretimi yok") ||
    lowered.includes("chunk üretmemiş")
  ) {
    return {
      code: "no_chunks",
      message: "chunk üretimi yok",
      severity: "error",
      group: "AI readiness problemi",
    };
  }

  if (
    lowered.includes("parsing not completed") ||
    lowered.includes("parsing completed değil") ||
    lowered.includes("henüz completed")
  ) {
    return {
      code: "not_completed",
      message: "parsing completed değil",
      severity: "error",
      group: "AI readiness problemi",
    };
  }

  if (lowered.includes("storage anahtarı")) {
    return {
      code: "missing_storage",
      message: "storage anahtarı eksik",
      severity: "error",
      group: "Veri eksikliği",
    };
  }

  if (lowered.includes("başlık")) {
    return {
      code: "missing_title",
      message: "başlık eksik",
      severity: "error",
      group: "Veri eksikliği",
    };
  }

  if (
    lowered.includes("governance kilidi") ||
    lowered.includes("completed state sınırına dokunan") ||
    lowered.includes("doğrudan completed")
  ) {
    return {
      code: "completed_boundary_protected",
      message: "completed sınırı governance korumasında",
      severity: "error",
      group: "Güvenlik / integrity",
    };
  }

  return {
    code: "governance_blocker",
    message: normalized,
    severity: "error",
    group: "Güvenlik / integrity",
  };
}

function buildExplainableGovernanceMessage(rawBlockers: string[]) {
  const blockerMap = new Map<string, ExplainableGovernanceBlocker>();

  for (const blocker of rawBlockers) {
    const structured = mapGovernanceBlocker(blocker);
    const key = `${structured.code}:${structured.message}`;

    if (!blockerMap.has(key)) {
      blockerMap.set(key, structured);
    }
  }

  const blockers = Array.from(blockerMap.values());
  const lines = ["AI-ready yapılamadı:", ""];

  for (const group of GOVERNANCE_BLOCKER_GROUP_ORDER) {
    const groupedBlockers = blockers.filter((blocker) => blocker.group === group);

    if (groupedBlockers.length === 0) {
      continue;
    }

    lines.push(`${group}:`);

    for (const blocker of groupedBlockers) {
      lines.push(`- ${blocker.message}`);
    }

    lines.push("");
  }

  return {
    blockers,
    message: lines.join("\n").trim(),
  };
}

function buildCompletedDowngradeMessage() {
  return [
    "Bu kayıt AI-ready (completed) durumunda olduğu için geri alınamaz.",
    "",
    "Neden:",
    "- AI pipeline bu kaydı aktif kullanıyor",
    "- veri bütünlüğü korunmalı",
  ].join("\n");
}

function buildCompletedDeleteGuardRedirect() {
  const search = new URLSearchParams({
    docAction: "error",
    docCode: "completed-protected",
    docMessage: [
      "Bu kayıt silinemez çünkü AI-ready durumunda.",
      "",
      "AI sistemi bu veriyi aktif kullanıyor.",
      "Silme işlemi veri tutarlılığını bozabilir.",
    ].join("\n"),
  });

  return `/admin/datasheets?${search.toString()}`;
}

function buildDatasheetState(input: {
  id?: string;
  productId: string | null;
  title: string;
  docType: DatasheetDocType;
  parsingStatus: DatasheetParsingStatus;
  s3Key: string;
  updatedAt: Date | string;
}) {
  return {
    ...(input.id ? { id: input.id } : {}),
    productId: input.productId,
    title: input.title,
    docType: input.docType,
    parsingStatus: input.parsingStatus,
    s3Key: input.s3Key,
    updatedAt: input.updatedAt,
  };
}

async function getDatasheetById(id: string): Promise<DatasheetRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: aiKnowledgeDocuments.id,
      productId: aiKnowledgeDocuments.productId,
      title: aiKnowledgeDocuments.title,
      docType: aiKnowledgeDocuments.docType,
      parsingStatus: aiKnowledgeDocuments.parsingStatus,
      s3Key: aiKnowledgeDocuments.s3Key,
      updatedAt: aiKnowledgeDocuments.updatedAt,
    })
    .from(aiKnowledgeDocuments)
    .where(eq(aiKnowledgeDocuments.id, id))
    .limit(1);

  return (rows[0] as DatasheetRecord | undefined) ?? null;
}

async function hasDuplicateStorageKey(id: string, s3Key: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({ id: aiKnowledgeDocuments.id })
    .from(aiKnowledgeDocuments)
    .where(
      id
        ? and(eq(aiKnowledgeDocuments.s3Key, s3Key), ne(aiKnowledgeDocuments.id, id))
        : eq(aiKnowledgeDocuments.s3Key, s3Key),
    )
    .limit(1);

  return rows.length > 0;
}

async function writeDatasheetAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: "datasheet",
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("datasheet audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("datasheet audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

export async function saveDatasheet(
  _prevState: DatasheetActionState,
  formData: FormData,
): Promise<DatasheetActionState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const productId = getTrimmed(formData, "productId");
  const title = normalizeWhitespace(getTrimmed(formData, "title"));
  const docType = getTrimmed(formData, "docType");
  const parsingStatus = getTrimmed(formData, "parsingStatus");
  const s3Key = getTrimmed(formData, "s3Key");
  const previousDocument = id ? await getDatasheetById(id) : null;
  const nextParsingStatus = parsingStatus as DatasheetParsingStatus;

  const fieldErrors: DatasheetActionState["fieldErrors"] = {};

  if (id && !previousDocument) {
    return {
      status: "error",
      message: "Güncellenecek datasheet kaydı bulunamadı.",
      fieldErrors: {},
    };
  }

  if (!title) {
    fieldErrors.title = "Doküman başlığı zorunlu.";
  } else if (title.length < 3) {
    fieldErrors.title = "Doküman başlığı en az 3 karakter olmalı.";
  }

  if (!allowedDocTypes.has(docType)) {
    fieldErrors.docType = "Geçersiz doküman tipi seçildi.";
  }

  if (!allowedParsingStatuses.has(parsingStatus)) {
    fieldErrors.parsingStatus = "Geçersiz analiz durumu seçildi.";
  }

  if (!s3Key) {
    fieldErrors.s3Key = "Belge bağlantısı / storage anahtarı zorunlu.";
  } else if (s3Key.length < 3) {
    fieldErrors.s3Key = "Belge bağlantısı / storage anahtarı çok kısa.";
  } else if (hasBlockedScheme(s3Key)) {
    fieldErrors.s3Key = "Bu bağlantı şeması güvenlik nedeniyle kabul edilmiyor.";
  } else if (await hasDuplicateStorageKey(id, s3Key)) {
    fieldErrors.s3Key =
      "Aynı belge bağlantısı / storage anahtarı ile kayıt zaten mevcut.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Form alanlarını kontrol et.",
      fieldErrors,
    };
  }

  if (
    previousDocument?.parsingStatus === "completed" &&
    nextParsingStatus !== "completed"
  ) {
    return {
      status: "error",
      message: buildCompletedDowngradeMessage(),
      fieldErrors: {},
    };
  }

  const governanceBlockers = getDatasheetGuardrailBlockers({
    title,
    productId,
    docType,
    parsingStatus: nextParsingStatus,
    previousParsingStatus: previousDocument?.parsingStatus ?? null,
    s3Key,
  });

  if (governanceBlockers.length > 0) {
    const explainableBlockers = buildExplainableGovernanceMessage(
      governanceBlockers,
    );

    return {
      status: "error",
      message: explainableBlockers.message,
      fieldErrors: {},
    };
  }

  const now = new Date();

  try {
    if (id && previousDocument) {
      const updatedRows = await db
        .update(aiKnowledgeDocuments)
        .set({
          productId: productId || null,
          title,
          docType: docType as DatasheetDocType,
          parsingStatus: nextParsingStatus,
          s3Key,
          updatedAt: now,
        })
        .where(eq(aiKnowledgeDocuments.id, id))
        .returning({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          s3Key: aiKnowledgeDocuments.s3Key,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        });

      const updatedDocument = (updatedRows[0] as DatasheetRecord | undefined) ?? null;

      if (!updatedDocument) {
        return {
          status: "error",
          message: "Datasheet güncellenemedi.",
          fieldErrors: {},
        };
      }

      await writeDatasheetAudit({
        entityId: updatedDocument.id,
        action: "update",
        previousState: buildDatasheetState(previousDocument),
        newState: buildDatasheetState(updatedDocument),
      });
    } else {
      const insertedRows = await db
        .insert(aiKnowledgeDocuments)
        .values({
          productId: productId || null,
          title,
          docType: docType as DatasheetDocType,
          parsingStatus: nextParsingStatus,
          s3Key,
          updatedAt: now,
        })
        .returning({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
          title: aiKnowledgeDocuments.title,
          docType: aiKnowledgeDocuments.docType,
          parsingStatus: aiKnowledgeDocuments.parsingStatus,
          s3Key: aiKnowledgeDocuments.s3Key,
          updatedAt: aiKnowledgeDocuments.updatedAt,
        });

      const insertedDocument = (insertedRows[0] as DatasheetRecord | undefined) ?? null;

      if (!insertedDocument) {
        return {
          status: "error",
          message: "Datasheet oluşturulamadı.",
          fieldErrors: {},
        };
      }

      await writeDatasheetAudit({
        entityId: insertedDocument.id,
        action: "create",
        newState: buildDatasheetState(insertedDocument),
      });
    }
  } catch (error) {
    console.error("Datasheet save error:", error);

    return {
      status: "error",
      message: "Datasheet kaydı sırasında beklenmeyen bir hata oluştu.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");

  redirect(
    id
      ? "/admin/datasheets?saved=1&updated=1"
      : "/admin/datasheets?saved=1&created=1",
  );
}

export async function deleteDatasheet(id: string) {
  const db = getDbOrThrow();

  if (!id) {
    redirect("/admin/datasheets?docAction=error&docCode=invalid-id");
  }

  const normalizedId = String(id ?? "").trim();

  try {
    const existingDocument = await getDatasheetById(normalizedId);

    if (!existingDocument) {
      revalidatePath("/admin");
      revalidatePath("/admin/datasheets");
      revalidatePath("/admin/ai-core");
      redirect("/admin/datasheets?docAction=deleted");
    }

    if (existingDocument.parsingStatus === "completed") {
      redirect(buildCompletedDeleteGuardRedirect());
    }

    const deletedRows = await db
      .delete(aiKnowledgeDocuments)
      .where(eq(aiKnowledgeDocuments.id, normalizedId))
      .returning({
        id: aiKnowledgeDocuments.id,
      });

    if (deletedRows.length === 0) {
      redirect("/admin/datasheets?docAction=error&docCode=delete-failed");
    }

    await writeDatasheetAudit({
      entityId: existingDocument.id,
      action: "delete",
      previousState: buildDatasheetState(existingDocument),
    });
  } catch (error) {
    console.error("Datasheet delete error:", error);
    redirect("/admin/datasheets?docAction=error&docCode=delete-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");

  redirect("/admin/datasheets?docAction=deleted");
}
