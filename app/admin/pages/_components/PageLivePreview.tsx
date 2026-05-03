"use client";

import type { PageContentBlock } from "../_lib/page-blocks";
import { getBlockLabel } from "../_lib/page-blocks";

type PageLivePreviewProps = {
  title: string;
  description: string;
  locale: string;
  slug: string;
  blocks: PageContentBlock[];
};

function MediaPreview({ block }: { block: PageContentBlock }) {
  if (!("media" in block) || !block.media) {
    return null;
  }

  const media = block.media;

  if (media.mediaType === "video") {
    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/10 bg-black/5">
        {media.provider === "youtube" && media.embedUrl ? (
          <iframe
            src={media.embedUrl}
            title={media.title}
            className="aspect-video w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : media.provider === "direct" ? (
          <video
            className="aspect-video w-full object-cover"
            controls
            poster={media.previewUrl}
            preload="metadata"
          >
            <source src={media.url} />
          </video>
        ) : (
          <div className="flex aspect-video items-center justify-center p-5 text-center text-sm text-black/55">
            Harici video bağlantısı: {media.title}
          </div>
        )}
      </div>
    );
  }

  if (media.mediaType === "model3d") {
    return (
      <div className="mt-4 flex aspect-video items-center justify-center rounded-2xl border border-black/10 bg-black/5 p-5 text-center text-sm text-black/55">
        3D önizleme altyapısı hazır: {media.title}
      </div>
    );
  }

  return media.previewUrl || media.url ? (
    <div className="mt-4 overflow-hidden rounded-2xl border border-black/10">
      {/* eslint-disable-next-line @next/next/no-img-element -- Admin live preview renders external media library URLs. */}
      <img
        src={media.previewUrl || media.url}
        alt={media.altText || media.title}
        className="aspect-video w-full object-cover"
      />
    </div>
  ) : null;
}

export function PageLivePreview({
  title,
  description,
  locale,
  slug,
  blocks,
}: PageLivePreviewProps) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Live preview</h3>
          <p className="mt-1 text-xs text-zinc-500">Public render yapısını kompakt admin panelinde gösterir.</p>
        </div>
        <span className="rounded-full border border-zinc-800 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          {locale || "tr"} / {slug || "-"}
        </span>
      </div>

      <div className="max-h-[34rem] overflow-y-auto rounded-[1.5rem] border border-zinc-800 bg-[#f6f3ee] text-[#151515]">
        <div className="border-b border-black/10 px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">
            Skyvan public preview
          </div>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight">
            {title || "Untitled page"}
          </h2>
          {description ? <p className="mt-3 text-sm leading-6 text-black/60">{description}</p> : null}
        </div>

        <div className="grid gap-4 p-4">
          {blocks.map((block, index) => (
            <article key={`${block.type}-${index}`} className="rounded-2xl border border-black/10 bg-white/70 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/40">
                {getBlockLabel(block.type)}
              </div>
              {"heading" in block && block.heading ? (
                <h3 className="mt-2 text-xl font-semibold tracking-tight">{block.heading}</h3>
              ) : null}
              {"subtext" in block && block.subtext ? (
                <p className="mt-2 text-sm text-black/55">{block.subtext}</p>
              ) : null}
              {"body" in block && block.body ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-black/65">{block.body}</p>
              ) : null}
              <MediaPreview block={block} />
              {block.type === "text" && block.content ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-black/65">{block.content}</p>
              ) : null}
              {block.type === "feature-list" ? (
                <div className="mt-3 grid gap-2">
                  {block.items.map((item) => (
                    <div key={item} className="rounded-xl border border-black/10 px-3 py-2 text-sm text-black/65">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}
              {block.type === "stats" ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {block.stats.map((stat) => (
                    <div key={`${stat.label}:${stat.value}`} className="rounded-xl border border-black/10 px-3 py-2">
                      <div className="text-xs text-black/45">{stat.label}</div>
                      <div className="mt-1 text-lg font-semibold">{stat.value}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {"ctaLabel" in block && block.ctaLabel ? (
                <div className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                  {block.ctaLabel}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
