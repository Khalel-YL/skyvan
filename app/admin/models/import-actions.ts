"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { models } from "@/db/schema";
import {
  AuditActorBindingError,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

import {
  getOfficialVehicleSeedsForBatch,
  type OfficialVehicleImportBatchKey,
} from "./official-vehicle-catalog";

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logModelImportError(action: string, count: number, error: unknown) {
  console.error(`models/${action} error`, {
    action,
    count,
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function parseBatchKey(formData: FormData): OfficialVehicleImportBatchKey | null {
  const raw = String(formData.get("batchKey") ?? "").trim();

  switch (raw) {
    case "large-van-core":
    case "ducato-class":
    case "transit-class":
    case "sprinter-class":
    case "master-class":
    case "crafter-class":
    case "daily-class":
      return raw;
    default:
      return null;
  }
}

function buildModelsRedirectUrl(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/models?${query}` : "/admin/models";
}

export async function importOfficialVehicleSeeds(formData: FormData) {
  const db = getDbOrThrow();
  const batchKey = parseBatchKey(formData);

  if (!batchKey) {
    redirect(
      buildModelsRedirectUrl({
        importStatus: "error",
        importCode: "invalid-batch",
      }),
    );
  }

  let importedCount = 0;
  let skippedCount = 0;

  try {
    const auditActor = await requireStrictAuditActor();
    const seeds = getOfficialVehicleSeedsForBatch(batchKey);

    if (seeds.length === 0) {
      redirect(
        buildModelsRedirectUrl({
          importStatus: "error",
          importCode: "empty-batch",
          batch: batchKey,
        }),
      );
    }

    const slugs = seeds.map((item) => item.slug);

    const existingRows = await db
      .select({
        slug: models.slug,
      })
      .from(models)
      .where(inArray(models.slug, slugs));

    const existingSlugSet = new Set(existingRows.map((item) => item.slug));

    const toInsert = seeds.filter((item) => !existingSlugSet.has(item.slug));
    const skipped = seeds.filter((item) => existingSlugSet.has(item.slug));

    let insertedRows: Array<{
      id: string;
      slug: string;
      baseWeightKg: string | number;
      maxPayloadKg: string | number;
      wheelbaseMm: number;
      roofLengthMm: number | null;
      roofWidthMm: number | null;
      status: "draft" | "active" | "archived";
      updatedAt: Date | string | null;
    }> = [];

    if (toInsert.length > 0) {
      insertedRows = await db
        .insert(models)
        .values(
          toInsert.map((item) => ({
            id: uuidv4(),
            slug: item.slug,
            baseWeightKg: item.baseWeightKg.toFixed(2),
            maxPayloadKg: item.maxPayloadKg.toFixed(2),
            wheelbaseMm: item.wheelbaseMm,
            roofLengthMm: item.roofLengthMm,
            roofWidthMm: item.roofWidthMm,
            status: item.status,
          })),
        )
        .returning({
          id: models.id,
          slug: models.slug,
          baseWeightKg: models.baseWeightKg,
          maxPayloadKg: models.maxPayloadKg,
          wheelbaseMm: models.wheelbaseMm,
          roofLengthMm: models.roofLengthMm,
          roofWidthMm: models.roofWidthMm,
          status: models.status,
          updatedAt: models.updatedAt,
        });

      try {
        for (const insertedModel of insertedRows) {
          await writeStrictAuditLogInTransaction(db, {
            entityType: "model",
            entityId: insertedModel.id,
            action: "create",
            newState: insertedModel,
            actor: auditActor,
          });
        }
      } catch (error) {
        logModelImportError(
          "importOfficialVehicleSeeds audit",
          insertedRows.length,
          error,
        );

        redirect(
          buildModelsRedirectUrl({
            importStatus: "error",
            importCode: "unexpected",
            batch: batchKey,
          }),
        );
      }
    }

    importedCount = insertedRows.length;
    skippedCount = skipped.length;

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      redirect(
        buildModelsRedirectUrl({
          importStatus: "error",
          importCode: "unexpected",
          batch: batchKey,
        }),
      );
    }

    logModelImportError("importOfficialVehicleSeeds", importedCount, error);

    redirect(
      buildModelsRedirectUrl({
        importStatus: "error",
        importCode: "unexpected",
        batch: batchKey,
      }),
    );
  }

  redirect(
    buildModelsRedirectUrl({
      importStatus: "success",
      batch: batchKey,
      imported: importedCount,
      skipped: skippedCount,
    }),
  );
}
