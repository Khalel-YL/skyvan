"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { models } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function getSafeErrorName(error: unknown) {
  return error instanceof Error ? error.name : "Error";
}

function getSafeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function logModelActionError(action: string, id: string | null, error: unknown) {
  console.error(`models/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getModelSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen model kaydı veya benzersiz alan çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili kayıt doğrulanamadığı için model işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz kayıt kimliği nedeniyle model işlemi durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle model kaydı tamamlanamadı.";
  }

  return "Model kaydı işlenirken beklenmeyen bir hata oluştu.";
}

function getModelMutationCode(error: unknown, fallback: string) {
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

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "duplicate";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "db-write-failed";
  }

  return fallback;
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

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
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
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "model",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
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

    if (id && !isUuid(id)) {
      return createGenericError("Geçersiz kayıt kimliği nedeniyle model işlemi durduruldu.");
    }

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
    const auditActor = await requireStrictAuditActor();

    if (id && existingModel) {
      if (existing && existing.id !== id) {
        const suggestedSlug = await getNextAvailableSlug(slug);

        return createFieldError(
          "slug",
          `Bu model kodu zaten kullanılıyor. Öneri: ${suggestedSlug}`,
          suggestedSlug,
        );
      }

      let updatedModel: ModelRecord | null = null;

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

      updatedModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

      if (!updatedModel) {
        return createGenericError("Model kaydı işlem sırasında güncellenemedi.");
      }

      savedSlug = updatedModel.slug;

      try {
        await writeModelAudit({
          database: db,
          actor: auditActor,
          entityId: updatedModel.id,
          action: "update",
          previousState: existingModel,
          newState: updatedModel,
        });
      } catch (error) {
        logModelActionError("saveModel audit update", id, error);
        return createGenericError(
          "Model kaydı güncellendi ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    } else {
      const resolvedSlug = existing ? await getNextAvailableSlug(slug) : slug;
      let insertedModel: ModelRecord | null = null;

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

      insertedModel = (insertedRows[0] as ModelRecord | undefined) ?? null;

      if (!insertedModel) {
        return createGenericError("Model kaydı oluşturulamadı.");
      }

      savedSlug = insertedModel.slug;

      try {
        await writeModelAudit({
          database: db,
          actor: auditActor,
          entityId: insertedModel.id,
          action: "create",
          newState: insertedModel,
        });
      } catch (error) {
        logModelActionError("saveModel audit create", insertedModel.id, error);
        return createGenericError(
          "Model kaydı oluşturuldu ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/models");

    const query = id
      ? `/admin/models?saved=1&updated=${encodeURIComponent(savedSlug)}`
      : `/admin/models?saved=1&created=${encodeURIComponent(savedSlug)}`;

    redirect(query);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === "error"
    ) {
      return error as ModelFormState;
    }

    if (error instanceof AuditActorBindingError) {
      return createGenericError(
        "Session-bound audit actor çözülemediği için model kaydı güvenli şekilde tamamlanamadı.",
      );
    }

    logModelActionError("saveModel", null, error);
    return createGenericError(getModelSaveFailureMessage(error));
  }
}

export async function archiveModel(formData: FormData) {
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id || !isUuid(id)) {
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
    const auditActor = await requireStrictAuditActor();
    let archivedModel: ModelRecord | null = null;

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

    archivedModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

    if (!archivedModel) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "invalid-id",
        }),
      );
    }

    try {
      await writeModelAudit({
        database: db,
        actor: auditActor,
        entityId: archivedModel.id,
        action: "update",
        previousState: existingModel,
        newState: archivedModel,
      });
    } catch (error) {
      logModelActionError("archiveModel audit", id, error);
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "audit-write-failed",
        }),
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "archive-failed",
        }),
      );
    }

    logModelActionError("archiveModel", id, error);

    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: getModelMutationCode(error, "archive-failed"),
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

  if (!id || !isUuid(id)) {
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
    const auditActor = await requireStrictAuditActor();
    let restoredModel: ModelRecord | null = null;

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

    restoredModel = (updatedRows[0] as ModelRecord | undefined) ?? null;

    if (!restoredModel) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "invalid-id",
        }),
      );
    }

    try {
      await writeModelAudit({
        database: db,
        actor: auditActor,
        entityId: restoredModel.id,
        action: "update",
        previousState: existingModel,
        newState: restoredModel,
      });
    } catch (error) {
      logModelActionError("restoreModel audit", id, error);
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "audit-write-failed",
        }),
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/models");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildModelsRedirectUrl({
          modelAction: "error",
          modelCode: "restore-failed",
        }),
      );
    }

    logModelActionError("restoreModel", id, error);

    redirect(
      buildModelsRedirectUrl({
        modelAction: "error",
        modelCode: getModelMutationCode(error, "restore-failed"),
      }),
    );
  }

  redirect(
    buildModelsRedirectUrl({
      modelAction: "restored",
    }),
  );
}
