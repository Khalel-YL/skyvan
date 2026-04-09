"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";
import { getMediaGuardrailBlockers } from "@/app/lib/admin/governance";

type MediaContentJson = {
  url: string;
  tags: string[];
  uploadDate: string;
};

function normalizeTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export async function saveMedia(formData: FormData) {
  if (!db) {
    throw new Error("Veritabanı yapılandırılmadığı için medya kaydı pasif.");
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const fileName = String(formData.get("fileName") ?? "").trim();
  const aiTags = String(formData.get("aiTags") ?? "").trim();
  const tags = normalizeTags(aiTags);

  const blockers = getMediaGuardrailBlockers({
    imageUrl,
    fileName,
    tags,
  });

  if (blockers.length > 0) {
    throw new Error(blockers.join(" "));
  }

  const contentJson: MediaContentJson = {
    url: imageUrl,
    tags,
    uploadDate: new Date().toISOString(),
  };

  try {
    const insertedRows = await db
      .insert(localizedContent)
      .values({
        id: uuidv4(),
        entityId: uuidv4(),
        entityType: "media",
        locale: "tr",
        title: fileName,
        contentJson,
      })
      .returning({
        id: localizedContent.id,
      });

    const insertedId = insertedRows[0]?.id ?? "";

    if (insertedId) {
      await writeAuditLog({
        entityType: "media",
        entityId: insertedId,
        action: "create",
        newState: {
          title: fileName,
          contentJson,
        },
      });
    }

    revalidatePath("/admin/media");
  } catch (error) {
    console.error("Medya kayıt hatası:", error);
    throw new Error("Görsel mühürlenemedi.");
  }
}

export async function deleteMedia(id: string) {
  if (!db) {
    throw new Error("Veritabanı yapılandırılmadığı için medya silme pasif.");
  }

  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    throw new Error("Silinecek medya kimliği bulunamadı.");
  }

  try {
    const rows = await db
      .select({
        id: localizedContent.id,
        title: localizedContent.title,
        contentJson: localizedContent.contentJson,
      })
      .from(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, "media"),
          eq(localizedContent.id, normalizedId),
        ),
      )
      .limit(1);

    const existingMedia = rows[0] ?? null;

    if (!existingMedia) {
      throw new Error("Silinecek medya kaydı bulunamadı.");
    }

    await db
      .delete(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, "media"),
          eq(localizedContent.id, normalizedId),
        ),
      );

    await writeAuditLog({
      entityType: "media",
      entityId: existingMedia.id,
      action: "delete",
      previousState: existingMedia,
    });

    revalidatePath("/admin/media");
  } catch (error) {
    console.error("Medya silme hatası:", error);
    throw new Error("Görsel silinemedi.");
  }
}
