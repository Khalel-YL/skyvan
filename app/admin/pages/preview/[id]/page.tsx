import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Edit3, Eye } from "lucide-react";

import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { PublicPageRenderer } from "@/app/(public)/components/PublicPageRenderer";
import { ThemeProvider } from "@/app/(public)/components/ThemeProvider";
import { getAdminPagePreviewContent } from "@/app/(public)/lib/public-content";
import "@/app/(public)/public-launch.css";

type Props = { params: Promise<{ id: string }> };

function isPublished(value: unknown) {
  return Boolean(
    value && typeof value === "object" && !Array.isArray(value) &&
      (value as { isPublished?: boolean }).isPublished === true,
  );
}

export default async function PagePreview({ params }: Props) {
  const { id } = await params;
  const db = getDbOrThrow();
  const rows = await db
    .select()
    .from(localizedContent)
    .where(and(eq(localizedContent.id, id), eq(localizedContent.entityType, "page")))
    .limit(1);
  const row = rows[0];
  const page = row ? getAdminPagePreviewContent(row) : null;

  if (!row || !page || page.slug !== "hakkimizda") {
    return (
      <div className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8">
          <h1 className="text-2xl font-semibold">Hakkımızda önizlemesi bulunamadı</h1>
          <p className="mt-3 text-sm text-zinc-400">Bu kontrollü önizleme yalnızca Türkçe ve İngilizce Hakkımızda kayıtlarını destekler.</p>
          <Link href="/admin/pages" className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Pages’e dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/pages" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Pages’e dön</Link>
          <Link href={`/admin/pages?edit=${row.id}`} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 hover:text-white"><Edit3 className="h-4 w-4" /> Düzenle</Link>
        </div>
        <p className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-2 text-xs text-zinc-300" role="status">
          <Eye className="h-3.5 w-3.5" /> Korumalı Admin önizlemesi · {isPublished(row.contentJson) ? "Yayında" : "Taslak"}
        </p>
      </div>

      <ThemeProvider>
        <div className="bg-[var(--sv-bg)] text-[var(--sv-text)]">
          <PublicPageRenderer page={page} />
        </div>
      </ThemeProvider>
    </div>
  );
}
