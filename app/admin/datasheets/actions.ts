"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db/db";
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

const allowedDocTypes = new Set(["datasheet", "manual", "rulebook"]);
const allowedParsingStatuses = new Set([
  "pending",
  "processing",
  "completed",
  "failed",
]);

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function hasDuplicateStorageKey(id: string, s3Key: string) {
  if (!db) {
    return false;
  }

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

export async function saveDatasheet(
  _prevState: DatasheetActionState,
  formData: FormData,
): Promise<DatasheetActionState> {
  if (!db) {
    return {
      status: "error",
      message: "Veritabanı yapılandırılmadığı için kayıt işlemi şu anda pasif durumda.",
      fieldErrors: {},
    };
  }

  const id = getTrimmed(formData, "id");
  const productId = getTrimmed(formData, "productId");
  const title = normalizeWhitespace(getTrimmed(formData, "title"));
  const docType = getTrimmed(formData, "docType");
  const parsingStatus = getTrimmed(formData, "parsingStatus");
  const s3Key = getTrimmed(formData, "s3Key");
  const previousRows = id
    ? await db
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
        .limit(1)
    : [];
  const previousDocument = previousRows[0] ?? null;

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

  const governanceBlockers = getDatasheetGuardrailBlockers({
    title,
    productId,
    docType,
    parsingStatus: parsingStatus as "pending" | "processing" | "completed" | "failed",
    previousParsingStatus:
      (previousDocument?.parsingStatus as
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | null
        | undefined) ?? null,
    s3Key,
  });

  if (governanceBlockers.length > 0) {
    fieldErrors.parsingStatus = governanceBlockers.join(" ");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Form alanlarını kontrol et.",
      fieldErrors,
    };
  }

  const now = new Date();

  try {
    if (id) {
      await db
        .update(aiKnowledgeDocuments)
        .set({
          productId: productId || null,
          title,
          docType: docType as "datasheet" | "manual" | "rulebook",
          parsingStatus: parsingStatus as
            | "pending"
            | "processing"
            | "completed"
            | "failed",
          s3Key,
          updatedAt: now,
        })
        .where(eq(aiKnowledgeDocuments.id, id));

      await writeAuditLog({
        entityType: "datasheet",
        entityId: id,
        action: "update",
        previousState: previousDocument,
        newState: {
          productId: productId || null,
          title,
          docType,
          parsingStatus,
          s3Key,
          updatedAt: now,
        },
      });
    } else {
      const insertedRows = await db
        .insert(aiKnowledgeDocuments)
        .values({
          productId: productId || null,
          title,
          docType: docType as "datasheet" | "manual" | "rulebook",
          parsingStatus: parsingStatus as
            | "pending"
            | "processing"
            | "completed"
            | "failed",
          s3Key,
          updatedAt: now,
        })
        .returning({
          id: aiKnowledgeDocuments.id,
        });

      const insertedId = insertedRows[0]?.id ?? "";

      if (insertedId) {
        await writeAuditLog({
          entityType: "datasheet",
          entityId: insertedId,
          action: "create",
          newState: {
            productId: productId || null,
            title,
            docType,
            parsingStatus,
            s3Key,
            updatedAt: now,
          },
        });
      }
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
  if (!id) {
    redirect("/admin/datasheets?docAction=error&docCode=invalid-id");
  }

  if (!db) {
    redirect("/admin/datasheets?docAction=error&docCode=db-offline");
  }

  try {
    const rows = await db
      .select({
        id: aiKnowledgeDocuments.id,
        productId: aiKnowledgeDocuments.productId,
        title: aiKnowledgeDocuments.title,
        docType: aiKnowledgeDocuments.docType,
        parsingStatus: aiKnowledgeDocuments.parsingStatus,
        s3Key: aiKnowledgeDocuments.s3Key,
      })
      .from(aiKnowledgeDocuments)
      .where(eq(aiKnowledgeDocuments.id, id))
      .limit(1);

    const existingDocument = rows[0] ?? null;

    await db.delete(aiKnowledgeDocuments).where(eq(aiKnowledgeDocuments.id, id));

    if (existingDocument) {
      await writeAuditLog({
        entityType: "datasheet",
        entityId: existingDocument.id,
        action: "delete",
        previousState: existingDocument,
      });
    }
  } catch (error) {
    console.error("Datasheet delete error:", error);
    redirect("/admin/datasheets?docAction=error&docCode=delete-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/datasheets");
  revalidatePath("/admin/ai-core");

  redirect("/admin/datasheets?docAction=deleted");
}
