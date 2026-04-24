import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";

type HeroBlock = {
  type: "hero";
  heading?: unknown;
  subtext?: unknown;
  body?: unknown;
};

type TextBlock = {
  type: "text";
  content?: unknown;
};

type RichTextBlock = {
  type: "richText";
  content?: unknown;
};

type DividerBlock = {
  type: "divider";
};

type UnknownBlock = {
  type?: unknown;
  [key: string]: unknown;
};

type PageBlock =
  | HeroBlock
  | TextBlock
  | RichTextBlock
  | DividerBlock
  | UnknownBlock;

type ContentJson = {
  blocks?: PageBlock[];
  metaDescription?: unknown;
};

type LocalizedPageRow = typeof localizedContent.$inferSelect;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isHeroBlock(block: PageBlock): block is HeroBlock {
  return block.type === "hero";
}

async function getPageBySlug(slug: string): Promise<LocalizedPageRow | null> {
  const db = getDbOrThrow();

  const rows = await db
    .select()
    .from(localizedContent)
    .where(
      and(
        eq(localizedContent.slug, slug),
        eq(localizedContent.entityType, "page"),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

function getContentJson(page: LocalizedPageRow): ContentJson {
  if (!page.contentJson || typeof page.contentJson !== "object") {
    return {};
  }

  return page.contentJson as ContentJson;
}

function getHeroBlock(content: ContentJson): HeroBlock | null {
  if (!Array.isArray(content.blocks)) {
    return null;
  }

  const heroBlock = content.blocks.find(isHeroBlock);
  return heroBlock ?? null;
}

function getPageTitle(page: LocalizedPageRow, content: ContentJson): string {
  const heroBlock = getHeroBlock(content);

  return (
    asTrimmedString(page.seoTitle) ||
    asTrimmedString(page.title) ||
    asTrimmedString(heroBlock?.heading) ||
    "Skyvan"
  );
}

function getPageDescription(page: LocalizedPageRow, content: ContentJson): string {
  return (
    asTrimmedString(page.seoDescription) ||
    asTrimmedString(content.metaDescription) ||
    asTrimmedString(page.description) ||
    ""
  );
}

function buildMetadata(page: LocalizedPageRow, content: ContentJson): Metadata {
  const title = getPageTitle(page, content);
  const description = getPageDescription(page, content);

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "tr_TR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const page = await getPageBySlug(slug);

  if (!page) {
    return {};
  }

  const content = getContentJson(page);

  return buildMetadata(page, content);
}

function renderBlock(
  block: PageBlock,
  index: number,
  pageDescription: string,
  isFirstBlock: boolean,
) {
  if (block.type === "hero") {
    const heading = asTrimmedString(block.heading) || "İsimsiz sayfa";
    const subtext = asTrimmedString(block.subtext);
    const body = asTrimmedString(block.body);
    const fallbackDescription = !body && isFirstBlock ? pageDescription : "";

    return (
      <section
        key={index}
        className="border-b border-zinc-800 px-6 py-20 text-center"
      >
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            {heading}
          </h1>

          {subtext ? (
            <p className="mt-4 text-base text-zinc-400 md:text-lg">
              {subtext}
            </p>
          ) : null}

          {body ? (
            <p className="mt-6 whitespace-pre-line text-sm leading-7 text-zinc-300 md:text-base">
              {body}
            </p>
          ) : fallbackDescription ? (
            <p className="mt-6 whitespace-pre-line text-sm leading-7 text-zinc-300 md:text-base">
              {fallbackDescription}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.type === "text" || block.type === "richText") {
    const content = asTrimmedString(block.content);

    if (!content) {
      return null;
    }

    return (
      <section key={index} className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="whitespace-pre-line text-base leading-8 text-zinc-300">
            {content}
          </p>
        </div>
      </section>
    );
  }

  if (block.type === "divider") {
    return (
      <section key={index} className="px-6 py-2">
        <div className="mx-auto max-w-6xl border-t border-zinc-800" />
      </section>
    );
  }

  if (process.env.NODE_ENV !== "production") {
    const blockType = asTrimmedString(block.type) || "unknown";

    return (
      <section key={index} className="px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
          Desteklenmeyen block tipi: {blockType}
        </div>
      </section>
    );
  }

  return null;
}

export default async function PagePublic({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await getPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const content = getContentJson(page);
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const pageDescription = getPageDescription(page, content);

  return (
    <div className="min-h-screen bg-black text-white">
      {blocks.length > 0 ? (
        blocks.map((block, index) =>
          renderBlock(block, index, pageDescription, index === 0),
        )
      ) : (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-semibold text-white">
              {asTrimmedString(page.title) || "İsimsiz sayfa"}
            </h1>

            {pageDescription ? (
              <p className="mt-4 whitespace-pre-line text-zinc-400">
                {pageDescription}
              </p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}