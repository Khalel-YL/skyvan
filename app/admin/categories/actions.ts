"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { categories } from "@/db/schema";
import {
  type AuditInsertDatabase,
  AuditActorBindingError,
  type StrictAuditActor,
  requireStrictAuditActor,
  writeStrictAuditLogInTransaction,
} from "@/app/lib/admin/audit";
import {
  initialCategoryFormState,
  type CategoryFieldName,
  type CategoryFormState,
} from "./types";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: "draft" | "active" | "archived";
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type SeedCategory = {
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  legacySlugs: string[];
  legacyNames: string[];
};

type CategorySyncCode =
  | "audit-actor-failed"
  | "duplicate-slug"
  | "sync-failed";

class CategorySyncError extends Error {
  categoryCode: CategorySyncCode;
  dbCode?: string;
  detail?: string;
  constraint?: string;

  constructor(
    categoryCode: CategorySyncCode,
    message: string,
    options?: {
      dbCode?: string;
      detail?: string;
      constraint?: string;
    },
  ) {
    super(message);
    this.name = "CategorySyncError";
    this.categoryCode = categoryCode;
    this.dbCode = options?.dbCode;
    this.detail = options?.detail;
    this.constraint = options?.constraint;
  }
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeSlug(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStatus(value: string): "draft" | "active" | "archived" {
  if (value === "active" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseInteger(value: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function revalidateCategories() {
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
}

function buildCategoriesRedirectUrl(
  params: Record<string, string | number | undefined | null>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/categories?${query}` : "/admin/categories";
}

function createFieldError(
  field: CategoryFieldName,
  message: string,
): CategoryFormState {
  return {
    ...initialCategoryFormState,
    status: "error",
    message,
    fieldErrors: {
      [field]: message,
    },
  };
}

function createGenericError(message: string): CategoryFormState {
  return {
    ...initialCategoryFormState,
    status: "error",
    message,
  };
}

const seedCategories: SeedCategory[] = [
  {
    name: "Elektrik ve Enerji",
    slug: "elektrik-enerji",
    icon: "bolt",
    sortOrder: 10,
    legacySlugs: ["electrical", "electric", "electrical-mode", "electrical-mod"],
    legacyNames: ["Electrical"],
  },
  {
    name: "Su Sistemi",
    slug: "su-sistemi",
    icon: "droplet",
    sortOrder: 20,
    legacySlugs: ["water"],
    legacyNames: ["Water"],
  },
  {
    name: "Mobilya ve Depolama",
    slug: "mobilya-depolama",
    icon: "sofa",
    sortOrder: 30,
    legacySlugs: ["furniture"],
    legacyNames: ["Furniture"],
  },
  {
    name: "Mutfak Donanımı",
    slug: "mutfak-donanimi",
    icon: "chef-hat",
    sortOrder: 40,
    legacySlugs: ["kitchen"],
    legacyNames: ["Kitchen"],
  },
  {
    name: "Banyo ve WC",
    slug: "banyo-wc",
    icon: "bath",
    sortOrder: 50,
    legacySlugs: ["bathroom"],
    legacyNames: ["Bathroom"],
  },
  {
    name: "Pencere ve Havalandırma",
    slug: "pencere-havalandirma",
    icon: "square",
    sortOrder: 60,
    legacySlugs: ["windows"],
    legacyNames: ["Windows"],
  },
  {
    name: "Oturma Alanı",
    slug: "oturma-alani",
    icon: "armchair",
    sortOrder: 70,
    legacySlugs: ["seating"],
    legacyNames: ["Seating"],
  },
  {
    name: "Uyku Alanı",
    slug: "uyku-alani",
    icon: "bed",
    sortOrder: 80,
    legacySlugs: ["sleeping"],
    legacyNames: ["Sleeping"],
  },
];

const weakFallbackSlugs = new Set(["general", "genel-kategori"]);

function getCategoryNameKey(value: string) {
  return normalizeSlug(value);
}

function isWeakFallbackCategory(category: CategoryRecord) {
  return (
    weakFallbackSlugs.has(category.slug) ||
    weakFallbackSlugs.has(getCategoryNameKey(category.name))
  );
}

function getCategorySyncErrorDetails(error: unknown) {
  if (error instanceof CategorySyncError) {
    return {
      categoryCode: error.categoryCode,
      dbCode: error.dbCode,
      message: error.message,
      detail: error.detail,
      constraint: error.constraint,
    };
  }

  if (error instanceof AuditActorBindingError) {
    return {
      categoryCode: "audit-actor-failed" as const,
      dbCode: undefined,
      message: error.message,
      detail: undefined,
      constraint: undefined,
    };
  }

  const candidate = error as {
    code?: unknown;
    message?: unknown;
    detail?: unknown;
    constraint?: unknown;
  };

  const dbCode = typeof candidate?.code === "string" ? candidate.code : undefined;
  const message =
    typeof candidate?.message === "string"
      ? candidate.message
      : "Kategori senkronizasyonunda beklenmeyen hata.";
  const detail =
    typeof candidate?.detail === "string" ? candidate.detail : undefined;
  const constraint =
    typeof candidate?.constraint === "string" ? candidate.constraint : undefined;
  const duplicateSlugDetected =
    dbCode === "23505" ||
    constraint?.includes("slug") ||
    message.toLowerCase().includes("duplicate");

  return {
    categoryCode: duplicateSlugDetected
      ? ("duplicate-slug" as const)
      : ("sync-failed" as const),
    dbCode,
    message,
    detail,
    constraint,
  };
}

function logCategorySyncError(error: unknown) {
  const details = getCategorySyncErrorDetails(error);

  console.error("createCategorySeeds error", {
    categoryCode: details.categoryCode,
    dbCode: details.dbCode,
    message: details.message,
    detail: details.detail,
    constraint: details.constraint,
    error,
  });

  return details.categoryCode;
}

async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      icon: categories.icon,
      status: categories.status,
      sortOrder: categories.sortOrder,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
    })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  return (rows[0] as CategoryRecord | undefined) ?? null;
}

async function writeCategoryAudit(input: {
  database: AuditInsertDatabase;
  actor: StrictAuditActor;
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  await writeStrictAuditLogInTransaction(input.database, {
    entityType: "category",
    entityId: input.entityId,
    action: input.action,
    previousState: input.previousState,
    newState: input.newState,
    actor: input.actor,
  });
}

export async function saveCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const name = getTrimmed(formData, "name");
  const slug = normalizeSlug(getTrimmed(formData, "slug") || name);
  const icon = getTrimmed(formData, "icon") || "folder";
  const status = normalizeStatus(getTrimmed(formData, "status"));
  const sortOrder = parseInteger(getTrimmed(formData, "sortOrder"));
  const existingCategory = id ? await getCategoryById(id) : null;

  if (!name) {
    return createFieldError("name", "Kategori adı zorunludur.");
  }

  if (!slug) {
    return createFieldError("slug", "Kategori slug değeri zorunludur.");
  }

  if (slug.length < 2) {
    return createFieldError(
      "slug",
      "Kategori slug değeri en az 2 karakter olmalıdır.",
    );
  }

  if (sortOrder === null) {
    return createFieldError("sortOrder", "Sıra sayısal olmalıdır.");
  }

  if (sortOrder < 0) {
    return createFieldError("sortOrder", "Sıra negatif olamaz.");
  }

  if (id && !existingCategory) {
    return createGenericError("Güncellenecek kategori kaydı bulunamadı.");
  }

  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (existing[0] && existing[0].id !== id) {
    return createFieldError("slug", "Bu kategori slug değeri zaten kullanılıyor.");
  }

  try {
    const auditActor = await requireStrictAuditActor();

    if (id && existingCategory) {
      let updatedCategory: CategoryRecord | null = null;

      await db.transaction(async (tx) => {
        const updatedRows = await tx
          .update(categories)
          .set({
            name,
            slug,
            icon,
            status,
            sortOrder,
            updatedAt: new Date(),
          })
          .where(eq(categories.id, id))
          .returning({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            icon: categories.icon,
            status: categories.status,
            sortOrder: categories.sortOrder,
            createdAt: categories.createdAt,
            updatedAt: categories.updatedAt,
          });

        updatedCategory = (updatedRows[0] as CategoryRecord | undefined) ?? null;

        if (!updatedCategory) {
          return;
        }

        await writeCategoryAudit({
          database: tx,
          actor: auditActor,
          entityId: updatedCategory.id,
          action: "update",
          previousState: existingCategory,
          newState: updatedCategory,
        });
      });

      if (!updatedCategory) {
        return createGenericError("Kategori kaydı işlem sırasında güncellenemedi.");
      }
    } else {
      let insertedCategory: CategoryRecord | null = null;
      const now = new Date();

      await db.transaction(async (tx) => {
        const insertedRows = await tx
          .insert(categories)
          .values({
            id: uuidv4(),
            name,
            slug,
            icon,
            status,
            sortOrder,
            createdAt: now,
            updatedAt: now,
          })
          .returning({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            icon: categories.icon,
            status: categories.status,
            sortOrder: categories.sortOrder,
            createdAt: categories.createdAt,
            updatedAt: categories.updatedAt,
          });

        insertedCategory = (insertedRows[0] as CategoryRecord | undefined) ?? null;

        if (!insertedCategory) {
          return;
        }

        await writeCategoryAudit({
          database: tx,
          actor: auditActor,
          entityId: insertedCategory.id,
          action: "create",
          newState: insertedCategory,
        });
      });

      if (!insertedCategory) {
        return createGenericError("Kategori kaydı oluşturulamadı.");
      }
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      return createGenericError(
        "Oturum audit kullanıcısı çözülemediği için kategori kaydı güvenli şekilde tamamlanamadı.",
      );
    }

    console.error("saveCategory error:", error);
    return createGenericError(
      "Kategori kaydı işlenirken beklenmeyen bir hata oluştu.",
    );
  }

  revalidateCategories();
  redirect(buildCategoriesRedirectUrl({ saved: 1 }));
}

export async function deleteCategory(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode: "invalid-id",
      }),
    );
  }

  const existingCategory = await getCategoryById(normalizedId);

  if (!existingCategory) {
    revalidateCategories();
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode: "missing-category",
      }),
    );
  }

  let auditActor: StrictAuditActor;

  try {
    auditActor = await requireStrictAuditActor();
  } catch (error) {
    if (error instanceof AuditActorBindingError) {
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "delete-failed",
        }),
      );
    }

    throw error;
  }

  try {
    let deletedCount = 0;

    await db.transaction(async (tx) => {
      const deletedRows = await tx
        .delete(categories)
        .where(eq(categories.id, normalizedId))
        .returning({
          id: categories.id,
        });

      deletedCount = deletedRows.length;

      if (deletedCount === 0) {
        return;
      }

      await writeCategoryAudit({
        database: tx,
        actor: auditActor,
        entityId: existingCategory.id,
        action: "delete",
        previousState: existingCategory,
      });
    });

    if (deletedCount === 0) {
      revalidateCategories();
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "delete-failed",
        }),
      );
    }

    revalidateCategories();
    redirect(buildCategoriesRedirectUrl({ deleted: 1 }));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Category hard delete failed, archive fallback applied:", error);
  }

  try {
    let archivedCategory: CategoryRecord | null = null;

    await db.transaction(async (tx) => {
      const archivedRows = await tx
        .update(categories)
        .set({
          status: "archived",
          updatedAt: new Date(),
        })
        .where(eq(categories.id, normalizedId))
        .returning({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        });

      archivedCategory = (archivedRows[0] as CategoryRecord | undefined) ?? null;

      if (!archivedCategory) {
        return;
      }

      await writeCategoryAudit({
        database: tx,
        actor: auditActor,
        entityId: archivedCategory.id,
        action: "update",
        previousState: existingCategory,
        newState: archivedCategory,
      });
    });

    if (archivedCategory) {
      revalidateCategories();
      redirect(buildCategoriesRedirectUrl({ archived: 1 }));
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("Category archive fallback failed:", error);
  }

  revalidateCategories();
  redirect(
    buildCategoriesRedirectUrl({
      categoryAction: "error",
      categoryCode: "delete-failed",
    }),
  );
}

export async function createCategorySeeds() {
  const db = getDbOrThrow();

  try {
    const auditActor = await requireStrictAuditActor();
    let insertedRows: CategoryRecord[] = [];
    let updatedRows: CategoryRecord[] = [];

    await db.transaction(async (tx) => {
      const allCategories = (await tx
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
          status: categories.status,
          sortOrder: categories.sortOrder,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        })
        .from(categories)) as CategoryRecord[];
      const now = new Date();

      const getCurrentCategories = () => [...allCategories];
      const findCategoryBySlug = (slug: string) =>
        allCategories.find((category) => category.slug === slug) ?? null;
      const replaceCategory = (nextCategory: CategoryRecord) => {
        const index = allCategories.findIndex((item) => item.id === nextCategory.id);

        if (index >= 0) {
          allCategories[index] = nextCategory;
          return;
        }

        allCategories.push(nextCategory);
      };

      const findLegacyMatches = (seed: SeedCategory) => {
        return getCurrentCategories().filter((category) => {
          const categoryNameKey = getCategoryNameKey(category.name);
          return (
            seed.legacySlugs.includes(category.slug) ||
            seed.legacyNames.some(
              (legacyName) => getCategoryNameKey(legacyName) === categoryNameKey,
            )
          );
        });
      };

      for (const category of getCurrentCategories()) {
        if (isWeakFallbackCategory(category)) {
          console.error("createCategorySeeds safe mode skipped weak fallback category", {
            categoryId: category.id,
            slug: category.slug,
            name: category.name,
          });
        }
      }

      for (const item of seedCategories) {
        const canonicalCategory = findCategoryBySlug(item.slug);
        const legacyMatches = findLegacyMatches(item);
        const legacyCategory = legacyMatches[0] ?? null;

        if (canonicalCategory) {
          if (legacyMatches.some((category) => category.id !== canonicalCategory.id)) {
            console.error("createCategorySeeds safe mode skipped duplicate legacy match", {
              targetSlug: item.slug,
              targetName: item.name,
              duplicateCategoryIds: legacyMatches
                .filter((category) => category.id !== canonicalCategory.id)
                .map((category) => category.id),
            });
          }

          const requiresCanonicalUpdate =
            canonicalCategory.name !== item.name ||
            (canonicalCategory.icon ?? "folder") !== item.icon ||
            canonicalCategory.status !== "active" ||
            canonicalCategory.sortOrder !== item.sortOrder;

          if (!requiresCanonicalUpdate) {
            continue;
          }

          const updatedCanonicalRows = (await tx
            .update(categories)
            .set({
              name: item.name,
              icon: item.icon,
              status: "active",
              sortOrder: item.sortOrder,
              updatedAt: now,
            })
            .where(eq(categories.id, canonicalCategory.id))
            .returning({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
              icon: categories.icon,
              status: categories.status,
              sortOrder: categories.sortOrder,
              createdAt: categories.createdAt,
              updatedAt: categories.updatedAt,
            })) as CategoryRecord[];

          const updatedCanonical = updatedCanonicalRows[0];

          if (!updatedCanonical) {
            console.error("createCategorySeeds safe mode skipped canonical update", {
              categoryId: canonicalCategory.id,
              slug: canonicalCategory.slug,
            });
            continue;
          }

          updatedRows.push(updatedCanonical);
          replaceCategory(updatedCanonical);

          await writeCategoryAudit({
            database: tx,
            actor: auditActor,
            entityId: updatedCanonical.id,
            action: "update",
            previousState: canonicalCategory,
            newState: updatedCanonical,
          });

          continue;
        }

        if (legacyMatches.length > 1) {
          console.error("createCategorySeeds safe mode found multiple legacy candidates", {
            targetSlug: item.slug,
            targetName: item.name,
            categoryIds: legacyMatches.map((category) => category.id),
            legacySlugs: legacyMatches.map((category) => category.slug),
          });
        }

        if (legacyCategory) {
          const conflictingSlugHolder = findCategoryBySlug(item.slug);

          if (conflictingSlugHolder && conflictingSlugHolder.id !== legacyCategory.id) {
            console.error("createCategorySeeds safe mode skipped legacy normalization due to duplicate slug", {
              legacyCategoryId: legacyCategory.id,
              legacySlug: legacyCategory.slug,
              targetSlug: item.slug,
              conflictingCategoryId: conflictingSlugHolder.id,
            });
            continue;
          }

          const updatedLegacyRows = (await tx
            .update(categories)
            .set({
              name: item.name,
              slug: item.slug,
              icon: item.icon,
              status: "active",
              sortOrder: item.sortOrder,
              updatedAt: now,
            })
            .where(eq(categories.id, legacyCategory.id))
            .returning({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
              icon: categories.icon,
              status: categories.status,
              sortOrder: categories.sortOrder,
              createdAt: categories.createdAt,
              updatedAt: categories.updatedAt,
            })) as CategoryRecord[];

          const updatedLegacyCategory = updatedLegacyRows[0];

          if (!updatedLegacyCategory) {
            console.error("createCategorySeeds safe mode skipped legacy update", {
              legacyCategoryId: legacyCategory.id,
              legacySlug: legacyCategory.slug,
              targetSlug: item.slug,
            });
            continue;
          }

          updatedRows.push(updatedLegacyCategory);
          replaceCategory(updatedLegacyCategory);

          await writeCategoryAudit({
            database: tx,
            actor: auditActor,
            entityId: updatedLegacyCategory.id,
            action: "update",
            previousState: legacyCategory,
            newState: updatedLegacyCategory,
          });

          continue;
        }

        const duplicateSlugHolder = findCategoryBySlug(item.slug);

        if (duplicateSlugHolder) {
          console.error("createCategorySeeds safe mode skipped insert due to duplicate slug", {
            targetSlug: item.slug,
            targetName: item.name,
            categoryId: duplicateSlugHolder.id,
          });
          continue;
        }

        try {
          const created = (await tx
            .insert(categories)
            .values({
              id: uuidv4(),
              name: item.name,
              slug: item.slug,
              icon: item.icon,
              status: "active" as const,
              sortOrder: item.sortOrder,
              createdAt: now,
              updatedAt: now,
            })
            .returning({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
              icon: categories.icon,
              status: categories.status,
              sortOrder: categories.sortOrder,
              createdAt: categories.createdAt,
              updatedAt: categories.updatedAt,
            })) as CategoryRecord[];

          const insertedCategory = created[0];

          if (!insertedCategory) {
            console.error("createCategorySeeds safe mode insert returned empty result", {
              targetSlug: item.slug,
              targetName: item.name,
            });
            continue;
          }

          insertedRows.push(insertedCategory);
          replaceCategory(insertedCategory);

          await writeCategoryAudit({
            database: tx,
            actor: auditActor,
            entityId: insertedCategory.id,
            action: "create",
            newState: insertedCategory,
          });
        } catch (error) {
          console.error("createCategorySeeds safe mode skipped insert", {
            targetSlug: item.slug,
            targetName: item.name,
            error,
          });
        }
      }
    });

    revalidateCategories();
    redirect(
      buildCategoriesRedirectUrl({
        seeded: insertedRows.length,
        synced: updatedRows.length,
      }),
    );
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const categoryCode = logCategorySyncError(error);
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode,
      }),
    );
  }
}
