"use server";

import { and, count, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { aiDocumentChunks, aiKnowledgeDocuments, products } from "@/db/schema";
import {
  hasBlockedScheme,
  isOpenableHttpUrl,
  normalizeWhitespace,
} from "./validation";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import {
  getAiKnowledgeReadiness,
  getDatasheetGuardrailBlockers,
} from "@/app/lib/admin/governance";

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

type DatasheetReadinessSnapshot = {
  chunkCount: number;
  approvedForAi: boolean;
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
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const GOVERNANCE_BLOCKER_GROUP_ORDER: GovernanceBlockerGroup[] = [
  "Veri eksikliği",
  "AI readiness problemi",
  "Güvenlik / integrity",
];

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function hasUrlScheme(value: string) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value.trim());
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getDatasheetFailureMessage(error: unknown, fallback: string) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Aynı benzersiz alanlara sahip bir datasheet kaydı zaten mevcut.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili kayıt doğrulanamadığı için datasheet işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Kayıt kimliği UUID formatında olmadığı için datasheet işlemi durduruldu.";
  }

  if (message.includes("violates not-null constraint")) {
    return "Zorunlu bir veritabanı alanı boş kaldığı için datasheet işlemi tamamlanamadı.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazımı tamamlanamadığı için datasheet işlemi durduruldu.";
  }

  return fallback;
}

function logDatasheetActionError(action: string, id: string | null, error: unknown) {
  console.error(`Datasheet ${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function getDatasheetDeleteFailureCode(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("invalid input syntax for type uuid")) {
    return "invalid-id";
  }

  if (
    message.includes("violates foreign key constraint") ||
    message.includes("still referenced") ||
    message.includes("restrict")
  ) {
    return "relation-blocked";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return "delete-failed";
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

function revalidateDatasheetLifecyclePaths(productIds: Array<string | null | undefined>) {
  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");
  revalidatePath("/admin/products");

  const uniqueProductIds = Array.from(
    new Set(
      productIds
        .map((value) => String(value ?? "").trim())
        .filter(Boolean),
    ),
  );

  for (const productId of uniqueProductIds) {
    revalidatePath(`/admin/products/${productId}/documents`);
  }
}

async function getDatasheetReadinessSnapshot(
  record: DatasheetRecord,
): Promise<DatasheetReadinessSnapshot> {
  const db = getDbOrThrow();

  const [chunkRows, productRows] = await Promise.all([
    db
      .select({ chunkCount: count() })
      .from(aiDocumentChunks)
      .where(eq(aiDocumentChunks.documentId, record.id)),
    record.docType !== "rulebook" && record.productId
      ? db
          .select({ id: products.id })
          .from(products)
          .where(eq(products.id, record.productId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  const chunkCount = Number(chunkRows[0]?.chunkCount ?? 0);
  const resolvedProductId =
    record.docType === "rulebook"
      ? record.productId
      : productRows[0]?.id ?? null;
  const readiness = getAiKnowledgeReadiness({
    docType: record.docType,
    productId: resolvedProductId,
    parsingStatus: record.parsingStatus,
    title: record.title,
    s3Key: record.s3Key,
    chunkCount,
  });

  return {
    chunkCount,
    approvedForAi: readiness.approvedForAi,
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
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "datasheet",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
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
  const nextParsingStatus = parsingStatus as DatasheetParsingStatus;

  const fieldErrors: DatasheetActionState["fieldErrors"] = {};

  if (id && !isUuid(id)) {
    return {
      status: "error",
      message: "Datasheet kimliği UUID formatında olmalıdır.",
      fieldErrors: {},
    };
  }

  if (productId && !isUuid(productId)) {
    return {
      status: "error",
      message: "Ürün kimliği UUID formatında olmalıdır.",
      fieldErrors: {},
    };
  }

  const previousDocument = id ? await getDatasheetById(id) : null;

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
  } else if (hasUrlScheme(s3Key) && !isOpenableHttpUrl(s3Key)) {
    fieldErrors.s3Key = "Belge bağlantısı http veya https URL formatında olmalı.";
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
    const previousReadiness =
      previousDocument?.parsingStatus === "completed"
        ? await getDatasheetReadinessSnapshot(previousDocument)
        : null;

    if (
      previousDocument?.parsingStatus === "completed" &&
      nextParsingStatus !== "completed" &&
      previousReadiness?.approvedForAi
    ) {
      return {
        status: "error",
        message: buildCompletedDowngradeMessage(),
        fieldErrors: {},
      };
    }

    const auditActor = await requireStrictAuditActor();

    if (id && previousDocument) {
      let updatedDocument: DatasheetRecord | null = null;

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

      updatedDocument = (updatedRows[0] as DatasheetRecord | undefined) ?? null;

      if (!updatedDocument) {
        return {
          status: "error",
          message: "Datasheet güncellenemedi.",
          fieldErrors: {},
        };
      }

      try {
        await writeDatasheetAudit({
          database: db,
          actor: auditActor,
          entityId: updatedDocument.id,
          action: "update",
          previousState: buildDatasheetState(previousDocument),
          newState: buildDatasheetState(updatedDocument),
        });
      } catch (error) {
        logDatasheetActionError("saveDatasheet audit update", id, error);

        return {
          status: "error",
          message:
            "Datasheet güncellendi ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
          fieldErrors: {},
        };
      }
    } else {
      let insertedDocument: DatasheetRecord | null = null;

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

      insertedDocument = (insertedRows[0] as DatasheetRecord | undefined) ?? null;

      if (!insertedDocument) {
        return {
          status: "error",
          message: "Datasheet oluşturulamadı.",
          fieldErrors: {},
        };
      }

      try {
        await writeDatasheetAudit({
          database: db,
          actor: auditActor,
          entityId: insertedDocument.id,
          action: "create",
          newState: buildDatasheetState(insertedDocument),
        });
      } catch (error) {
        logDatasheetActionError("saveDatasheet audit create", null, error);

        return {
          status: "error",
          message:
            "Datasheet oluşturuldu ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
          fieldErrors: {},
        };
      }
    }
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      return {
        status: "error",
        message:
          "Session-bound audit actor çözülemediği için datasheet işlemi güvenli şekilde tamamlanamadı.",
        fieldErrors: {},
      };
    }

    logDatasheetActionError("saveDatasheet", id || null, error);

    return {
      status: "error",
      message: getDatasheetFailureMessage(
        error,
        "Datasheet kaydı sırasında beklenmeyen bir hata oluştu.",
      ),
      fieldErrors: {},
    };
  }

  revalidateDatasheetLifecyclePaths([
    previousDocument?.productId ?? null,
    productId || null,
  ]);

  redirect(
    id
      ? "/admin/datasheets?saved=1&updated=1"
      : "/admin/datasheets?saved=1&created=1",
  );
}

export async function deleteDatasheet(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId || !isUuid(normalizedId)) {
    redirect("/admin/datasheets?docAction=error&docCode=invalid-id");
  }

  let existingDocument: DatasheetRecord | null = null;

  try {
    existingDocument = await getDatasheetById(normalizedId);

    if (!existingDocument) {
      revalidateDatasheetLifecyclePaths([]);
      redirect("/admin/datasheets?docAction=deleted");
    }

    const activeExistingDocument = existingDocument;

    const readiness =
      activeExistingDocument.parsingStatus === "completed"
        ? await getDatasheetReadinessSnapshot(activeExistingDocument)
        : null;

    if (readiness?.approvedForAi) {
      redirect(buildCompletedDeleteGuardRedirect());
    }

    const auditActor = await requireStrictAuditActor();
    let deletedCount = 0;

    const deletedRows = await db
      .delete(aiKnowledgeDocuments)
      .where(eq(aiKnowledgeDocuments.id, normalizedId))
      .returning({
        id: aiKnowledgeDocuments.id,
      });

    deletedCount = deletedRows.length;

    if (deletedCount === 0) {
      redirect("/admin/datasheets?docAction=error&docCode=delete-failed");
    }

    try {
      await writeDatasheetAudit({
        database: db,
        actor: auditActor,
        entityId: activeExistingDocument.id,
        action: "delete",
        previousState: buildDatasheetState(activeExistingDocument),
      });
    } catch (error) {
      logDatasheetActionError("deleteDatasheet audit", normalizedId, error);
      redirect("/admin/datasheets?docAction=error&docCode=audit-write-failed");
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect("/admin/datasheets?docAction=error&docCode=audit-actor-required");
    }

    logDatasheetActionError("deleteDatasheet", normalizedId, error);
    redirect(
      `/admin/datasheets?docAction=error&docCode=${getDatasheetDeleteFailureCode(error)}`,
    );
  }

  revalidateDatasheetLifecyclePaths([existingDocument?.productId ?? null]);

  redirect("/admin/datasheets?docAction=deleted");
}
