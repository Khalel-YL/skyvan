"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { buildVersions, models, packages } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";

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

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: "package",
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("package audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("package audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
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

    if (id && existingPackage) {
      if (existing && existing.id !== id) {
        const suggestedSlug = await getNextAvailableSlug(slug);

        return createFieldError(
          "slug",
          `Bu paket kodu zaten kullanılıyor. Öneri: ${suggestedSlug}`,
          suggestedSlug,
        );
      }

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

      const updatedPackage = (updatedRows[0] as PackageRecord | undefined) ?? null;

      if (!updatedPackage) {
        return createGenericError("Paket kaydı işlem sırasında güncellenemedi.");
      }

      await writePackageAudit({
        entityId: updatedPackage.id,
        action: "update",
        previousState: existingPackage,
        newState: updatedPackage,
      });

      savedSlug = updatedPackage.slug;
    } else {
      const resolvedSlug = existing ? await getNextAvailableSlug(slug) : slug;

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

      const insertedPackage = (insertedRows[0] as PackageRecord | undefined) ?? null;

      if (!insertedPackage) {
        return createGenericError("Paket kaydı oluşturulamadı.");
      }

      await writePackageAudit({
        entityId: insertedPackage.id,
        action: "create",
        newState: insertedPackage,
      });

      savedSlug = insertedPackage.slug;
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
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === "error"
    ) {
      return error as PackageFormState;
    }

    console.error("savePackage error:", error);
    return createGenericError("Paket kaydı işlenirken beklenmeyen bir hata oluştu.");
  }
}

export async function deletePackage(formData: FormData) {
  const db = getDbOrThrow();
  const id = getTrimmed(formData, "id");

  if (!id) {
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
    const usage = await db
      .select({
        packageId: buildVersions.packageId,
      })
      .from(buildVersions)
      .where(eq(buildVersions.packageId, id))
      .limit(1);

    if (usage.length > 0) {
      redirect(
        buildPackagesRedirectUrl({
          packageAction: "error",
          packageCode: "in-use",
        }),
      );
    }

    const deletedRows = await db
      .delete(packages)
      .where(eq(packages.id, id))
      .returning({
        id: packages.id,
      });

    if (deletedRows.length === 0) {
      redirect(
        buildPackagesRedirectUrl({
          packageAction: "error",
          packageCode: "invalid-id",
        }),
      );
    }

    await writePackageAudit({
      entityId: existingPackage.id,
      action: "delete",
      previousState: existingPackage,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/packages");
  } catch (error) {
    console.error("deletePackage error:", error);

    redirect(
      buildPackagesRedirectUrl({
        packageAction: "error",
        packageCode: "delete-failed",
      }),
    );
  }

  redirect(
    buildPackagesRedirectUrl({
      packageAction: "deleted",
    }),
  );
}
