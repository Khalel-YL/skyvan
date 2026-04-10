"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { models } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";

import { normalizeModelSlug, splitModelSlugCounter } from "./slug";
import {
  initialModelFormState,
  type ModelFieldName,
  type ModelFormState,
} from "./types";

type ModelRecord = {
  id: string;
  slug: string;
  baseWeightKg: string | number;
  maxPayloadKg: string | number;
  wheelbaseMm: number;
  roofLengthMm: number | null;
  roofWidthMm: number | null;
  status: "draft" | "active" | "archived";
  updatedAt: Date | string | null;
};

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
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: models.id,
      slug: models.slug,
    })
    .from(models)
    .where(eq(models.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

async function findModelById(id: string): Promise<ModelRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: models.id,
      slug: models.slug,
      baseWeightKg: models.baseWeightKg,
      maxPayloadKg: models.maxPayloadKg,
      wheelbaseMm: models.wheelbaseMm,
      roofLengthMm: models.roofLengthMm,
      roofWidthMm: models.roofWidthMm,
      status: models.status,
      updatedAt: models.updatedAt,
    })
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  return (rows[0] as ModelRecord | undefined) ?? null;
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

async function writeModelAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: "model",
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("model audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("model audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

export async function saveModel(
  _previousState: ModelFormState,
  formData: FormData,
): Promise<ModelFormState> {
  try {
    const db = getDbOrThrow();

    const id = getTrimmed(formData, "id");
    const requestedSlug = getTrimmed(formData, "slug");
    const slug = normalizeModelSlug(requestedSlug);
    const status = normalizeStatus(getTrimmed(formData, "status"));
    const existingModel = id ? await findModelById(id) : null;

    if (id && !existingModel) {
      return createGenericError("Güncellenecek model kaydı bulunamadı.");
    }

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

    if (id && existingModel) {
      if (existing && existing.id !== id) {
        const suggestedSlug = await getNextAvailableSlug(slug);

        return createFieldError(
          "slug",
          `Bu model kodu zaten kullanılıyor. Öneri: ${suggestedSlug}`,
          suggestedSlug,
        );
      }

      const updatedRows = await db
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
        .where(eq(models.id, id))
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

      const updatedModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

      if (!updatedModel) {
        return createGenericError("Model kaydı işlem sırasında güncellenemedi.");
      }

      await writeModelAudit({
        entityId: updatedModel.id,
        action: "update",
        previousState: existingModel,
        newState: updatedModel,
      });

      savedSlug = updatedModel.slug;
    } else {
      const resolvedSlug = existing ? await getNextAvailableSlug(slug) : slug;

      const insertedRows = await db
        .insert(models)
        .values({
          id: uuidv4(),
          slug: resolvedSlug,
          baseWeightKg: baseWeightKg.toFixed(2),
          maxPayloadKg: maxPayloadKg.toFixed(2),
          wheelbaseMm,
          roofLengthMm,
          roofWidthMm,
          status,
        })
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

      const insertedModel = (insertedRows[0] as ModelRecord | undefined) ?? null;

      if (!insertedModel) {
        return createGenericError("Model kaydı oluşturulamadı.");
      }

      await writeModelAudit({
        entityId: insertedModel.id,
        action: "create",
        newState: insertedModel,
      });

      savedSlug = insertedModel.slug;
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
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  const existingModel = await findModelById(id);

  if (!existingModel) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  try {
    const updatedRows = await db
      .update(models)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(eq(models.id, id))
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

    const archivedModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

    if (!archivedModel) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "invalid-id",
        }),
      );
    }

    await writeModelAudit({
      entityId: archivedModel.id,
      action: "update",
      previousState: existingModel,
      newState: archivedModel,
    });

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
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  const existingModel = await findModelById(id);

  if (!existingModel) {
    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: "invalid-id",
      }),
    );
  }

  try {
    const updatedRows = await db
      .update(models)
      .set({
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(models.id, id))
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

    const restoredModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

    if (!restoredModel) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "invalid-id",
        }),
      );
    }

    await writeModelAudit({
      entityId: restoredModel.id,
      action: "update",
      previousState: existingModel,
      newState: restoredModel,
    });

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
