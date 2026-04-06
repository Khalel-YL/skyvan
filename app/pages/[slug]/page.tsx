import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  Sparkles,
  FileText,
} from "lucide-react";
import { notFound } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

type Props = {
  params: Promise<{
    slug: string;
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

async function getPublishedPageBySlug(slug: string) {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: localizedContent.id,
      entityId: localizedContent.entityId,
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
        eq(localizedContent.entityType, "page"),
        eq(localizedContent.slug, slug),
      ),
    )
    .limit(1);

  const page = rows[0];

  if (!page) {
    return null;
  }

  const content = parseContentJson(page.contentJson);

  if (content.isPublished === false) {
    return null;
  }

  return {
    ...page,
    content,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) {
    return {
      title: "Sayfa bulunamadı",
      description: "İstenen içerik bulunamadı.",
    };
  }

  const title = page.seoTitle?.trim() || page.title;
  const description =
    page.seoDescription?.trim() ||
    page.description?.trim() ||
    `${page.title} içeriğini görüntüleyin.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/pages/${page.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: page.locale,
      url: `/pages/${page.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function renderBlock(block: PageContentBlock, index: number) {
  const type = String(block.type ?? "block").toLowerCase();

  if (type === "hero") {
    return (
      <section
        key={`hero-${index}`}
        className="rounded-[32px] border border-zinc-800 bg-zinc-950/70 px-6 py-12 md:px-10 md:py-16"
      >
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            <Sparkles className="h-3.5 w-3.5" />
            Skyvan Page
          </div>

          {block.heading ? (
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white md:text-6xl">
              {block.heading}
            </h1>
          ) : null}

          {block.subtext ? (
            <p className="mt-4 text-lg text-zinc-300 md:text-xl">
              {block.subtext}
            </p>
          ) : null}

          {block.body ? (
            <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-400">
              {block.body}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      key={`block-${index}`}
      className="rounded-[28px] border border-zinc-800 bg-zinc-950/60 p-6 md:p-8"
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
        <p className="mt-3 text-sm text-zinc-400">{block.subtext}</p>
      ) : null}

      {block.body ? (
        <div className="mt-4 text-sm leading-7 text-zinc-300">{block.body}</div>
      ) : null}
    </section>
  );
}

export default async function PublicPageBySlug({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const blocks = Array.isArray(page.content.blocks) ? page.content.blocks : [];
  const hasSeo = Boolean(
    page.seoTitle?.trim() || page.seoDescription?.trim(),
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Ana sayfaya dön
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
              <Globe className="h-3.5 w-3.5" />
              {page.locale}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
              <FileText className="h-3.5 w-3.5" />
              /pages/{page.slug}
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                hasSeo
                  ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-200"
                  : "border-amber-900/60 bg-amber-950/40 text-amber-200"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {hasSeo ? "SEO hazır" : "SEO kısmen eksik"}
            </div>
          </div>
        </div>

        {blocks.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-zinc-800 bg-zinc-950/50 px-6 py-16 text-center">
            <h1 className="text-3xl font-semibold text-white">{page.title}</h1>

            {page.description ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                {page.description}
              </p>
            ) : null}

            <p className="mt-8 text-sm text-zinc-500">
              Bu sayfa yayında, ancak henüz public içerik bloğu tanımlanmamış.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            {blocks.map((block, index) => renderBlock(block, index))}
          </div>
        )}
      </div>
    </main>
  );
}