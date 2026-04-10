"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";
import { getMediaGuardrailBlockers } from "@/app/lib/admin/governance";

type MediaContentJson = {
  url: string;
  tags: string[];
  uploadDate: string;
};

type MediaRecord = {
  id: string;
  entityType: string;
  locale: string;
  title: string | null;
  contentJson: unknown;
};

const MEDIA_ENTITY_TYPE = "media";

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

function buildMediaRedirectUrl(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/media?${query}` : "/admin/media";
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

async function getMediaById(id: string): Promise<MediaRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: localizedContent.id,
      entityType: localizedContent.entityType,
      locale: localizedContent.locale,
      title: localizedContent.title,
      contentJson: localizedContent.contentJson,
    })
    .from(localizedContent)
    .where(eq(localizedContent.id, id))
    .limit(1);

  return (rows[0] as MediaRecord | undefined) ?? null;
}

async function writeMediaAudit(input: {
  entityId: string;
  action: "create" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: MEDIA_ENTITY_TYPE,
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("media audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("media audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

export async function saveMedia(formData: FormData) {
  const db = getDbOrThrow();

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
    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: blockers.join(" "),
      }),
    );
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
        entityType: MEDIA_ENTITY_TYPE,
        locale: "tr",
        title: fileName,
        contentJson,
      })
      .returning({
        id: localizedContent.id,
        entityType: localizedContent.entityType,
        locale: localizedContent.locale,
        title: localizedContent.title,
        contentJson: localizedContent.contentJson,
      });

    const insertedMedia = (insertedRows[0] as MediaRecord | undefined) ?? null;

    if (!insertedMedia || insertedMedia.entityType !== MEDIA_ENTITY_TYPE) {
      redirect(
        buildMediaRedirectUrl({
          mediaAction: "error",
          mediaMessage: "Medya kaydı güvenli şekilde oluşturulamadı.",
        }),
      );
    }

    await writeMediaAudit({
      entityId: insertedMedia.id,
      action: "create",
      newState: insertedMedia,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("saveMedia error:", error);

    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: "Medya kaydı sırasında beklenmeyen bir hata oluştu.",
      }),
    );
  }

  revalidatePath("/admin/media");
  redirect(
    buildMediaRedirectUrl({
      mediaAction: "saved",
    }),
  );
}

export async function deleteMedia(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: "Silinecek medya kimliği bulunamadı.",
      }),
    );
  }

  const existingMedia = await getMediaById(normalizedId);

  if (!existingMedia) {
    redirect(
      buildMediaRedirectUrl({
        mediaAction: "deleted",
      }),
    );
  }

  if (existingMedia.entityType !== MEDIA_ENTITY_TYPE) {
    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: "Silinecek kayıt media entity türünde değil.",
      }),
    );
  }

  try {
    const deletedRows = await db
      .delete(localizedContent)
      .where(
        and(
          eq(localizedContent.id, normalizedId),
          eq(localizedContent.entityType, MEDIA_ENTITY_TYPE),
        ),
      )
      .returning({
        id: localizedContent.id,
      });

    if (deletedRows.length === 0) {
      redirect(
        buildMediaRedirectUrl({
          mediaAction: "error",
          mediaMessage: "Medya kaydı işlem sırasında silinemedi.",
        }),
      );
    }

    await writeMediaAudit({
      entityId: existingMedia.id,
      action: "delete",
      previousState: existingMedia,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("deleteMedia error:", error);

    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: "Medya kaydı silinirken beklenmeyen bir hata oluştu.",
      }),
    );
  }

  revalidatePath("/admin/media");
  redirect(
    buildMediaRedirectUrl({
      mediaAction: "deleted",
    }),
  );
}
