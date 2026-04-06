import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  Eye,
  FileText,
  Globe,
  Sparkles,
} from "lucide-react";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type PageContentBlock = {
  type?: string;
  heading?: string;
  subtext?: string;
  body?: string;
};

type PageContentJson = {
  isPublished?: boolean;
  blocks?: PageContentBlock[];
};

function parseContentJson(value: unknown): PageContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as PageContentJson;
}

export default async function PagePreview({ params }: Props) {
  const { id } = await params;
  const db = getDbOrThrow();

  const row = await db
    .select({
      id: localizedContent.id,
      title: localizedContent.title,
      slug: localizedContent.slug,
      locale: localizedContent.locale,
      description: localizedContent.description,
      seoTitle: localizedContent.seoTitle,
      seoDescription: localizedContent.seoDescription,
      contentJson: localizedContent.contentJson,
    })
    .from(localizedContent)
    .where(eq(localizedContent.id, id))
    .limit(1);

  const page = row[0];

  if (!page) {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
          <h1 className="text-2xl font-semibold">Sayfa bulunamadı</h1>
          <p className="mt-3 text-sm text-zinc-400">
            İstenen preview kaydı mevcut değil.
          </p>
          <Link
            href="/admin/pages"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Pages’e dön
          </Link>
        </div>
      </div>
    );
  }

  const content = parseContentJson(page.contentJson);
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const published = content.isPublished !== false;
  const hasSeo = Boolean(page.seoTitle?.trim() || page.seoDescription?.trim());

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/pages"
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Pages’e dön
            </Link>

            <Link
              href={`/admin/pages?edit=${page.id}`}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <Edit3 className="h-4 w-4" />
              Düzenle
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300">
            <Eye className="h-3.5 w-3.5" />
            Admin preview
          </div>
        </div>

        {!hasSeo ? (
          <div className="mb-6 rounded-2xl border border-amber-900/60 bg-amber-950/30 px-5 py-4 text-amber-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="text-sm font-medium">SEO alanları eksik</div>
                <div className="mt-1 text-xs text-amber-200/80">
                  Bu kayıt önizlenebilir durumda ama SEO başlığı ve açıklaması henüz
                  tanımlanmamış.
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <section className="rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              {page.locale}
            </span>
            <span>•</span>
            <span>/{page.slug || "-"}</span>
            <span>•</span>
            <span>{published ? "Yayında" : "Taslak"}</span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
            {page.title}
          </h1>

          {page.description ? (
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
              {page.description}
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <Globe className="h-3.5 w-3.5" />
                Locale
              </div>
              <div className="mt-3 text-sm text-white">{page.locale}</div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <FileText className="h-3.5 w-3.5" />
                Slug
              </div>
              <div className="mt-3 break-all font-mono text-sm text-white">
                /{page.slug || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5" />
                SEO
              </div>
              <div className="mt-3 text-sm text-white">
                {hasSeo ? "Hazır" : "Eksik"}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <FileText className="h-3.5 w-3.5" />
                Blok sayısı
              </div>
              <div className="mt-3 text-sm text-white">{blocks.length}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5" />
                SEO başlığı
              </div>
              <div className="mt-3 text-sm text-white">
                {page.seoTitle?.trim() || "Tanımlanmadı"}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                <Sparkles className="h-3.5 w-3.5" />
                SEO açıklaması
              </div>
              <div className="mt-3 text-sm text-white">
                {page.seoDescription?.trim() || "Tanımlanmadı"}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-zinc-800 bg-zinc-950/70 p-8">
          <div className="mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
            İçerik blokları
          </div>

          {blocks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/30 px-5 py-10 text-center text-sm text-zinc-500">
              Bu kayıt için blok tanımı bulunamadı.
            </div>
          ) : (
            <div className="space-y-4">
              {blocks.map((block, index) => (
                <div
                  key={`${block.type ?? "block"}-${index}`}
                  className="rounded-2xl border border-zinc-800 bg-black/30 p-5"
                >
                  <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                    {block.type || "block"}
                  </div>

                  {block.heading ? (
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {block.heading}
                    </h2>
                  ) : null}

                  {block.subtext ? (
                    <p className="mt-2 text-sm text-zinc-400">{block.subtext}</p>
                  ) : null}

                  {block.body ? (
                    <p className="mt-4 text-sm leading-7 text-zinc-300">
                      {block.body}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}