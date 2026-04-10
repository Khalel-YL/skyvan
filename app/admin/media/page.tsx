import { eq } from "drizzle-orm";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Search,
  ShieldAlert,
  Tag,
  Trash2,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { localizedContent } from "@/db/schema";

import AddMediaDrawer from "./AddMediaDrawer";
import { deleteMedia } from "./actions";

type MediaSearchParams = Promise<{
  q?: string;
  mediaAction?: string;
  mediaMessage?: string;
}>;

type MediaContentJson = {
  url?: string;
  tags?: string[];
  uploadDate?: string;
};

type MediaListItem = {
  id: string;
  title: string | null;
  locale: string;
  contentJson: unknown;
};

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseMediaContent(value: unknown): MediaContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;

  return {
    url: typeof raw.url === "string" ? raw.url : "",
    tags: Array.isArray(raw.tags)
      ? raw.tags.map((tag) => String(tag ?? "").trim()).filter(Boolean)
      : [],
    uploadDate:
      typeof raw.uploadDate === "string" && raw.uploadDate.trim()
        ? raw.uploadDate
        : "",
  };
}

function formatDate(value: string | undefined) {
  if (!value) {
    return "Tarih yok";
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

function getActionFeedback(params: Awaited<MediaSearchParams>) {
  if (params.mediaAction === "saved") {
    return {
      tone: "success" as const,
      message: "Medya kaydı oluşturuldu.",
    };
  }

  if (params.mediaAction === "deleted") {
    return {
      tone: "success" as const,
      message: "Medya kaydı silindi.",
    };
  }

  if (params.mediaAction === "error") {
    return {
      tone: "error" as const,
      message: params.mediaMessage || "Medya işlemi tamamlanamadı.",
    };
  }

  return null;
}

function toneClasses(tone: "success" | "error") {
  return tone === "success"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
    : "border-rose-500/20 bg-rose-500/10 text-rose-100";
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: MediaSearchParams;
}) {
  const params = await searchParams;
  const query = String(params.q ?? "").trim().toLowerCase();
  const dbHealth = getDatabaseHealth();
  let queryWarning: string | null = null;
  let rawMedia: MediaListItem[] = [];

  if (db) {
    try {
      rawMedia = (await db
        .select({
          id: localizedContent.id,
          title: localizedContent.title,
          locale: localizedContent.locale,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(eq(localizedContent.entityType, "media"))) as MediaListItem[];
    } catch (error) {
      console.error("media page query error:", error);
      queryWarning =
        "Medya kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const allMedia = rawMedia
    .map((media) => {
      const content = parseMediaContent(media.contentJson);

      return {
        ...media,
        mediaContent: content,
        url: content.url || "",
        tags: content.tags || [],
        uploadDate: content.uploadDate || "",
        hasValidUrl: isSafeHttpUrl(content.url || ""),
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.uploadDate || "1970-01-01T00:00:00.000Z").getTime();
      const rightTime = new Date(right.uploadDate || "1970-01-01T00:00:00.000Z").getTime();
      return rightTime - leftTime;
    });

  const filteredMedia = query
    ? allMedia.filter((media) => {
        const haystacks = [
          media.title || "",
          media.url,
          ...media.tags,
        ].map((value) => value.toLowerCase());

        return haystacks.some((value) => value.includes(query));
      })
    : allMedia;

  const uniqueTags = new Set(allMedia.flatMap((media) => media.tags));
  const validUrlCount = allMedia.filter((media) => media.hasValidUrl).length;
  const latestUpload = allMedia[0]?.uploadDate || "";
  const actionFeedback = getActionFeedback(params);

  return (
    <div className="flex min-h-screen items-start bg-[#050505]">
      <div className="min-h-screen flex-1 p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-light text-white">
              <ImageIcon className="h-6 w-6 text-blue-500" />
              Skyvan <span className="font-semibold">Medya Kütüphanesi</span>
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Gerçek kayıt, gerçek URL ve kontrollü medya yüzeyi
            </p>
          </div>
        </div>

        {actionFeedback ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm ${toneClasses(actionFeedback.tone)}`}>
            {actionFeedback.message}
          </div>
        ) : null}

        {!db ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            {dbHealth.note}
          </div>
        ) : null}

        {queryWarning ? (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            {queryWarning}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-zinc-800 bg-[#0a0a0a] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Toplam kayıt
            </p>
            <p className="mt-3 text-3xl font-black text-white">{allMedia.length}</p>
            <p className="mt-2 text-xs text-zinc-500">Medya kütüphanesindeki toplam öğe</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-200">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
              Doğrulanmış URL
            </p>
            <p className="mt-3 text-3xl font-black">{validUrlCount}</p>
            <p className="mt-2 text-xs text-emerald-300/80">
              http/https formatına uyan kayıt
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-[#0a0a0a] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Benzersiz etiket
            </p>
            <p className="mt-3 text-3xl font-black text-white">{uniqueTags.size}</p>
            <p className="mt-2 text-xs text-zinc-500">Tekrarsız etiket havuzu</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-[#0a0a0a] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Son yükleme
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {formatDate(latestUpload)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Boyut metriği tutulmadığı için simüle depolama gösterilmez
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-[#0a0a0a] p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-zinc-900 p-3 text-blue-400">
              <ShieldAlert className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Operasyon notu
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Bu yüzey yalnızca kayıtlı medya referanslarını yönetir. Depolama boyutu,
                otomatik Vision AI skoru veya sahte etiket simülasyonu gösterilmez.
                URL güvenliği ve etiket bütünlüğü action katmanında doğrulanır.
              </p>
            </div>
          </div>
        </div>

        <form method="get" className="mt-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Dosya adı, URL veya etiket ara"
              className="w-full rounded-2xl border border-zinc-800 bg-[#0a0a0a] py-4 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-700"
            />
          </div>
        </form>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
          {filteredMedia.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-zinc-800 p-16 text-center text-zinc-500">
              <ImageIcon className="h-12 w-12 opacity-30" />
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">
                  {allMedia.length === 0
                    ? "Henüz medya kaydı yok"
                    : "Arama kriterine uyan medya bulunamadı"}
                </p>
                <p className="mt-2 text-xs">
                  {allMedia.length === 0
                    ? "İlk medya kaydı oluşturulduğunda galeri burada görünür."
                    : "Arama terimini sadeleştirip tekrar dene."}
                </p>
              </div>
            </div>
          ) : (
            filteredMedia.map((media) => (
              <div
                key={media.id}
                className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#0a0a0a] shadow-[0_8px_30px_rgb(0,0,0,0.35)]"
              >
                {media.hasValidUrl ? (
                  <img
                    src={media.url}
                    alt={media.title || "Medya"}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-zinc-950 text-zinc-700">
                    <div className="flex flex-col items-center gap-3">
                      <ImageIcon className="h-8 w-8" />
                      <span className="text-xs uppercase tracking-[0.2em]">
                        Önizleme yok
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {media.title || "Adsız medya"}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1">
                          <CalendarClock className="h-3 w-3" />
                          {formatDate(media.uploadDate)}
                        </span>

                        {media.hasValidUrl ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            URL doğrulandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-200">
                            <ShieldAlert className="h-3 w-3" />
                            Legacy URL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {media.hasValidUrl ? (
                        <a
                          href={media.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                          title="Medyayı yeni sekmede aç"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}

                      <form action={deleteMedia.bind(null, media.id)}>
                        <button className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-300 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                      <Link2 className="h-3.5 w-3.5" />
                      Kaynak URL
                    </p>
                    <p className="mt-2 break-all text-sm text-zinc-300">
                      {media.url || "URL bilgisi yok"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {media.tags.length > 0 ? (
                      media.tags.map((tag) => (
                        <span
                          key={`${media.id}-${tag}`}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-300"
                        >
                          <Tag className="h-3 w-3 text-amber-500" />
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] text-zinc-500">
                        Etiket yok
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sticky top-0 z-10 h-screen shrink-0 shadow-2xl">
        <AddMediaDrawer
          disabled={!db}
          noticeMessage={actionFeedback?.message ?? null}
          noticeTone={actionFeedback?.tone ?? "info"}
        />
      </div>
    </div>
  );
}
