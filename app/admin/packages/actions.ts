"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { buildVersions, models, packages } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";

import { normalizePackageSlug, splitPackageSlugCounter } from "./package-slug";
import {
  initialPackageFormState,
  type PackageFieldName,
  type PackageFormState,
} from "./types";

type PackageRecord = {
  id: string;
  modelId: string | null;
  name: string;
  slug: string;
  tierLevel: number | null;
  isDefault: boolean;
  createdAt: Date | string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function logPackageActionError(action: string, id: string | null, error: unknown) {
  console.error(`packages/${action} error`, {
    action,
    hasId: Boolean(id),
    errorName: getSafeErrorName(error),
    errorMessage: getSafeErrorMessage(error),
  });
}

function getPackageSaveFailureMessage(error: unknown) {
  const message = getSafeErrorMessage(error).toLowerCase();

  if (message.includes("duplicate key") || message.includes("23505")) {
    return "Yinelenen paket kaydı veya benzersiz alan çakışması nedeniyle kayıt tamamlanamadı.";
  }

  if (message.includes("violates foreign key constraint")) {
    return "İlişkili kayıt doğrulanamadığı için paket işlemi tamamlanamadı.";
  }

  if (message.includes("invalid input syntax for type uuid")) {
    return "Geçersiz kayıt kimliği nedeniyle paket işlemi durduruldu.";
  }

  if (message.includes("database_url") || message.includes("fetch failed")) {
    return "Veritabanı yazım hatası nedeniyle paket kaydı tamamlanamadı.";
  }

  return "Paket kaydı işlenirken beklenmeyen bir hata oluştu.";
}

function getPackageMutationCode(error: unknown, fallback: string) {
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

function parseBoolean(value: string) {
  return value === "true" || value === "on" || value === "1";
}

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function createFieldError(
  field: PackageFieldName,
  message: string,
  suggestedSlug: string | null = null,
): PackageFormState {
  return {
    ...initialPackageFormState,
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
    suggestedSlug,
  };
}

function createGenericError(message: string): PackageFormState {
  return {
    ...initialPackageFormState,
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

function buildPackagesRedirectUrl(
  params: Record<string, string | number | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/packages?${query}` : "/admin/packages";
}

async function findPackageBySlug(slug: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: packages.id,
      slug: packages.slug,
    })
    .from(packages)
    .where(eq(packages.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

async function findPackageById(id: string): Promise<PackageRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: packages.id,
      modelId: packages.modelId,
      name: packages.name,
      slug: packages.slug,
      tierLevel: packages.tierLevel,
      isDefault: packages.isDefault,
      createdAt: packages.createdAt,
    })
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  return (rows[0] as PackageRecord | undefined) ?? null;
}

async function modelExists(id: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({ id: models.id })
    .from(models)
    .where(eq(models.id, id))
    .limit(1);

  return rows.length > 0;
}

async function getNextAvailableSlug(requestedSlug: string) {
  const normalized = normalizePackageSlug(requestedSlug);

  if (!normalized) {
    return "";
  }

  const existing = await findPackageBySlug(normalized);

  if (!existing) {
    return normalized;
  }

  const { baseSlug, counter } = splitPackageSlugCounter(normalized);
  let nextCounter = counter ? counter + 1 : 2;

  while (true) {
    const candidate = `${baseSlug}-${nextCounter}`;
    const candidateExists = await findPackageBySlug(candidate);

    if (!candidateExists) {
      return candidate;
    }

    nextCounter += 1;
  }
}

function requireTierLevel(value: string) {
  const parsed = parseInteger(value);

  if (parsed === null) {
    throw createFieldError("tierLevel", "Seviye sayısal olmalıdır.");
  }

  if (parsed < 0 || parsed > 20) {
    throw createFieldError("tierLevel", "Seviye 0 ile 20 arasında olmalıdır.");
  }

  return parsed;
}

async function writePackageAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "package",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

export async function savePackage(
  _previousState: PackageFormState,
  formData: FormData,
): Promise<PackageFormState> {
  try {
    const db = getDbOrThrow();

    const id = getTrimmed(formData, "id");
    const modelId = getTrimmed(formData, "modelId") || null;
    const name = getTrimmed(formData, "name");
    const requestedSlug = getTrimmed(formData, "slug");
    const slug = normalizePackageSlug(requestedSlug);
    const tierLevel = requireTierLevel(getTrimmed(formData, "tierLevel"));
    const isDefault = parseBoolean(getTrimmed(formData, "isDefault"));

    if (id && !isUuid(id)) {
      return createGenericError("Geçersiz kayıt kimliği nedeniyle paket işlemi durduruldu.");
    }

    if (modelId && !isUuid(modelId)) {
      return createFieldError("modelId", "Seçilen model kimliği geçersiz.");
    }

    const existingPackage = id ? await findPackageById(id) : null;

    if (id && !existingPackage) {
      return createGenericError("Güncellenecek paket kaydı bulunamadı.");
    }

    if (!name) {
      return createFieldError("name", "Paket adı zorunludur.");
    }

    if (name.length < 2) {
      return createFieldError("name", "Paket adı en az 2 karakter olmalıdır.");
    }

    if (name.length > 120) {
      return createFieldError("name", "Paket adı en fazla 120 karakter olabilir.");
    }

    if (!slug) {
      return createFieldError("slug", "Paket kodu zorunludur.");
    }

    if (slug.length < 3) {
      return createFieldError("slug", "Paket kodu en az 3 karakter olmalıdır.");
    }

    if (slug.length > 120) {
      return createFieldError("slug", "Paket kodu en fazla 120 karakter olabilir.");
    }

    if (modelId && !(await modelExists(modelId))) {
      return createFieldError("modelId", "Seçilen model bulunamadı.");
    }

    const existing = await findPackageBySlug(slug);
    let savedSlug = slug;
    const auditActor = await requireStrictAuditActor();

    if (id && existingPackage) {
      if (existing && existing.id !== id) {
        const suggestedSlug = await getNextAvailableSlug(slug);

        return createFieldError(
          "slug",
          `Bu paket kodu zaten kullanılıyor. Öneri: ${suggestedSlug}`,
          suggestedSlug,
        );
      }

      let updatedPackage: PackageRecord | null = null;

      const updatedRows = await db
        .update(packages)
        .set({
          modelId,
          name,
          slug,
          tierLevel,
          isDefault,
        })
        .where(eq(packages.id, id))
        .returning({
          id: packages.id,
          modelId: packages.modelId,
          name: packages.name,
          slug: packages.slug,
          tierLevel: packages.tierLevel,
          isDefault: packages.isDefault,
          createdAt: packages.createdAt,
        });

      updatedPackage = (updatedRows[0] as PackageRecord | undefined) ?? null;

      if (!updatedPackage) {
        return createGenericError("Paket kaydı işlem sırasında güncellenemedi.");
      }

      savedSlug = updatedPackage.slug;

      try {
        await writePackageAudit({
          database: db,
          actor: auditActor,
          entityId: updatedPackage.id,
          action: "update",
          previousState: existingPackage,
          newState: updatedPackage,
        });
      } catch (error) {
        logPackageActionError("savePackage audit update", id, error);
        return createGenericError(
          "Paket kaydı güncellendi ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    } else {
      const resolvedSlug = existing ? await getNextAvailableSlug(slug) : slug;
      let insertedPackage: PackageRecord | null = null;

      const insertedRows = await db
        .insert(packages)
        .values({
          id: uuidv4(),
          modelId,
          name,
          slug: resolvedSlug,
          tierLevel,
          isDefault,
        })
        .returning({
          id: packages.id,
          modelId: packages.modelId,
          name: packages.name,
          slug: packages.slug,
          tierLevel: packages.tierLevel,
          isDefault: packages.isDefault,
          createdAt: packages.createdAt,
        });

      insertedPackage = (insertedRows[0] as PackageRecord | undefined) ?? null;

      if (!insertedPackage) {
        return createGenericError("Paket kaydı oluşturulamadı.");
      }

      savedSlug = insertedPackage.slug;

      try {
        await writePackageAudit({
          database: db,
          actor: auditActor,
          entityId: insertedPackage.id,
          action: "create",
          newState: insertedPackage,
        });
      } catch (error) {
        logPackageActionError("savePackage audit create", insertedPackage.id, error);
        return createGenericError(
          "Paket kaydı oluşturuldu ancak audit kaydı yazılamadığı için işlem tam başarılı kabul edilmedi.",
        );
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/packages");

    redirect(
      buildPackagesRedirectUrl(
        id
          ? { saved: 1, updated: savedSlug }
          : { saved: 1, created: savedSlug },
      ),
    );
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
      return error as PackageFormState;
    }

    if (error instanceof AuditActorBindingError) {
      return createGenericError(
        "Session-bound audit actor çözülemediği için paket kaydı güvenli şekilde tamamlanamadı.",
      );
    }

    logPackageActionError("savePackage", null, error);
    return createGenericError(getPackageSaveFailureMessage(error));
  }
}

export async function deletePackage(formData: FormData) {
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id || !isUuid(id)) {
    redirect(
      buildPackagesRedirectUrl({
        packageAction: "error",
        packageCode: "invalid-id",
      }),
    );
  }

  const existingPackage = await findPackageById(id);

  if (!existingPackage) {
    redirect(
      buildPackagesRedirectUrl({
        packageAction: "error",
        packageCode: "invalid-id",
      }),
    );
  }

  try {
    const auditActor = await requireStrictAuditActor();
    let mutationCode: "in-use" | "invalid-id" | null = null;

    const usage = await db
      .select({
        packageId: buildVersions.packageId,
      })
      .from(buildVersions)
      .where(eq(buildVersions.packageId, id))
      .limit(1);

    if (usage.length > 0) {
      mutationCode = "in-use";
    }

    if (!mutationCode) {
      const deletedRows = await db
        .delete(packages)
        .where(eq(packages.id, id))
        .returning({
          id: packages.id,
        });

      if (deletedRows.length === 0) {
        mutationCode = "invalid-id";
      }

      if (!mutationCode) {
        try {
          await writePackageAudit({
            database: db,
            actor: auditActor,
            entityId: existingPackage.id,
            action: "delete",
            previousState: existingPackage,
          });
        } catch (error) {
          logPackageActionError("deletePackage audit", id, error);
          redirect(
            buildPackagesRedirectUrl({
              packageAction: "error",
              packageCode: "audit-write-failed",
            }),
          );
        }
      }
    }

    if (mutationCode === "in-use") {
      redirect(
        buildPackagesRedirectUrl({
          packageAction: "error",
          packageCode: "in-use",
        }),
      );
    }

    if (mutationCode === "invalid-id") {
      redirect(
        buildPackagesRedirectUrl({
          packageAction: "error",
          packageCode: "invalid-id",
        }),
      );
    }

    revalidatePath("/admin");
    revalidatePath("/admin/packages");
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildPackagesRedirectUrl({
          packageAction: "error",
          packageCode: "delete-failed",
        }),
      );
    }

    logPackageActionError("deletePackage", id, error);

    redirect(
      buildPackagesRedirectUrl({
        packageAction: "error",
        packageCode: getPackageMutationCode(error, "delete-failed"),
      }),
    );
  }

  redirect(
    buildPackagesRedirectUrl({
      packageAction: "deleted",
    }),
  );
}
