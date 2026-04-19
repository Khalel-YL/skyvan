"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDbOrThrow } from "@/db/db";
import { categories, manufacturerSourceRegistries, products } from "@/db/schema";
import { alignLegacyActiveProducts } from "../../actions";

import {
  createProductSourceBindingSchema,
  productSourceBindingFiltersSchema,
} from "./schema";
import { productSourceBindings } from "./table";
import type {
  ManufacturerSourceBindingOption,
  ProductSourceBindingActionState,
  ProductSourceBindingFilters,
  ProductSourceBindingListItem,
  ProductSourceBindingsPageProduct,
} from "./types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function db() {
  return getDbOrThrow();
}

function isValidUuid(value: string) {
  return UUID_REGEX.test(value);
}

function emptyToNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normalizePathHint(input?: string | null) {
  let value = String(input ?? "").trim();

  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      value = `${url.pathname}${url.search}`.trim();
    } catch {
      // parse edilemezse ham metinle devam
    }
  }

  value = value.replace(/\s+/g, " ");
  value = value.replace(/\/{2,}/g, "/");

  if (value === "/") {
    return "";
  }

  if (value && !value.startsWith("/")) {
    value = `/${value}`;
  }

  return value;
}

export async function getProductSourceBindingsPageProduct(
  productId: string,
): Promise<ProductSourceBindingsPageProduct | null> {
  if (!isValidUuid(productId)) {
    return null;
  }

  await alignLegacyActiveProducts([productId]);

  const [row] = await db()
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      status: products.status,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, productId))
    .limit(1);

  return row ?? null;
}

export async function getManufacturerSourceBindingOptions(): Promise<
  ManufacturerSourceBindingOption[]
> {
  const rows = await db()
    .select({
      id: manufacturerSourceRegistries.id,
      manufacturerName: manufacturerSourceRegistries.manufacturerName,
      domain: manufacturerSourceRegistries.domain,
      normalizedDomain: manufacturerSourceRegistries.normalizedDomain,
      allowedContentTypes: manufacturerSourceRegistries.allowedContentTypes,
      defaultFetchMode: manufacturerSourceRegistries.defaultFetchMode,
    })
    .from(manufacturerSourceRegistries)
    .where(eq(manufacturerSourceRegistries.status, "active"))
    .orderBy(
      asc(manufacturerSourceRegistries.manufacturerName),
      asc(manufacturerSourceRegistries.domain),
    );

  return rows.map((row) => ({
    ...row,
    allowedContentTypes: Array.isArray(row.allowedContentTypes)
      ? (row.allowedContentTypes as string[])
      : [],
  }));
}

export async function getProductSourceBindings(
  productId: string,
  filtersInput?: Partial<ProductSourceBindingFilters>,
): Promise<ProductSourceBindingListItem[]> {
  if (!isValidUuid(productId)) {
    return [];
  }

  const filters = productSourceBindingFiltersSchema.parse({
    q: filtersInput?.q ?? "",
    status: filtersInput?.status ?? "active",
  });

  const whereClauses = [eq(productSourceBindings.productId, productId)];

  if (filters.status !== "all") {
    whereClauses.push(eq(productSourceBindings.status, filters.status));
  }

  if (filters.q) {
    whereClauses.push(
      or(
        ilike(manufacturerSourceRegistries.manufacturerName, `%${filters.q}%`),
        ilike(manufacturerSourceRegistries.domain, `%${filters.q}%`),
        ilike(manufacturerSourceRegistries.normalizedDomain, `%${filters.q}%`),
        ilike(productSourceBindings.pathHint, `%${filters.q}%`),
        ilike(productSourceBindings.bindingNotes, `%${filters.q}%`),
      )!,
    );
  }

  const rows = await db()
    .select({
      id: productSourceBindings.id,
      productId: productSourceBindings.productId,
      manufacturerSourceRegistryId:
        productSourceBindings.manufacturerSourceRegistryId,
      manufacturerName: manufacturerSourceRegistries.manufacturerName,
      domain: manufacturerSourceRegistries.domain,
      normalizedDomain: manufacturerSourceRegistries.normalizedDomain,
      allowedContentTypes: manufacturerSourceRegistries.allowedContentTypes,
      defaultFetchMode: manufacturerSourceRegistries.defaultFetchMode,
      pathHint: productSourceBindings.pathHint,
      bindingNotes: productSourceBindings.bindingNotes,
      priority: productSourceBindings.priority,
      status: productSourceBindings.status,
      createdAt: productSourceBindings.createdAt,
      updatedAt: productSourceBindings.updatedAt,
    })
    .from(productSourceBindings)
    .innerJoin(
      manufacturerSourceRegistries,
      eq(
        productSourceBindings.manufacturerSourceRegistryId,
        manufacturerSourceRegistries.id,
      ),
    )
    .where(and(...whereClauses))
    .orderBy(
      asc(productSourceBindings.priority),
      desc(productSourceBindings.updatedAt),
      asc(manufacturerSourceRegistries.manufacturerName),
    );

  return rows.map((row) => ({
    ...row,
    allowedContentTypes: Array.isArray(row.allowedContentTypes)
      ? (row.allowedContentTypes as string[])
      : [],
  })) as ProductSourceBindingListItem[];
}

export async function createProductSourceBinding(
  _prevState: ProductSourceBindingActionState,
  formData: FormData,
): Promise<ProductSourceBindingActionState> {
  const parsed = createProductSourceBindingSchema.safeParse({
    productId: formData.get("productId"),
    manufacturerSourceRegistryId: formData.get("manufacturerSourceRegistryId"),
    pathHint: formData.get("pathHint"),
    bindingNotes: formData.get("bindingNotes"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bağ kaydı oluşturulamadı.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const normalizedPathHint = normalizePathHint(data.pathHint);

  const [product] = await db()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, data.productId))
    .limit(1);

  if (!product) {
    return {
      ok: false,
      message: "Ürün kaydı bulunamadı.",
      errors: {
        productId: ["Geçerli ürün kaydı bulunamadı."],
      },
    };
  }

  const [source] = await db()
    .select({
      id: manufacturerSourceRegistries.id,
      status: manufacturerSourceRegistries.status,
    })
    .from(manufacturerSourceRegistries)
    .where(eq(manufacturerSourceRegistries.id, data.manufacturerSourceRegistryId))
    .limit(1);

  if (!source) {
    return {
      ok: false,
      message: "Kaynak kaydı bulunamadı.",
      errors: {
        manufacturerSourceRegistryId: ["Seçilen kaynak bulunamadı."],
      },
    };
  }

  if (source.status === "archived") {
    return {
      ok: false,
      message: "Arşivdeki bir kaynak bağlanamaz.",
      errors: {
        manufacturerSourceRegistryId: ["Arşivdeki kaynak seçilemez."],
      },
    };
  }

  const [duplicate] = await db()
    .select({ id: productSourceBindings.id })
    .from(productSourceBindings)
    .where(
      and(
        eq(productSourceBindings.productId, data.productId),
        eq(
          productSourceBindings.manufacturerSourceRegistryId,
          data.manufacturerSourceRegistryId,
        ),
        eq(productSourceBindings.pathHint, normalizedPathHint),
      ),
    )
    .limit(1);

  if (duplicate) {
    return {
      ok: false,
      message: "Aynı ürün, kaynak ve path hint kombinasyonu zaten mevcut.",
      errors: {
        manufacturerSourceRegistryId: ["Bu kaynak zaten aynı path ile bağlı."],
        pathHint: ["Bu path hint için tekrar kayıt açılamaz."],
      },
    };
  }

  await db().insert(productSourceBindings).values({
    productId: data.productId,
    manufacturerSourceRegistryId: data.manufacturerSourceRegistryId,
    pathHint: normalizedPathHint,
    bindingNotes: emptyToNull(data.bindingNotes),
    priority: data.priority,
    status: data.status,
    updatedAt: new Date(),
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${data.productId}/sources`);

  return {
    ok: true,
    message: "Kaynak bağı başarıyla oluşturuldu.",
  };
}

export async function updateProductSourceBinding(
  _prevState: ProductSourceBindingActionState,
  formData: FormData,
): Promise<ProductSourceBindingActionState> {
  const bindingId = String(formData.get("id") ?? "").trim();

  if (!isValidUuid(bindingId)) {
    return {
      ok: false,
      message: "Geçerli binding kaydı bulunamadı.",
      errors: {
        id: ["Geçerli binding kaydı zorunlu."],
      },
    };
  }

  const parsed = createProductSourceBindingSchema.safeParse({
    productId: formData.get("productId"),
    manufacturerSourceRegistryId: formData.get("manufacturerSourceRegistryId"),
    pathHint: formData.get("pathHint"),
    bindingNotes: formData.get("bindingNotes"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Bağ kaydı güncellenemedi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const normalizedPathHint = normalizePathHint(data.pathHint);

  const [existing] = await db()
    .select({
      id: productSourceBindings.id,
      productId: productSourceBindings.productId,
    })
    .from(productSourceBindings)
    .where(eq(productSourceBindings.id, bindingId))
    .limit(1);

  if (!existing) {
    return {
      ok: false,
      message: "Düzenlenecek binding kaydı bulunamadı.",
      errors: {
        id: ["Binding kaydı bulunamadı."],
      },
    };
  }

  const [source] = await db()
    .select({
      id: manufacturerSourceRegistries.id,
      status: manufacturerSourceRegistries.status,
    })
    .from(manufacturerSourceRegistries)
    .where(eq(manufacturerSourceRegistries.id, data.manufacturerSourceRegistryId))
    .limit(1);

  if (!source) {
    return {
      ok: false,
      message: "Kaynak kaydı bulunamadı.",
      errors: {
        manufacturerSourceRegistryId: ["Seçilen kaynak bulunamadı."],
      },
    };
  }

  if (source.status === "archived" && data.status !== "archived") {
    return {
      ok: false,
      message: "Arşivdeki kaynak aktif veya taslak bağ olarak tutulamaz.",
      errors: {
        manufacturerSourceRegistryId: ["Arşivdeki kaynak yalnızca arşiv bağ olabilir."],
      },
    };
  }

  const [duplicate] = await db()
    .select({ id: productSourceBindings.id })
    .from(productSourceBindings)
    .where(
      and(
        eq(productSourceBindings.productId, data.productId),
        eq(
          productSourceBindings.manufacturerSourceRegistryId,
          data.manufacturerSourceRegistryId,
        ),
        eq(productSourceBindings.pathHint, normalizedPathHint),
      ),
    )
    .limit(1);

  if (duplicate && duplicate.id !== bindingId) {
    return {
      ok: false,
      message: "Aynı ürün, kaynak ve path hint kombinasyonu zaten mevcut.",
      errors: {
        manufacturerSourceRegistryId: ["Bu kaynak zaten aynı path ile bağlı."],
        pathHint: ["Bu path hint için tekrar kayıt açılamaz."],
      },
    };
  }

  await db()
    .update(productSourceBindings)
    .set({
      manufacturerSourceRegistryId: data.manufacturerSourceRegistryId,
      pathHint: normalizedPathHint,
      bindingNotes: emptyToNull(data.bindingNotes),
      priority: data.priority,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(productSourceBindings.id, bindingId));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${existing.productId}/sources`);

  return {
    ok: true,
    message: "Kaynak bağı güncellendi.",
  };
}

export async function archiveProductSourceBinding(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();

  if (!isValidUuid(id)) {
    return;
  }

  await db()
    .update(productSourceBindings)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(eq(productSourceBindings.id, id));

  revalidatePath("/admin/products");

  if (isValidUuid(productId)) {
    revalidatePath(`/admin/products/${productId}/sources`);
  }
}

export async function restoreProductSourceBinding(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();

  if (!isValidUuid(id)) {
    return;
  }

  await db()
    .update(productSourceBindings)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(productSourceBindings.id, id));

  revalidatePath("/admin/products");

  if (isValidUuid(productId)) {
    revalidatePath(`/admin/products/${productId}/sources`);
  }
}
