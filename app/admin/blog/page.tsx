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
        !slug ? "Slug eksik" : null,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · Blog
          </div>

          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-zinc-100">
              <FileText className="h-6 w-6 text-amber-400" />
              Blog & İçerik Stüdyosu
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Editoryal yayınları, hazırlık durumunu ve public görünürlüğü tek
              merkezden yönet.
            </p>
          </div>
        </div>

        {db ? (
          <Link
            href="/admin/blog?new=true"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            <PenTool className="h-4 w-4" />
            Yeni Makale
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-500"
          >
            Veritabanı gerekli
          </button>
        )}
      </div>

        {actionFeedback ? (
          <div className={`rounded-2xl border p-4 text-sm ${toneClasses(actionFeedback.tone)}`}>
            {actionFeedback.message}
          </div>
        ) : null}

        {!db ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            {dbHealth.note}
          </div>
        ) : null}

        {queryWarning ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            {queryWarning}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Toplam içerik
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{allArticles.length}</p>
            <p className="mt-2 text-xs text-zinc-500">Kayıtlı blog sayısı</p>
          </div>

          <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5 text-sky-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/80">
              Yayında
            </p>
            <p className="mt-3 text-3xl font-semibold">{publishedCount}</p>
            <p className="mt-2 text-xs text-sky-300/80">Public yüzeye açık içerik</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Taslak
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{draftCount}</p>
            <p className="mt-2 text-xs text-zinc-500">Henüz yayına alınmamış içerik</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Yapısal olarak hazır
            </p>
            <p className="mt-3 text-3xl font-semibold">{readyCount}</p>
            <p className="mt-2 text-xs text-emerald-300/80">
              Slug + kapak + yeterli içerik
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-zinc-900 p-3 text-amber-400">
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Editoryal kontrol notu
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Bu yüzey gerçek yayın durumunu ve içerik hazırlığını gösterir.
                  Bu fazda AI yazarı veya sahte SEO skoru kullanılmaz. İçerik
                  kararları editoryal olarak verilir, kayıtlar audit ile izlenir.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              İçerik hacmi
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">{totalWordCount}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Blog yüzeyinde kayıtlı toplam kelime sayısı. Trafik veya SEO için
              simüle metrik üretilmez.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {allArticles.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-800 p-16 text-center text-zinc-500">
              <FileText className="h-12 w-12 opacity-25" />
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
                  className="rounded-[2rem] border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg transition hover:border-zinc-700"
                >
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-5">
                      {article.blogContent.coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={article.blogContent.coverImage}
                          alt={article.title}
                          className="h-24 w-24 shrink-0 rounded-2xl border border-zinc-800 object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-700">
                          <ImageOff className="h-7 w-7" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-white">
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

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-zinc-400">
                          <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                            /{article.effectiveSlug || "slug-yok"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                            <Type className="h-3 w-3" />
                            {article.wordCount} kelime
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                            <CalendarClock className="h-3 w-3" />
                            {formatDate(article.blogContent.publishDate)}
                          </span>
                        </div>

                        {summary ? (
                          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
                            {summary}
                          </p>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-300">
                            <FileText className="h-3 w-3" />
                            {article.readTime} dk okuma
                          </span>

                          {article.readinessIssues.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                              <CheckCircle2 className="h-3 w-3" />
                              Yapısal olarak hazır
                            </span>
                          ) : (
                            article.readinessIssues.map((issue) => (
                              <span
                                key={issue}
                                className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-200"
                              >
                                <ShieldAlert className="h-3 w-3" />
                                {issue}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/blog?edit=${article.id}`}
                        className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                      >
                        Düzenle
                      </Link>

                      <form action={deleteBlogPost.bind(null, article.id)}>
                        <button className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400/40 hover:bg-rose-500/15">
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
