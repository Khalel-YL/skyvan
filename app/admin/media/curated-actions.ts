"use server";

import { and, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { runDatabaseTransaction } from "@/db/db";
import { localizedContent } from "@/db/schema";
import {
  AuditActorBindingError,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import { skyvanMediaCatalog } from "@/app/lib/skyvan-media-catalog";
import type { MediaContentJson } from "./media-types";

const MEDIA_ENTITY_TYPE = "media";

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

function getSiteOrigin() {
  const configured = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();

  try {
    const url = new URL(configured || "https://skyvan.com.tr");
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fall through to the canonical production origin below.
  }

  return "https://skyvan.com.tr";
}

function redirectMediaError(message: string): never {
  redirect(
    buildMediaRedirectUrl({
      mediaAction: "error",
      mediaMessage: message,
    }),
  );
}

/**
 * Creates DB metadata pointers for the versioned visual files already tracked
 * in Git. Existing IDs are left untouched so a manual metadata edit is never
 * overwritten by a repeat sync.
 */
export async function syncCuratedSkyvanMedia() {
  try {
    const auditActor = await requireStrictAuditActor();
    const catalogEntries = Object.entries(skyvanMediaCatalog);
    const mediaIds = catalogEntries.map(([, item]) => item.mediaId);
    const entityIds = catalogEntries.map(([, item]) => item.entityId);
    const siteOrigin = getSiteOrigin();
    const syncedAt = new Date().toISOString();

    const insertedCount = await runDatabaseTransaction(async (transaction) => {
      const existingRows = await transaction
        .select({
          id: localizedContent.id,
          entityId: localizedContent.entityId,
        })
        .from(localizedContent)
        .where(
          and(
            eq(localizedContent.entityType, MEDIA_ENTITY_TYPE),
            eq(localizedContent.locale, "tr"),
            or(inArray(localizedContent.id, mediaIds), inArray(localizedContent.entityId, entityIds)),
          ),
        );
      const existingIds = new Set(existingRows.map((row) => row.id));
      const existingEntityIds = new Set(existingRows.map((row) => row.entityId));
      let inserted = 0;

      for (const [catalogKey, item] of catalogEntries) {
        if (existingIds.has(item.mediaId) || existingEntityIds.has(item.entityId)) {
          continue;
        }

        const url = `${siteOrigin}${item.path}`;
        const contentJson: MediaContentJson = {
          mediaType: "image",
          url,
          title: item.title,
          description: item.description,
          altText: item.alt.tr,
          tags: [...item.tags, "skyvan-küratörlü", catalogKey],
          isFeatured: item.isFeatured,
          usageScope: item.usageScope,
          provider: "direct",
          uploadDate: syncedAt,
        };
        const insertedRows = await transaction
          .insert(localizedContent)
          .values({
            id: item.mediaId,
            entityId: item.entityId,
            entityType: MEDIA_ENTITY_TYPE,
            locale: "tr",
            title: item.title,
            description: item.description,
            contentJson,
          })
          .onConflictDoNothing()
          .returning({
            id: localizedContent.id,
            entityId: localizedContent.entityId,
            entityType: localizedContent.entityType,
            locale: localizedContent.locale,
            title: localizedContent.title,
            contentJson: localizedContent.contentJson,
          });
        const insertedRow = insertedRows[0];

        if (!insertedRow) {
          continue;
        }

        await writeStrictAuditLogInTransaction(transaction, {
          entityType: MEDIA_ENTITY_TYPE,
          entityId: insertedRow.id,
          action: "create",
          newState: insertedRow,
          actor: auditActor,
        });
        inserted += 1;
      }

      return inserted;
    });

    revalidatePath("/admin/media");
    revalidatePath("/admin/pages");
    redirect(
      buildMediaRedirectUrl({
        mediaAction: "curated-synced",
        mediaCount: String(insertedCount),
      }),
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirectMediaError(
        "Session-bound audit actor çözülemediği için küratörlü medya içe aktarılamadı.",
      );
    }

    console.error("syncCuratedSkyvanMedia error:", {
      action: "syncCuratedSkyvanMedia",
      errorName: error instanceof Error ? error.name : "Error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    redirectMediaError("Küratörlü medya içe aktarımı sırasında beklenmeyen bir hata oluştu.");
  }
}
