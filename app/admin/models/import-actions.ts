"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { models } from "@/db/schema";

import {
  getOfficialVehicleSeedsForBatch,
  type OfficialVehicleImportBatchKey,
} from "./official-vehicle-catalog";

function getDatabase() {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  return db;
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
    const database = getDatabase();
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

    const existingRows = await database
      .select({
        slug: models.slug,
      })
      .from(models)
      .where(inArray(models.slug, slugs));

    const existingSlugSet = new Set(existingRows.map((item) => item.slug));

    const toInsert = seeds.filter((item) => !existingSlugSet.has(item.slug));
    const skipped = seeds.filter((item) => existingSlugSet.has(item.slug));

    if (toInsert.length > 0) {
      await database.insert(models).values(
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
      );
    }

    importedCount = toInsert.length;
    skippedCount = skipped.length;

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    console.error("importOfficialVehicleSeeds error:", error);

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