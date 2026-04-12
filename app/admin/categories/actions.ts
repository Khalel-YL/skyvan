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

const seedCategories = [
  { name: "Electrical", slug: "electrical", icon: "bolt", sortOrder: 10 },
  { name: "Water", slug: "water", icon: "droplet", sortOrder: 20 },
  { name: "Furniture", slug: "furniture", icon: "sofa", sortOrder: 30 },
  { name: "Kitchen", slug: "kitchen", icon: "chef-hat", sortOrder: 40 },
  { name: "Bathroom", slug: "bathroom", icon: "bath", sortOrder: 50 },
  { name: "Windows", slug: "windows", icon: "square", sortOrder: 60 },
  { name: "Seating", slug: "seating", icon: "armchair", sortOrder: 70 },
  { name: "Sleeping", slug: "sleeping", icon: "bed", sortOrder: 80 },
];

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
        "Session-bound audit actor çözülemediği için kategori kaydı güvenli şekilde tamamlanamadı.",
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

  const existing = await db
    .select({
      slug: categories.slug,
    })
    .from(categories);

  const existingSlugs = new Set(existing.map((item) => item.slug));

  const missing = seedCategories.filter((item) => !existingSlugs.has(item.slug));

  if (missing.length === 0) {
    redirect(buildCategoriesRedirectUrl({ seeded: 0 }));
  }

  const now = new Date();

  try {
    const auditActor = await requireStrictAuditActor();
    let insertedRows: CategoryRecord[] = [];

    await db.transaction(async (tx) => {
      insertedRows = (await tx
        .insert(categories)
        .values(
          missing.map((item) => ({
            id: uuidv4(),
            name: item.name,
            slug: item.slug,
            icon: item.icon,
            status: "active" as const,
            sortOrder: item.sortOrder,
            createdAt: now,
            updatedAt: now,
          })),
        )
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

      for (const insertedCategory of insertedRows) {
        await writeCategoryAudit({
          database: tx,
          actor: auditActor,
          entityId: insertedCategory.id,
          action: "create",
          newState: insertedCategory,
        });
      }
    });

    revalidateCategories();
    redirect(buildCategoriesRedirectUrl({ seeded: insertedRows.length }));
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    if (error instanceof AuditActorBindingError) {
      redirect(
        buildCategoriesRedirectUrl({
          categoryAction: "error",
          categoryCode: "seed-failed",
        }),
      );
    }

    console.error("createCategorySeeds error:", error);
    redirect(
      buildCategoriesRedirectUrl({
        categoryAction: "error",
        categoryCode: "seed-failed",
      }),
    );
  }
}
