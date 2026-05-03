import { eq, ne } from "drizzle-orm";
import {
  Box,
  Film,
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { db, getDatabaseHealth } from "@/db/db";
import { localizedContent } from "@/db/schema";

import AddMediaDrawer from "./AddMediaDrawer";
import MediaAssetStage from "./MediaAssetStage";
import {
  type MediaAsset,
  getMediaPreviewUrl,
  getMediaPrimaryUrl,
  isSafeHttpUrl,
  normalizeMediaContent,
} from "./media-types";

type MediaSearchParams = Promise<{
  mediaAction?: string;
  mediaMessage?: string;
}>;

type MediaListItem = {
  id: string;
  entityType: string;
  title: string | null;
  locale: string;
  contentJson: unknown;
};

type UsageScanItem = {
  entityType: string;
  title: string | null;
  locale: string;
  slug: string | null;
  contentJson: unknown;
};

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

function getUsageLabels(asset: Omit<MediaAsset, "usageLabels">, usageRows: UsageScanItem[]) {
  const tokens = [asset.id, asset.primaryUrl, asset.previewUrl].filter(Boolean);

  if (tokens.length === 0) {
    return [];
  }

  return usageRows
    .filter((row) => {
      const serialized = JSON.stringify(row.contentJson ?? "");
      return tokens.some((token) => serialized.includes(token));
    })
    .map((row) => {
      const label = row.title || row.slug || row.entityType;
      return `${row.locale.toUpperCase()} · ${row.entityType} · ${label}`;
    })
    .slice(0, 6);
}

function metricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  helper: string;
  icon: typeof ImageIcon;
  tone?: "neutral" | "featured";
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        tone === "featured"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
          : "border-zinc-800 bg-zinc-950/70 text-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
            tone === "featured" ? "text-amber-300/80" : "text-zinc-500"
          }`}
        >
          {label}
        </p>
        <Icon className={`h-4 w-4 ${tone === "featured" ? "text-amber-300" : "text-zinc-500"}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className={`mt-2 text-xs ${tone === "featured" ? "text-amber-300/80" : "text-zinc-500"}`}>
        {helper}
      </p>
    </div>
  );
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: MediaSearchParams;
}) {
  const params = await searchParams;
  const dbHealth = getDatabaseHealth();
  let queryWarning: string | null = null;
  let rawMedia: MediaListItem[] = [];
  let usageRows: UsageScanItem[] = [];

  if (db) {
    try {
      rawMedia = (await db
        .select({
          id: localizedContent.id,
          entityType: localizedContent.entityType,
          title: localizedContent.title,
          locale: localizedContent.locale,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(eq(localizedContent.entityType, "media"))) as MediaListItem[];

      usageRows = (await db
        .select({
          entityType: localizedContent.entityType,
          title: localizedContent.title,
          locale: localizedContent.locale,
          slug: localizedContent.slug,
          contentJson: localizedContent.contentJson,
        })
        .from(localizedContent)
        .where(ne(localizedContent.entityType, "media"))) as UsageScanItem[];
    } catch (error) {
      console.error("media page query error:", error);
      queryWarning =
        "Medya kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const mediaRecords = rawMedia.filter((item) => item.contentJson && item.title !== null);
  const allMedia = mediaRecords
    .filter((item) => {
      const raw =
        item.contentJson && typeof item.contentJson === "object" && !Array.isArray(item.contentJson)
          ? (item.contentJson as Record<string, unknown>)
          : {};

      return raw.url || raw.modelUrl || raw.mediaType || item.title;
    })
    .map((media) => {
      const content = normalizeMediaContent(media.contentJson, media.title || "");
      const primaryUrl = getMediaPrimaryUrl(content);
      const previewUrl = getMediaPreviewUrl(content);
      const assetWithoutUsage = {
        id: media.id,
        title: content.title || media.title || "Adsız medya",
        locale: media.locale,
        content,
        previewUrl,
        primaryUrl,
        hasValidUrl: isSafeHttpUrl(primaryUrl),
      };

      return {
        ...assetWithoutUsage,
        usageLabels: getUsageLabels(assetWithoutUsage, usageRows),
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.content.uploadDate || "1970-01-01T00:00:00.000Z").getTime();
      const rightTime = new Date(right.content.uploadDate || "1970-01-01T00:00:00.000Z").getTime();
      return rightTime - leftTime;
    });

  const imageCount = allMedia.filter((media) => media.content.mediaType === "image").length;
  const videoCount = allMedia.filter((media) => media.content.mediaType === "video").length;
  const modelCount = allMedia.filter((media) => media.content.mediaType === "model3d").length;
  const featuredCount = allMedia.filter((media) => media.content.isFeatured).length;
  const actionFeedback = getActionFeedback(params);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Admin · Asset Stage
            </div>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-semibold text-white">
              <ImageIcon className="h-6 w-6 text-zinc-300" />
              Medya Kütüphanesi
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Görsel, video ve 3D medya varlıklarını tek merkezden yönet.
            </p>
          </div>

          <AddMediaDrawer
            disabled={!db}
            noticeMessage={actionFeedback?.message ?? null}
            noticeTone={actionFeedback?.tone ?? "info"}
          />
        </div>
      </section>

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

      <MediaAssetStage assets={allMedia} />

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
        {metricCard({
          label: "Toplam medya",
          value: allMedia.length,
          helper: "Kayıtlı medya varlığı",
          icon: ImageIcon,
        })}
        {metricCard({
          label: "Görsel",
          value: imageCount,
          helper: "Image tipindeki kayıt",
          icon: ImageIcon,
        })}
        {metricCard({
          label: "Video",
          value: videoCount,
          helper: "Video tipindeki kayıt",
          icon: Film,
        })}
        {metricCard({
          label: "3D",
          value: modelCount,
          helper: "Model viewer adayları",
          icon: Box,
        })}
        {metricCard({
          label: "Öne çıkan",
          value: featuredCount,
          helper: "Editoryal öncelikli varlık",
          icon: Sparkles,
          tone: "featured",
        })}
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-zinc-900 p-3 text-amber-300">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-white">Operasyon notu</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
              Bu yüzey gerçek medya referanslarını yönetir. Depolama boyutu, sahte
              kullanım sayısı veya otomatik AI skoru gösterilmez. Kullanım bağlantısı
              yalnızca içerik JSON içinde gerçek referans bulunduğunda görünür.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
