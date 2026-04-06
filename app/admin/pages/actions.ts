"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ilike, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

type PageContentBlock = {
  type: string;
  heading?: string;
  subtext?: string;
  body?: string;
};

type PageContentJson = {
  isPublished?: boolean;
  blocks?: PageContentBlock[];
};

export type PageFormState = {
  ok: boolean;
  message: string;
  values: {
    id: string;
    entityId: string;
    locale: string;
    title: string;
    slug: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    contentJson: string;
    isPublished: boolean;
  };
  errors?: {
    locale?: string;
    title?: string;
    slug?: string;
    contentJson?: string;
    form?: string;
  };
};

function createInitialValues(
  values?: Partial<PageFormState["values"]>,
): PageFormState["values"] {
  return {
    id: values?.id ?? "",
    entityId: values?.entityId ?? "",
    locale: values?.locale ?? "tr",
    title: values?.title ?? "",
    slug: values?.slug ?? "",
    description: values?.description ?? "",
    seoTitle: values?.seoTitle ?? "",
    seoDescription: values?.seoDescription ?? "",
    contentJson: values?.contentJson ?? "",
    isPublished: values?.isPublished ?? true,
  };
}

function getTrimmed(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeLocale(value: string) {
  return value.toLowerCase().replace(/_/g, "-").trim();
}

function normalizeSlug(value: string) {
  return value
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
    .replace(/^-|-$/g, "");
}

function parseContentJson(raw: string, title: string): {
  value: PageContentJson;
  error?: string;
} {
  if (!raw) {
    return {
      value: {
        blocks: [
          {
            type: "hero",
            heading: title,
            subtext: "Skyvan",
          },
        ],
      },
    };
  }

  try {
    const parsed = JSON.parse(raw) as PageContentJson;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        value: { blocks: [] },
        error: "İçerik JSON alanı geçerli bir obje olmalı.",
      };
    }

    return { value: parsed };
  } catch {
    return {
      value: { blocks: [] },
      error: "İçerik JSON alanı geçerli JSON formatında değil.",
    };
  }
}

export async function savePage(
  prevState: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const entityIdInput = getTrimmed(formData, "entityId");
  const locale = normalizeLocale(getTrimmed(formData, "locale"));
  const title = getTrimmed(formData, "title");
  const slug = normalizeSlug(getTrimmed(formData, "slug"));
  const description = getTrimmed(formData, "description");
  const seoTitle = getTrimmed(formData, "seoTitle");
  const seoDescription = getTrimmed(formData, "seoDescription");
  const rawContentJson = getTrimmed(formData, "contentJson");
  const isPublished = formData.get("isPublished") === "on";

  const values = createInitialValues({
    id,
    entityId: entityIdInput,
    locale,
    title,
    slug,
    description,
    seoTitle,
    seoDescription,
    contentJson: rawContentJson,
    isPublished,
  });

  const errors: NonNullable<PageFormState["errors"]> = {};

  if (!locale) {
    errors.locale = "Locale zorunludur.";
  }

  if (!title) {
    errors.title = "Başlık zorunludur.";
  }

  if (!slug) {
    errors.slug = "Slug zorunludur.";
  }

  const parsedContent = parseContentJson(rawContentJson, title);

  if (parsedContent.error) {
    errors.contentJson = parsedContent.error;
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Form alanlarını kontrol et.",
      values,
      errors,
    };
  }

  const entityId = entityIdInput || uuidv4();

  const slugConflict = await db
    .select({ id: localizedContent.id })
    .from(localizedContent)
    .where(
      and(
        eq(localizedContent.entityType, "page"),
        eq(localizedContent.locale, locale),
        ilike(localizedContent.slug, slug),
        id ? ne(localizedContent.id, id) : undefined,
      ),
    )
    .limit(1);

  if (slugConflict.length > 0) {
    return {
      ok: false,
      message: "Aynı locale içinde bu slug zaten kullanılıyor.",
      values,
      errors: {
        slug: "Bu locale için slug zaten kayıtlı.",
      },
    };
  }

  const payload = {
    locale,
    title,
    slug,
    description: description || null,
    seoTitle: seoTitle || null,
    seoDescription: seoDescription || null,
    contentJson: {
      ...parsedContent.value,
      isPublished,
    },
  };

  if (id) {
    const localeConflict = await db
      .select({ id: localizedContent.id })
      .from(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, "page"),
          eq(localizedContent.entityId, entityId),
          eq(localizedContent.locale, locale),
          ne(localizedContent.id, id),
        ),
      )
      .limit(1);

    if (localeConflict.length > 0) {
      return {
        ok: false,
        message: "Aynı sayfa için bu locale zaten var.",
        values,
        errors: {
          locale: "Bu locale kaydı zaten mevcut.",
        },
      };
    }

    await db
      .update(localizedContent)
      .set(payload)
      .where(eq(localizedContent.id, id));
  } else {
    await db.insert(localizedContent).values({
      id: uuidv4(),
      entityType: "page",
      entityId,
      ...payload,
    });
  }

  revalidatePath("/admin/pages");

  return {
    ok: true,
    message: id ? "Sayfa kaydı güncellendi." : "Yeni sayfa kaydı oluşturuldu.",
    values: createInitialValues(),
    errors: {},
  };
}

export async function deletePage(id: string) {
  const db = getDbOrThrow();

  await db.delete(localizedContent).where(eq(localizedContent.id, id));

  revalidatePath("/admin/pages");
}

export async function repairPageSlug(id: string, fallbackTitle: string) {
  const db = getDbOrThrow();

  const normalized = normalizeSlug(fallbackTitle);

  if (!normalized) {
    throw new Error("Slug onarımı için geçerli başlık bulunamadı.");
  }

  await db
    .update(localizedContent)
    .set({ slug: normalized })
    .where(eq(localizedContent.id, id));

  revalidatePath("/admin/pages");
}