"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";

import { publicEditorialContent } from "@/app/(public)/lib/public-editorial-content";
import {
  PUBLIC_EDITORIAL_CTA_SLUGS,
  MAX_PUBLIC_SUPPLEMENTARY_BLOCKS,
  PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS,
  getPublicEditorialCtaHref,
  getPublicEditorialCtaSlug,
  type PublicSupplementaryBlockType,
} from "@/app/lib/public-editorial-cms";

import {
  getBlockLabel,
  type PageContentBlock,
} from "../_lib/page-blocks";

type SupplementaryBlock = Extract<
  PageContentBlock,
  { type: "text" | "feature-list" | "stats" | "cta" }
>;

type Props = {
  blocks: PageContentBlock[];
  locale: string;
  onChange: (blocks: PageContentBlock[]) => void;
};

const addActions: Array<{ type: PublicSupplementaryBlockType; label: string }> = [
  { type: "text", label: "Metin" },
  { type: "feature-list", label: "Özellik listesi" },
  { type: "stats", label: "İstatistik" },
  { type: "cta", label: "CTA" },
];

const layoutLabels = {
  standard: "Standart",
  surface: "Vurgulu yüzey",
  wide: "Geniş",
} as const;

function createCmsId() {
  return `supplemental-${crypto.randomUUID()}`;
}

function createSupplementaryBlock(type: PublicSupplementaryBlockType): SupplementaryBlock {
  const cms = { id: createCmsId(), visible: true, layout: "standard" as const };

  if (type === "feature-list") {
    return { type, heading: "Öne çıkanlar", subtext: "", items: ["Yeni madde"], cms };
  }
  if (type === "stats") {
    return { type, heading: "Hızlı bakış", stats: [{ label: "Etiket", value: "Değer" }], cms };
  }
  if (type === "cta") {
    return { type, heading: "Sonraki adım", body: "", cms };
  }

  return { type: "text", heading: "Yeni bölüm", body: "", cms };
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" />
      )}
    </label>
  );
}

export function PageSupplementaryBlockEditor({ blocks, locale, onChange }: Props) {
  const safeLocale = locale === "en" ? "en" : "tr";
  const supplementary = blocks.filter(
    (block): block is SupplementaryBlock => block.type !== "hero" && Boolean(block.cms),
  );
  const supplementalIndexes = blocks
    .map((block, index) => block.cms ? index : -1)
    .filter((index) => index >= 0);

  function updateBlock(id: string, next: SupplementaryBlock) {
    onChange(blocks.map((block) => block.cms?.id === id ? next : block));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.cms?.id !== id));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const currentIndex = blocks.findIndex((block) => block.cms?.id === id);
    const position = supplementalIndexes.indexOf(currentIndex);
    const targetIndex = supplementalIndexes[position + direction];
    if (currentIndex < 0 || targetIndex === undefined) return;

    const next = [...blocks];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    onChange(next);
  }

  function duplicateBlock(block: SupplementaryBlock) {
    if (supplementary.length >= MAX_PUBLIC_SUPPLEMENTARY_BLOCKS) return;
    const currentIndex = blocks.findIndex((candidate) => candidate.cms?.id === block.cms?.id);
    const duplicate = structuredClone(block);
    duplicate.cms = { ...duplicate.cms!, id: createCmsId() };
    const next = [...blocks];
    next.splice(currentIndex + 1, 0, duplicate);
    onChange(next);
  }

  function addBlock(type: PublicSupplementaryBlockType) {
    if (supplementary.length >= MAX_PUBLIC_SUPPLEMENTARY_BLOCKS) return;
    onChange([...blocks, createSupplementaryBlock(type)]);
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Ek içerik blokları</h3>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-zinc-500">
            Ana editoryal bölümleri değiştirmeden yeni içerik ekleyin. Ek bloklar ana bölümlerin ardından, belirlediğiniz sırayla gösterilir.
          </p>
        </div>
        <span className="w-max rounded-full border border-zinc-800 px-3 py-1 text-[11px] text-zinc-400">
          {supplementary.length}/{MAX_PUBLIC_SUPPLEMENTARY_BLOCKS} blok
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {addActions.map((action) => (
          <button key={action.type} type="button" onClick={() => addBlock(action.type)} disabled={supplementary.length >= MAX_PUBLIC_SUPPLEMENTARY_BLOCKS} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
            <Plus className="h-3.5 w-3.5" /> {action.label} ekle
          </button>
        ))}
      </div>

      {supplementary.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-800 bg-black/25 px-5 py-8 text-center text-xs leading-5 text-zinc-500">
          Henüz ek blok yok. Public sayfa mevcut güvenli ana bölümlerle çalışmaya devam eder.
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {supplementary.map((block, index) => {
            const cms = block.cms!;
            return (
              <details key={cms.id} className="rounded-2xl border border-zinc-800 bg-black/35 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">E{String(index + 1).padStart(2, "0")} · {getBlockLabel(block.type)}</div>
                    <div className="mt-1 truncate font-mono text-[11px] text-zinc-600">{cms.id}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-zinc-500">Düzenle</span>
                </summary>

                <div className="mt-3 border-t border-zinc-800/80 pt-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="text-xs text-zinc-500">Ek blok ayarları</span>
                    <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => moveBlock(cms.id, -1)} disabled={index === 0} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white disabled:opacity-35" aria-label="Ek bloğu yukarı taşı"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => moveBlock(cms.id, 1)} disabled={index === supplementary.length - 1} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white disabled:opacity-35" aria-label="Ek bloğu aşağı taşı"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => duplicateBlock(block)} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white" aria-label="Ek bloğu çoğalt"><Copy className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => updateBlock(cms.id, { ...block, cms: { ...cms, visible: !cms.visible } })} className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white">
                      {cms.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}{cms.visible ? "Görünür" : "Gizli"}
                    </button>
                    <button type="button" onClick={() => removeBlock(cms.id)} className="rounded-xl border border-red-950 p-2 text-rose-300 hover:border-red-800" aria-label="Ek bloğu sil"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                <div className="mt-3 grid gap-3">
                  <label className="grid gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Sunum</span>
                    <select value={cms.layout} onChange={(event) => updateBlock(cms.id, { ...block, cms: { ...cms, layout: event.target.value as typeof cms.layout } })} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600">
                      {PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS.map((layout) => <option key={layout} value={layout}>{layoutLabels[layout]}</option>)}
                    </select>
                  </label>

                  {block.type === "text" ? <><Field label="Başlık" value={block.heading ?? ""} onChange={(heading) => updateBlock(cms.id, { ...block, heading })} /><Field label="İçerik" value={block.body ?? block.content ?? ""} onChange={(body) => updateBlock(cms.id, { ...block, body, content: undefined })} multiline /></> : null}

                  {block.type === "feature-list" ? <>
                    <Field label="Başlık" value={block.heading ?? ""} onChange={(heading) => updateBlock(cms.id, { ...block, heading })} />
                    <Field label="Kısa açıklama" value={block.subtext ?? ""} onChange={(subtext) => updateBlock(cms.id, { ...block, subtext })} />
                    <div className="grid gap-2">{block.items.map((item, itemIndex) => <div key={`${cms.id}-${itemIndex}`} className="flex gap-2"><input value={item} onChange={(event) => { const items = [...block.items]; items[itemIndex] = event.target.value; updateBlock(cms.id, { ...block, items }); }} className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" /><button type="button" onClick={() => updateBlock(cms.id, { ...block, items: block.items.filter((_, candidate) => candidate !== itemIndex) })} className="rounded-2xl border border-zinc-800 px-3 text-xs text-zinc-400">Sil</button></div>)}<button type="button" disabled={block.items.length >= 8} onClick={() => updateBlock(cms.id, { ...block, items: [...block.items, ""] })} className="w-max rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40">Madde ekle</button></div>
                  </> : null}

                  {block.type === "stats" ? <>
                    <Field label="Başlık" value={block.heading ?? ""} onChange={(heading) => updateBlock(cms.id, { ...block, heading })} />
                    <div className="grid gap-2">{block.stats.map((stat, statIndex) => <div key={`${cms.id}-${statIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]"><input value={stat.label} onChange={(event) => { const stats = [...block.stats]; stats[statIndex] = { ...stat, label: event.target.value }; updateBlock(cms.id, { ...block, stats }); }} placeholder="Etiket" className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" /><input value={stat.value} onChange={(event) => { const stats = [...block.stats]; stats[statIndex] = { ...stat, value: event.target.value }; updateBlock(cms.id, { ...block, stats }); }} placeholder="Değer" className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600" /><button type="button" onClick={() => updateBlock(cms.id, { ...block, stats: block.stats.filter((_, candidate) => candidate !== statIndex) })} className="rounded-2xl border border-zinc-800 px-3 text-xs text-zinc-400">Sil</button></div>)}<button type="button" disabled={block.stats.length >= 6} onClick={() => updateBlock(cms.id, { ...block, stats: [...block.stats, { label: "", value: "" }] })} className="w-max rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 disabled:opacity-40">Sayı ekle</button></div>
                  </> : null}

                  {block.type === "cta" ? <>
                    <Field label="Başlık" value={block.heading} onChange={(heading) => updateBlock(cms.id, { ...block, heading })} />
                    <Field label="Açıklama" value={block.body ?? ""} onChange={(body) => updateBlock(cms.id, { ...block, body })} multiline />
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Buton etiketi" value={block.ctaLabel ?? ""} onChange={(ctaLabel) => updateBlock(cms.id, { ...block, ctaLabel: ctaLabel || undefined })} />
                      <label className="grid gap-2"><span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Buton hedefi</span><select value={block.ctaHref ?? ""} onChange={(event) => { const href = event.target.value; const previousSlug = block.ctaHref ? getPublicEditorialCtaSlug(safeLocale, block.ctaHref) : undefined; const nextSlug = PUBLIC_EDITORIAL_CTA_SLUGS.find((slug) => getPublicEditorialCtaHref(safeLocale, slug) === href); const previousLabel = previousSlug ? publicEditorialContent[safeLocale][previousSlug].title : undefined; const nextLabel = nextSlug ? publicEditorialContent[safeLocale][nextSlug].title : undefined; updateBlock(cms.id, { ...block, ctaHref: href || undefined, ctaLabel: href ? (!block.ctaLabel || block.ctaLabel === previousLabel ? nextLabel : block.ctaLabel) : undefined }); }} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"><option value="">CTA gösterme</option>{PUBLIC_EDITORIAL_CTA_SLUGS.map((slug) => <option key={slug} value={getPublicEditorialCtaHref(safeLocale, slug)}>{publicEditorialContent[safeLocale][slug].title}</option>)}</select></label>
                    </div>
                  </> : null}
                </div>
                </div>
              </details>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-5 text-zinc-600">Ek bloklarda yönetilen medya, onay ve kullanım takibi tamamlanana kadar kapalıdır.</p>
    </section>
  );
}
