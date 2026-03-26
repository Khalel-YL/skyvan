"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { models } from "@/db/schema";

import { normalizeModelSlug, splitModelSlugCounter } from "./slug";
import {
  initialModelFormState,
  type ModelFieldName,
  type ModelFormState,
} from "./types";

function getDatabase() {
  if (!db) {
    throw new Error("DATABASE_URL tanımlı değil.");
  }

  return db;
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeStatus(value: string): "draft" | "active" | "archived" {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseDecimal(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function createFieldError(
  field: ModelFieldName,
  message: string,
  suggestedSlug: string | null = null,
): ModelFormState {
  return {
    ...initialModelFormState,
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
    suggestedSlug,
  };
}

function createGenericError(message: string): ModelFormState {
  return {
    ...initialModelFormState,
    status: "error",
    message,
  };
}

function requireDecimal(
  value: string,
  label: string,
  min: number,
  max: number,
  field: ModelFieldName,
) {
  const parsed = parseDecimal(value);

  if (parsed === null) {
    throw createFieldError(field, `${label} sayısal olmalıdır.`);
  }

  if (parsed < min || parsed > max) {
    throw createFieldError(
      field,
      `${label} ${min} ile ${max} arasında olmalıdır.`,
    );
  }

  return parsed;
}

function requireInteger(
  value: string,
  label: string,
  min: number,
  max: number,
  field: ModelFieldName,
) {
  const parsed = parseInteger(value);

  if (parsed === null) {
    throw createFieldError(field, `${label} sayısal olmalıdır.`);
  }

  if (parsed < min || parsed > max) {
    throw createFieldError(
      field,
      `${label} ${min} ile ${max} arasında olmalıdır.`,
    );
  }

  return parsed;
}

function optionalInteger(
  value: string,
  min: number,
  max: number,
  field: ModelFieldName,
) {
  if (!value) {
    return null;
  }

  const parsed = parseInteger(value);

  if (parsed === null) {
    throw createFieldError(field, "Opsiyonel alan sayısal olmalıdır.");
  }

  if (parsed < min || parsed > max) {
    throw createFieldError(
      field,
      `Opsiyonel alan ${min} ile ${max} arasında olmalıdır.`,
    );
  }

  return parsed;
}

async function findModelBySlug(slug: string) {
  const database = getDatabase();

  const rows = await database
    .select({
      id: models.id,
      slug: models.slug,
    })
    .from(models)
    .where(eq(models.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

async function getNextAvailableSlug(requestedSlug: string) {
  const normalized = normalizeModelSlug(requestedSlug);

  if (!normalized) {
    return "";
  }

  const existing = await findModelBySlug(normalized);

  if (!existing) {
    return normalized;
  }

  const { baseSlug, counter } = splitModelSlugCounter(normalized);
  let nextCounter = counter ? counter + 1 : 2;

  while (true) {
    const candidate = `${baseSlug}-${nextCounter}`;
    const candidateExists = await findModelBySlug(candidate);

    if (!candidateExists) {
      return candidate;
    }

    nextCounter += 1;
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

export async function saveModel(
  _previousState: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  try {
    const database = getDatabase();

    const id = getTrimmed(formData, "id");
    const requestedSlug = getTrimmed(formData, "slug");
    const slug = normalizeModelSlug(requestedSlug);
    const status = normalizeStatus(getTrimmed(formData, "status"));

    if (!slug) {
      return createFieldError("slug", "Model kodu zorunludur.");
    }

    if (slug.length < 3) {
      return createFieldError("slug", "Model kodu en az 3 karakter olmalıdır.");
    }

    if (slug.length > 80) {
      return createFieldError(
        "slug",
        "Model kodu en fazla 80 karakter olabilir.",
      );
    }

    const baseWeightKg = requireDecimal(
      getTrimmed(formData, "baseWeightKg"),
      "Boş ağırlık",
      500,
      10000,
      "baseWeightKg",
    );

    const maxPayloadKg = requireDecimal(
      getTrimmed(formData, "maxPayloadKg"),
      "Maksimum yük",
      100,
      10000,
      "maxPayloadKg",
    );

    const wheelbaseMm = requireInteger(
      getTrimmed(formData, "wheelbaseMm"),
      "Dingil mesafesi",
      1800,
      6000,
      "wheelbaseMm",
    );

    const roofLengthMm = optionalInteger(
      getTrimmed(formData, "roofLengthMm"),
      1000,
      10000,
      "roofLengthMm",
    );

    const roofWidthMm = optionalInteger(
      getTrimmed(formData, "roofWidthMm"),
      500,
      4000,
      "roofWidthMm",
    );

    if (maxPayloadKg < 200) {
      return createFieldError(
        "maxPayloadKg",
        "Maksimum yük kapasitesi gerçek dönüşüm senaryosu için çok düşük.",
      );
    }

    const existing = await findModelBySlug(slug);

    let savedSlug = slug;

    if (id) {
      if (existing && existing.id !== id) {
        const suggestedSlug = await getNextAvailableSlug(slug);

        return createFieldError(
          "slug",
          `Bu model kodu zaten kullanılıyor. Öneri: ${suggestedSlug}`,
          suggestedSlug,
        );
      }

      await database
        .update(models)
        .set({
          slug,
          baseWeightKg: baseWeightKg.toFixed(2),
          maxPayloadKg: maxPayloadKg.toFixed(2),
          wheelbaseMm,
          roofLengthMm,
          roofWidthMm,
          status,
          updatedAt: new Date(),
        })
        .where(eq(models.id, id));

      savedSlug = slug;
    } else {
      const resolvedSlug = existing ? await getNextAvailableSlug(slug) : slug;

      await database.insert(models).values({
        id: uuidv4(),
        slug: resolvedSlug,
        baseWeightKg: baseWeightKg.toFixed(2),
        maxPayloadKg: maxPayloadKg.toFixed(2),
        wheelbaseMm,
        roofLengthMm,
        roofWidthMm,
        status,
      });

      savedSlug = resolvedSlug;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/models");

    const query = id
      ? `/admin/models?saved=1&updated=${encodeURIComponent(savedSlug)}`
      : `/admin/models?saved=1&created=${encodeURIComponent(savedSlug)}`;

    redirect(query);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === "error"
    ) {
      return error as ModelFormState;
    }

    console.error("saveModel error:", error);
    return createGenericError("Model kaydı işlenirken beklenmeyen bir hata oluştu.");
  }
}

export async function archiveModel(formData: FormData) {
  const database = getDatabase();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  try {
    await database
      .update(models)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(models.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    console.error("archiveModel error:", error);

    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "archive-failed",
      }),
    );
  }

  redirect(
    buildModelsRedirectUrl({
      modelAction: "archived",
    }),
  );
}

export async function restoreModel(formData: FormData) {
  const database = getDatabase();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  try {
    await database
      .update(models)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(models.id, id));

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    console.error("restoreModel error:", error);

    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "restore-failed",
      }),
    );
  }

  redirect(
    buildModelsRedirectUrl({
      modelAction: "restored",
    }),
  );
}