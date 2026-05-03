"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { getMediaGuardrailBlockers } from "@/app/lib/admin/governance";
import {
  type MediaContentJson,
  type MediaType,
  type MediaUsageScope,
  detectDirectVideoUrl,
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isSafeHttpUrl,
  normalizeTags,
} from "./media-types";

type MediaRecord = {
  id: string;
  entityType: string;
  locale: string;
  title: string | null;
  contentJson: unknown;
};

const MEDIA_ENTITY_TYPE = "media";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEDIA_TYPES = new Set<MediaType>(["image", "video", "model3d"]);
const USAGE_SCOPES = new Set<MediaUsageScope>([
  "public",
  "admin",
  "workshop",
  "product",
  "general",
]);

function isMediaEntityRecord(
  value: MediaRecord | null,
): value is MediaRecord & { entityType: typeof MEDIA_ENTITY_TYPE } {
  return Boolean(value && value.entityType === MEDIA_ENTITY_TYPE);
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function parseSafeHttpUrl(value: string) {
  if (!isSafeHttpUrl(value)) {
    return null;
  }

  return new URL(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getMediaFailureMessage(error: unknown, fallback: string) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("database_url")) {
    return "Veritabanı bağlantısı yapılandırılamadığı için medya işlemi tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "Audit kullanıcısı doğrulanamadığı için medya işlemi güvenli şekilde tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Medya kimliği UUID formatında olmadığı için işlem durduruldu.";
  }

  if (message.includes("violates not-null constraint")) {
    return "Zorunlu bir medya alanı boş kaldığı için işlem tamamlanamadı.";
  }

  if (message.includes("fetch failed")) {
    return "Veritabanı bağlantısına ulaşılamadığı için medya işlemi tamamlanamadı.";
  }

  return fallback;
}

function getUrlHost(value: string) {
  return parseSafeHttpUrl(value)?.host || null;
}

function redirectMediaError(message: string): never {
  redirect(
    buildMediaRedirectUrl({
      mediaAction: "error",
      mediaMessage: message,
    }),
  );
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeMediaType(value: string): MediaType {
  const normalized = value.toLowerCase().trim();
  return MEDIA_TYPES.has(normalized as MediaType) ? (normalized as MediaType) : "image";
}

function normalizeUsageScope(value: string): MediaUsageScope {
  const normalized = value.toLowerCase().trim();
  return USAGE_SCOPES.has(normalized as MediaUsageScope)
    ? (normalized as MediaUsageScope)
    : "general";
}

function addOptionalUrlBlocker(params: {
  value: string;
  label: string;
  blockers: string[];
}) {
  if (params.value && !isSafeHttpUrl(params.value)) {
    params.blockers.push(`${params.label} yalnızca http veya https formatında olmalı.`);
  }
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
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: MEDIA_ENTITY_TYPE,
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

export async function saveMedia(formData: FormData) {
  const mediaType = normalizeMediaType(getTrimmed(formData, "mediaType"));
  const title = getTrimmed(formData, "title") || getTrimmed(formData, "fileName");
  const url = getTrimmed(formData, "url") || getTrimmed(formData, "imageUrl");
  const modelUrl = getTrimmed(formData, "modelUrl");
  const thumbnailUrl = getTrimmed(formData, "thumbnailUrl");
  const posterUrl = getTrimmed(formData, "posterUrl");
  const description = getTrimmed(formData, "description");
  const altText = getTrimmed(formData, "altText");
  const tags = normalizeTags(getTrimmed(formData, "tags") || getTrimmed(formData, "aiTags"));
  const usageScope = normalizeUsageScope(getTrimmed(formData, "usageScope"));
  const isFeatured = formData.get("isFeatured") === "true";
  const primaryUrl = mediaType === "model3d" ? modelUrl : url;
  const safeUrl = parseSafeHttpUrl(primaryUrl);
  const youtubeVideoId = mediaType === "video" ? extractYouTubeVideoId(url) : null;
  const videoProvider =
    mediaType === "video"
      ? youtubeVideoId
        ? "youtube"
        : detectDirectVideoUrl(url)
          ? "direct"
          : "external"
      : undefined;
  const youtubePosterUrl = youtubeVideoId ? getYouTubeThumbnailUrl(youtubeVideoId) : "";
  const effectivePosterUrl = posterUrl || youtubePosterUrl;

  const blockers = getMediaGuardrailBlockers({
    imageUrl: primaryUrl,
    fileName: title,
    tags,
  });

  if (!safeUrl) {
    blockers.push("Ana medya URL yalnızca http veya https formatında olmalı.");
  }

  if (!title) {
    blockers.push("Başlık boş bırakılamaz.");
  }

  if (tags.length === 0) {
    blockers.push("En az bir medya etiketi girilmeli.");
  }

  if (mediaType === "image" && !url) {
    blockers.push("Görsel medya için görsel URL zorunludur.");
  }

  if (mediaType === "image" && !altText) {
    blockers.push("Görsel medya için alt text zorunludur.");
  }

  if (mediaType === "video" && !url) {
    blockers.push("Video medya için video URL zorunludur.");
  }

  if (mediaType === "model3d" && !modelUrl) {
    blockers.push("3D medya için model URL zorunludur.");
  }

  if (mediaType === "model3d" && !thumbnailUrl) {
    blockers.push("3D medya için önizleme görseli URL zorunludur.");
  }

  addOptionalUrlBlocker({ value: thumbnailUrl, label: "Thumbnail URL", blockers });
  addOptionalUrlBlocker({ value: posterUrl, label: "Poster URL", blockers });

  if (blockers.length > 0) {
    redirectMediaError(Array.from(new Set(blockers)).join(" "));
  }

  const contentJson: MediaContentJson = {
    mediaType,
    url: mediaType === "model3d" ? modelUrl : url,
    thumbnailUrl: thumbnailUrl || effectivePosterUrl || undefined,
    posterUrl: effectivePosterUrl || undefined,
    modelUrl: mediaType === "model3d" ? modelUrl : undefined,
    title,
    description: description || undefined,
    altText: altText || undefined,
    tags,
    isFeatured,
    usageScope,
    provider: videoProvider,
    embedUrl:
      mediaType === "video" && youtubeVideoId
        ? getYouTubeEmbedUrl(youtubeVideoId)
        : undefined,
    uploadDate: new Date().toISOString(),
  };

  try {
    const db = getDbOrThrow();
    const auditActor = await requireStrictAuditActor();
    const insertedRows = await db
      .insert(localizedContent)
      .values({
        id: uuidv4(),
        entityId: uuidv4(),
        entityType: MEDIA_ENTITY_TYPE,
        locale: "tr",
        title,
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

    if (!isMediaEntityRecord(insertedMedia)) {
      redirectMediaError("Medya kaydı güvenli şekilde oluşturulamadı.");
    }

    await writeMediaAudit({
      database: db,
      actor: auditActor,
      entityId: insertedMedia.id,
      action: "create",
      newState: insertedMedia,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildMediaRedirectUrl({
          mediaAction: "error",
          mediaMessage:
            "Session-bound audit actor çözülemediği için medya kaydı güvenli şekilde tamamlanamadı.",
        }),
      );
    }

    console.error("saveMedia error:", {
      action: "saveMedia",
      urlHost: getUrlHost(primaryUrl),
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: getMediaFailureMessage(
          error,
          "Medya kaydı sırasında beklenmeyen bir hata oluştu.",
        ),
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
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId || !isUuid(normalizedId)) {
    redirectMediaError("Silinecek medya kimliği geçerli UUID formatında değil.");
  }

  try {
    const db = getDbOrThrow();
    const existingMedia = await getMediaById(normalizedId);

    if (!existingMedia) {
      redirectMediaError("Silinecek medya kaydı bulunamadı.");
    }

    if (!isMediaEntityRecord(existingMedia)) {
      redirectMediaError("Silinecek kayıt media entity türünde değil.");
    }

    const auditActor = await requireStrictAuditActor();
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
      redirectMediaError("Medya kaydı işlem sırasında silinemedi.");
    }

    await writeMediaAudit({
      database: db,
      actor: auditActor,
      entityId: existingMedia.id,
      action: "delete",
      previousState: existingMedia,
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildMediaRedirectUrl({
          mediaAction: "error",
          mediaMessage:
            "Session-bound audit actor çözülemediği için medya kaydı güvenli şekilde silinemedi.",
        }),
      );
    }

    console.error("deleteMedia error:", {
      action: "deleteMedia",
      mediaId: normalizedId,
      errorName: getSafeErrorName(error),
      errorMessage: getSafeErrorMessage(error),
    });

    redirect(
      buildMediaRedirectUrl({
        mediaAction: "error",
        mediaMessage: getMediaFailureMessage(
          error,
          "Medya kaydı silinirken beklenmeyen bir hata oluştu.",
        ),
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
