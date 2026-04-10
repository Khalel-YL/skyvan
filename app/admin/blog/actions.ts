"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { writeAuditLog } from "@/app/lib/admin/audit";

type BlogContentJson = {
  slug: string;
  coverImage: string;
  content: string;
  isPublished: boolean;
  readTime: number;
  wordCount: number;
  publishDate: string | null;
  updatedAt: string;
};

type BlogRecord = {
  id: string;
  entityId: string;
  entityType: string;
  locale: string;
  title: string;
  slug: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  contentJson: unknown;
};

const BLOG_ENTITY_TYPE = "blog";
const BLOG_LOCALE = "tr";

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

function isTruthyValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

function isNextRedirectError(error: unknown) {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

function isSafeHttpUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function stripMarkdown(value: string) {
  return value
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function getReadTime(content: string) {
  const wordCount = getWordCount(content);
  return Math.max(Math.ceil(wordCount / 200), 1);
}

function getExcerpt(content: string, maxLength = 170) {
  const stripped = stripMarkdown(content);

  if (!stripped) {
    return "";
  }

  if (stripped.length <= maxLength) {
    return stripped;
  }

  return `${stripped.slice(0, maxLength - 1).trim()}…`;
}

function getBlogContent(value: unknown): Partial<BlogContentJson> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;

  return {
    slug: typeof raw.slug === "string" ? raw.slug : "",
    coverImage: typeof raw.coverImage === "string" ? raw.coverImage : "",
    content: typeof raw.content === "string" ? raw.content : "",
    isPublished: raw.isPublished === true,
    readTime:
      typeof raw.readTime === "number" && Number.isFinite(raw.readTime)
        ? raw.readTime
        : 1,
    wordCount:
      typeof raw.wordCount === "number" && Number.isFinite(raw.wordCount)
        ? raw.wordCount
        : getWordCount(typeof raw.content === "string" ? raw.content : ""),
    publishDate:
      typeof raw.publishDate === "string" && raw.publishDate.trim()
        ? raw.publishDate
        : null,
    updatedAt:
      typeof raw.updatedAt === "string" && raw.updatedAt.trim()
        ? raw.updatedAt
        : "",
  };
}

function buildBlogRedirectUrl(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/admin/blog?${query}` : "/admin/blog";
}

function buildBlogAuditState(record: BlogRecord) {
  const content = getBlogContent(record.contentJson);

  return {
    ...record,
    __meta: {
      publishState: content.isPublished ? "published" : "draft",
      readTime: content.readTime ?? 1,
      wordCount: content.wordCount ?? 0,
      publishDate: content.publishDate ?? null,
    },
  };
}

async function getBlogById(id: string): Promise<BlogRecord | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: localizedContent.id,
      entityId: localizedContent.entityId,
      entityType: localizedContent.entityType,
      locale: localizedContent.locale,
      title: localizedContent.title,
      slug: localizedContent.slug,
      description: localizedContent.description,
      seoTitle: localizedContent.seoTitle,
      seoDescription: localizedContent.seoDescription,
      contentJson: localizedContent.contentJson,
    })
    .from(localizedContent)
    .where(
      and(
        eq(localizedContent.entityType, BLOG_ENTITY_TYPE),
        eq(localizedContent.id, id),
      ),
    )
    .limit(1);

  return (rows[0] as BlogRecord | undefined) ?? null;
}

async function findBlogBySlug(slug: string, excludeId?: string) {
  const db = getDbOrThrow();

  const baseWhere = and(
    eq(localizedContent.entityType, BLOG_ENTITY_TYPE),
    eq(localizedContent.locale, BLOG_LOCALE),
    eq(localizedContent.slug, slug),
  );

  const rows = excludeId
    ? await db
        .select({ id: localizedContent.id })
        .from(localizedContent)
        .where(and(baseWhere, ne(localizedContent.id, excludeId)))
        .limit(1)
    : await db
        .select({ id: localizedContent.id })
        .from(localizedContent)
        .where(baseWhere)
        .limit(1);

  return rows[0] ?? null;
}

async function writeBlogAudit(input: {
  entityId: string;
  action: "create" | "update" | "delete";
  previousState?: unknown;
  newState?: unknown;
}) {
  try {
    const result = await writeAuditLog({
      entityType: BLOG_ENTITY_TYPE,
      entityId: input.entityId,
      action: input.action,
      previousState: input.previousState,
      newState: input.newState,
    });

    if (!result.ok || result.skipped) {
      console.warn("blog audit skipped:", {
        entityId: input.entityId,
        action: input.action,
        reason: result.reason,
      });
    }
  } catch (error) {
    console.warn("blog audit warning:", {
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

export async function saveBlogPost(formData: FormData) {
  const db = getDbOrThrow();

  const id = getTrimmed(formData, "id");
  const title = getTrimmed(formData, "title");
  const slug = normalizeSlug(getTrimmed(formData, "slug") || title);
  const coverImage = getTrimmed(formData, "coverImage");
  const content = String(formData.get("content") ?? "").trim();
  const isPublished = isTruthyValue(formData.get("isPublished"));
  const editorParams = id ? { edit: id } : { new: "true" };
  const existingBlog = id ? await getBlogById(id) : null;

  if (id && !existingBlog) {
    redirect(
      buildBlogRedirectUrl({
        blogAction: "error",
        blogMessage: "Düzenlenecek blog kaydı bulunamadı.",
      }),
    );
  }

  if (!title) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Blog başlığı zorunludur.",
      }),
    );
  }

  if (!slug) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Blog slug değeri zorunludur.",
      }),
    );
  }

  if (slug.length < 3) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Blog slug değeri en az 3 karakter olmalıdır.",
      }),
    );
  }

  if (!content) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Blog içeriği boş bırakılamaz.",
      }),
    );
  }

  if (!isSafeHttpUrl(coverImage)) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Kapak görseli URL alanı yalnızca http/https olabilir.",
      }),
    );
  }

  const duplicateSlug = await findBlogBySlug(slug, id || undefined);

  if (duplicateSlug) {
    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Bu blog slug değeri zaten kullanılıyor.",
      }),
    );
  }

  const previousContent = existingBlog ? getBlogContent(existingBlog.contentJson) : {};
  const wordCount = getWordCount(content);
  const readTime = getReadTime(content);
  const publishDate = isPublished
    ? previousContent.publishDate || new Date().toISOString()
    : null;
  const excerpt = getExcerpt(content);
  const contentJson: BlogContentJson = {
    slug,
    coverImage,
    content,
    isPublished,
    readTime,
    wordCount,
    publishDate,
    updatedAt: new Date().toISOString(),
  };
  const seoTitle = title.slice(0, 90).trim() || null;
  const seoDescription = excerpt || null;

  let savedAction: "saved" | "updated" = "saved";

  try {
    if (id && existingBlog) {
      const updatedRows = await db
        .update(localizedContent)
        .set({
          title,
          slug,
          description: excerpt || null,
          seoTitle,
          seoDescription,
          contentJson,
        })
        .where(
          and(
            eq(localizedContent.entityType, BLOG_ENTITY_TYPE),
            eq(localizedContent.id, id),
          ),
        )
        .returning({
          id: localizedContent.id,
          entityId: localizedContent.entityId,
          entityType: localizedContent.entityType,
          locale: localizedContent.locale,
          title: localizedContent.title,
          slug: localizedContent.slug,
          description: localizedContent.description,
          seoTitle: localizedContent.seoTitle,
          seoDescription: localizedContent.seoDescription,
          contentJson: localizedContent.contentJson,
        });

      const updatedBlog = (updatedRows[0] as BlogRecord | undefined) ?? null;

      if (!updatedBlog) {
        redirect(
          buildBlogRedirectUrl({
            ...editorParams,
            blogAction: "error",
            blogMessage: "Blog kaydı işlem sırasında güncellenemedi.",
          }),
        );
      }

      await writeBlogAudit({
        entityId: updatedBlog.id,
        action: "update",
        previousState: buildBlogAuditState(existingBlog),
        newState: buildBlogAuditState(updatedBlog),
      });

      savedAction = "updated";
    } else {
      const insertedRows = await db
        .insert(localizedContent)
        .values({
          id: uuidv4(),
          entityId: uuidv4(),
          entityType: BLOG_ENTITY_TYPE,
          locale: BLOG_LOCALE,
          title,
          slug,
          description: excerpt || null,
          seoTitle,
          seoDescription,
          contentJson,
        })
        .returning({
          id: localizedContent.id,
          entityId: localizedContent.entityId,
          entityType: localizedContent.entityType,
          locale: localizedContent.locale,
          title: localizedContent.title,
          slug: localizedContent.slug,
          description: localizedContent.description,
          seoTitle: localizedContent.seoTitle,
          seoDescription: localizedContent.seoDescription,
          contentJson: localizedContent.contentJson,
        });

      const insertedBlog = (insertedRows[0] as BlogRecord | undefined) ?? null;

      if (!insertedBlog) {
        redirect(
          buildBlogRedirectUrl({
            ...editorParams,
            blogAction: "error",
            blogMessage: "Blog kaydı oluşturulamadı.",
          }),
        );
      }

      await writeBlogAudit({
        entityId: insertedBlog.id,
        action: "create",
        newState: buildBlogAuditState(insertedBlog),
      });
    }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("saveBlogPost error:", error);

    redirect(
      buildBlogRedirectUrl({
        ...editorParams,
        blogAction: "error",
        blogMessage: "Blog kaydı işlenirken beklenmeyen bir hata oluştu.",
      }),
    );
  }

  revalidatePath("/admin/blog");
  redirect(buildBlogRedirectUrl({ blogAction: savedAction }));
}

export async function deleteBlogPost(id: string) {
  const db = getDbOrThrow();
  const normalizedId = String(id ?? "").trim();

  if (!normalizedId) {
    redirect(
      buildBlogRedirectUrl({
        blogAction: "error",
        blogMessage: "Silinecek blog kaydı kimliği bulunamadı.",
      }),
    );
  }

  const existingBlog = await getBlogById(normalizedId);

  if (!existingBlog) {
    redirect(
      buildBlogRedirectUrl({
        blogAction: "error",
        blogMessage: "Silinecek blog kaydı bulunamadı.",
      }),
    );
  }

  try {
    const deletedRows = await db
      .delete(localizedContent)
      .where(
        and(
          eq(localizedContent.entityType, BLOG_ENTITY_TYPE),
          eq(localizedContent.id, normalizedId),
        ),
      )
      .returning({
        id: localizedContent.id,
      });

    if (deletedRows.length === 0) {
      redirect(
        buildBlogRedirectUrl({
          blogAction: "error",
          blogMessage: "Blog kaydı işlem sırasında silinemedi.",
        }),
      );
    }

    await writeBlogAudit({
      entityId: existingBlog.id,
      action: "delete",
      previousState: buildBlogAuditState(existingBlog),
    });
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    console.error("deleteBlogPost error:", error);

    redirect(
      buildBlogRedirectUrl({
        blogAction: "error",
        blogMessage: "Blog kaydı silinirken beklenmeyen bir hata oluştu.",
      }),
    );
  }

  revalidatePath("/admin/blog");
  redirect(buildBlogRedirectUrl({ blogAction: "deleted" }));
}
