import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Globe,
  ImageOff,
  Lock,
  PenTool,
  ShieldAlert,
  Type,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { localizedContent } from "@/db/schema";

import AddBlogDrawer from "./AddBlogDrawer";
import { deleteBlogPost } from "./actions";

type BlogSearchParams = Promise<{
  new?: string;
  edit?: string;
  blogAction?: string;
  blogMessage?: string;
}>;

type BlogContentJson = {
  slug?: string;
  coverImage?: string;
  content?: string;
  isPublished?: boolean;
  readTime?: number;
  wordCount?: number;
  publishDate?: string | null;
  updatedAt?: string;
};

type BlogListItem = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  locale: string;
  contentJson: unknown;
};

function parseContentJson(value: unknown): BlogContentJson {
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
        : undefined,
    wordCount:
      typeof raw.wordCount === "number" && Number.isFinite(raw.wordCount)
        ? raw.wordCount
        : undefined,
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

function getWordCount(content: string) {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Henüz tarih yok";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih okunamadı";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getActionFeedback(params: Awaited<BlogSearchParams>) {
  if (params.blogAction === "saved") {
    return {
      tone: "success" as const,
      message: "Blog kaydı oluşturuldu.",
    };
  }

  if (params.blogAction === "updated") {
    return {
      tone: "success" as const,
      message: "Blog kaydı güncellendi.",
    };
  }

  if (params.blogAction === "deleted") {
    return {
      tone: "success" as const,
      message: "Blog kaydı silindi.",
    };
  }

  if (params.blogAction === "error") {
    return {
      tone: "error" as const,
      message: params.blogMessage || "Blog işlemi tamamlanamadı.",
    };
  }

  return null;
}

function toneClasses(tone: "success" | "error") {
  return tone === "success"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-rose-500/20 bg-rose-500/10 text-rose-100";
}

function StatChip({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${className}`}
    >
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-zinc-100">{value}</span>
    </span>
  );
}

export default async function BlogDashboard({
  searchParams,
}: {
  searchParams: BlogSearchParams;
}) {
  const params = await searchParams;
  const dbHealth = getDatabaseHealth();
  let queryWarning: string | null = null;
  let rawArticles: BlogListItem[] = [];

  if (db) {
    try {
      rawArticles = (await db
        .select({
          id: localizedContent.id,
          title: localizedContent.title,
          slug: localizedContent.slug,
          description: localizedContent.description,
          locale: localizedContent.locale,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(eq(localizedContent.entityType, "blog"))) as BlogListItem[];
    } catch (error) {
      console.error("blog page query error:", error);
      queryWarning =
        "Blog kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const allArticles = rawArticles
    .map((article) => {
      const content = parseContentJson(article.contentJson);
      const wordCount = content.wordCount ?? getWordCount(content.content ?? "");
      const readTime = content.readTime ?? Math.max(Math.ceil(wordCount / 200), 1);
      const slug = article.slug || content.slug || "";
      const readinessIssues = [
        !slug ? "Yayın adresi eksik" : null,
        !content.coverImage ? "Kapak görseli yok" : null,
        wordCount < 120 ? "İçerik kısa" : null,
      ].filter(Boolean) as string[];

      return {
        ...article,
        blogContent: content,
        effectiveSlug: slug,
        wordCount,
        readTime,
        readinessIssues,
      };
    })
    .sort((left, right) => {
      const leftDate = new Date(
        left.blogContent.publishDate ||
          left.blogContent.updatedAt ||
          "1970-01-01T00:00:00.000Z",
      ).getTime();
      const rightDate = new Date(
        right.blogContent.publishDate ||
          right.blogContent.updatedAt ||
          "1970-01-01T00:00:00.000Z",
      ).getTime();

      return rightDate - leftDate;
    });

  const editData = params.edit
    ? allArticles.find((article) => article.id === params.edit) ?? null
    : null;
  const isDrawerOpen = params.new === "true" || Boolean(editData);
  const actionFeedback = getActionFeedback(params);
  const publishedCount = allArticles.filter(
    (article) => article.blogContent.isPublished,
  ).length;
  const draftCount = Math.max(allArticles.length - publishedCount, 0);
  const readyCount = allArticles.filter(
    (article) => article.readinessIssues.length === 0,
  ).length;
  const totalWordCount = allArticles.reduce(
    (total, article) => total + article.wordCount,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Blog
          </div>

          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-100">
              <FileText className="h-5 w-5 text-amber-400" />
              Blog & İçerik Stüdyosu
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-zinc-400">
              Editoryal yayınları, hazırlık durumunu ve public görünürlüğü tek
              merkezden yönet.
            </p>
          </div>
        </div>

        {db ? (
          <Link
            href="/admin/blog?new=true"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            <PenTool className="h-4 w-4" />
            Yeni Makale
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-500"
          >
            Veritabanı gerekli
          </button>
        )}
      </div>

        {actionFeedback ? (
          <div className={`rounded-2xl border px-3 py-2 text-sm ${toneClasses(actionFeedback.tone)}`}>
            {actionFeedback.message}
          </div>
        ) : null}

        {!db ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {dbHealth.note}
          </div>
        ) : null}

        {queryWarning ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {queryWarning}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <StatChip
            label="Toplam"
            value={allArticles.length}
            className="border-zinc-700 bg-zinc-900"
          />
          <StatChip
            label="Yayında"
            value={publishedCount}
            className="border-sky-800 bg-sky-950/50"
          />
          <StatChip
            label="Taslak"
            value={draftCount}
            className="border-zinc-700 bg-zinc-900"
          />
          <StatChip
            label="Hazır"
            value={readyCount}
            className="border-emerald-800 bg-emerald-950/50"
          />
          <StatChip
            label="Kelime"
            value={totalWordCount}
            className="border-zinc-700 bg-zinc-900"
          />
        </div>

        <div className="space-y-2">
          {allArticles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              <FileText className="h-8 w-8 opacity-25" />
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">
                  Henüz blog kaydı yok
                </p>
                <p className="mt-2 text-xs">
                  İlk içerik kaydı oluşturulduğunda bu alan gerçek yayın durumu ve
                  hazırlık bilgisi göstermeye başlayacak.
                </p>
              </div>
            </div>
          ) : (
            allArticles.map((article) => {
              const summary =
                article.description ||
                (article.blogContent.content || "").slice(0, 180).trim();

              return (
                <div
                  key={article.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 transition hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {article.blogContent.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={article.blogContent.coverImage}
                          alt={article.title}
                          className="h-16 w-16 shrink-0 rounded-xl border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-700">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">
                            {article.title}
                          </h3>

                          {article.blogContent.isPublished ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                              <Globe className="h-3 w-3" />
                              Yayında
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                              <Lock className="h-3 w-3" />
                              Taslak
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-zinc-400">
                          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5">
                            /{article.effectiveSlug || "adres-yok"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5">
                            <Type className="h-3 w-3" />
                            {article.wordCount} kelime
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5">
                            <CalendarClock className="h-3 w-3" />
                            {formatDate(article.blogContent.publishDate)}
                          </span>
                        </div>

                        {summary ? (
                          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                            {summary}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-300">
                            <FileText className="h-3 w-3" />
                            {article.readTime} dk okuma
                          </span>

                          {article.readinessIssues.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Yapısal olarak hazır
                            </span>
                          ) : (
                            article.readinessIssues.map((issue) => (
                              <span
                                key={issue}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200"
                              >
                                <ShieldAlert className="h-3 w-3" />
                                {issue}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
                      <Link
                        href={`/admin/blog?edit=${article.id}`}
                        className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                      >
                        Düzenle
                      </Link>

                      <form action={deleteBlogPost.bind(null, article.id)}>
                        <button className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/15">
                          Sil
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      {isDrawerOpen ? (
        <>
          <Link
            href="/admin/blog"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-[640px] border-l border-zinc-800 shadow-2xl">
            <AddBlogDrawer
              initialData={editData}
              errorMessage={
                actionFeedback?.tone === "error" ? actionFeedback.message : null
              }
              disabled={!db}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
