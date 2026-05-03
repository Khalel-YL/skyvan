"use client";

import { Copy, GripVertical, Plus, Trash2, ArrowDown, ArrowUp } from "lucide-react";

import {
  type PageContentBlock,
  type PageTemplateKey,
  createTemplateBlocks,
  getBlockHelperText,
  getBlockLabel,
  validatePageBlocks,
} from "../_lib/page-blocks";

type PageBlockEditorProps = {
  blocks: PageContentBlock[];
  onChange: (blocks: PageContentBlock[]) => void;
};

const blockActions: Array<{
  type: PageContentBlock["type"];
  label: string;
}> = [
  { type: "hero", label: "Ana giriş ekle" },
  { type: "text", label: "Metin ekle" },
  { type: "feature-list", label: "Öne çıkanlar ekle" },
  { type: "stats", label: "Sayılar ekle" },
  { type: "cta", label: "Butonlu çağrı ekle" },
];

const templates: Array<{ key: PageTemplateKey; label: string; description: string }> = [
  {
    key: "standard-info",
    label: "Standart bilgi sayfası",
    description: "Hero, metin, öne çıkanlar ve butonlu çağrı alanı.",
  },
  {
    key: "about",
    label: "Hakkımızda sayfası",
    description: "Hero, anlatım metni, sayılar ve çağrı alanı.",
  },
  {
    key: "project-start",
    label: "Proje başlat sayfası",
    description: "Hero, hazırlık maddeleri ve iletişim çağrısı.",
  },
  {
    key: "blank",
    label: "Boş sayfa",
    description: "Yalnızca boş bir hero alanıyla başlar.",
  },
];

const ctaPresets = [
  { label: "Proje Başlat", href: "/proje-baslat" },
  { label: "İletişime Geç", href: "/iletisim" },
  { label: "Ana Sayfa", href: "/" },
];

function createBlock(type: PageContentBlock["type"]): PageContentBlock {
  if (type === "hero") {
    return {
      type,
      heading: "Yeni hero başlığı",
      subtext: "",
      body: "",
      ctaLabel: "",
      ctaHref: "",
    };
  }

  if (type === "feature-list") {
    return {
      type,
      heading: "Öne çıkanlar",
      subtext: "",
      items: ["Yeni madde"],
    };
  }

  if (type === "stats") {
    return {
      type,
      heading: "Hızlı bakış",
      stats: [{ label: "Etiket", value: "Değer" }],
    };
  }

  if (type === "cta") {
    return {
      type,
      heading: "Sonraki adım",
      body: "",
      ctaLabel: "Proje Başlat",
      ctaHref: "/proje-baslat",
    };
  }

  return {
    type,
    heading: "Metin başlığı",
    body: "",
  };
}

function getBlockInlineWarnings(block: PageContentBlock, index: number) {
  const validation = validatePageBlocks({
    title: "Taslak",
    slug: "taslak",
    seoTitle: "Taslak",
    seoDescription: "Taslak",
    blocks: [block],
  });
  const blockNumber = `#${index + 1}`;

  return validation.blockers.filter((item) => item.includes(blockNumber));
}

function updateBlock(block: PageContentBlock, patch: Partial<PageContentBlock>) {
  return { ...block, ...patch } as PageContentBlock;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
        />
      )}
    </label>
  );
}

export function PageBlockEditor({ blocks, onChange }: PageBlockEditorProps) {
  function setBlock(index: number, nextBlock: PageContentBlock) {
    onChange(blocks.map((block, blockIndex) => (blockIndex === index ? nextBlock : block)));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= blocks.length) {
      return;
    }

    const nextBlocks = [...blocks];
    const [block] = nextBlocks.splice(index, 1);
    nextBlocks.splice(nextIndex, 0, block);
    onChange(nextBlocks);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, blockIndex) => blockIndex !== index));
  }

  function duplicateBlock(index: number) {
    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, structuredClone(blocks[index]));
    onChange(nextBlocks);
  }

  function addBlock(type: PageContentBlock["type"]) {
    onChange([...blocks, createBlock(type)]);
  }

  function applyTemplate(template: PageTemplateKey) {
    if (
      blocks.length > 0 &&
      !window.confirm(
        "Bu şablon mevcut blokları değiştirecek. Devam etmek istiyor musun?",
      )
    ) {
      return;
    }

    onChange(createTemplateBlocks(template));
  }

  function applyCtaPreset(index: number, block: Extract<PageContentBlock, { type: "cta" }>, preset: { label: string; href: string }) {
    setBlock(
      index,
      updateBlock(block, {
        ctaLabel: preset.label,
        ctaHref: preset.href,
      }),
    );
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">İçerik blokları</h3>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
            Sayfa içeriğini küçük ve anlaşılır bölümlerle kur. Publish öncesi
            eksik alanlar burada blok bazında görünür.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {blockActions.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => addBlock(action.type)}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
          Sayfa şablonları
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => (
            <button
              key={template.key}
              type="button"
              onClick={() => applyTemplate(template.key)}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 text-left transition hover:border-zinc-600"
            >
              <span className="block text-xs font-semibold text-white">
                {template.label}
              </span>
              <span className="mt-1 block text-[11px] leading-4 text-zinc-500">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {blocks.map((block, index) => {
          const inlineWarnings = getBlockInlineWarnings(block, index);

          return (
            <article
              key={`${block.type}-${index}`}
              className="rounded-[1.35rem] border border-zinc-800 bg-black/35 p-4"
            >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {String(index + 1).padStart(2, "0")} · {getBlockLabel(block.type)}
                  </div>
                  <div className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                    {getBlockHelperText(block.type)}
                  </div>
                </div>
              </div>

              <div className="flex gap-1.5">
                <button type="button" onClick={() => moveBlock(index, -1)} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white" aria-label="Bloğu yukarı taşı">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => moveBlock(index, 1)} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white" aria-label="Bloğu aşağı taşı">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => duplicateBlock(index)} className="rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:text-white" aria-label="Bloğu çoğalt">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => removeBlock(index)} className="rounded-xl border border-zinc-800 p-2 text-rose-300 hover:border-rose-900" aria-label="Bloğu sil">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {inlineWarnings.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-amber-900/60 bg-amber-950/25 px-3 py-2 text-xs leading-5 text-amber-200">
                {inlineWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              {block.type === "hero" ? (
                <>
                  <Field label="Başlık" value={block.heading} onChange={(value) => setBlock(index, updateBlock(block, { heading: value }))} />
                  <Field label="Kısa alt metin" value={block.subtext ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { subtext: value }))} />
                  <Field label="Açıklama / içerik" value={block.body ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { body: value }))} multiline />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Buton yazısı" value={block.ctaLabel ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { ctaLabel: value }))} />
                    <Field label="Buton bağlantısı" value={block.ctaHref ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { ctaHref: value }))} />
                  </div>
                </>
              ) : null}

              {block.type === "text" ? (
                <>
                  <Field label="Başlık" value={block.heading ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { heading: value }))} />
                  <Field label="Açıklama / içerik" value={block.body ?? block.content ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { body: value, content: undefined }))} multiline />
                </>
              ) : null}

              {block.type === "feature-list" ? (
                <>
                  <Field label="Başlık" value={block.heading ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { heading: value }))} />
                  <Field label="Kısa alt metin" value={block.subtext ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { subtext: value }))} />
                  <div className="grid gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Liste maddeleri</span>
                    {block.items.map((item, itemIndex) => (
                      <div key={`${index}-item-${itemIndex}`} className="flex gap-2">
                        <input
                          value={item}
                          onChange={(event) => {
                            const nextItems = [...block.items];
                            nextItems[itemIndex] = event.target.value;
                            setBlock(index, updateBlock(block, { items: nextItems }));
                          }}
                          className="min-w-0 flex-1 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                        <button type="button" onClick={() => setBlock(index, updateBlock(block, { items: block.items.filter((_, nextIndex) => nextIndex !== itemIndex) }))} className="rounded-2xl border border-zinc-800 px-3 text-zinc-400 hover:text-white">
                          Sil
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setBlock(index, updateBlock(block, { items: [...block.items, ""] }))} className="justify-self-start rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white">
                      Madde ekle
                    </button>
                  </div>
                </>
              ) : null}

              {block.type === "stats" ? (
                <>
                  <Field label="Başlık" value={block.heading ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { heading: value }))} />
                  <div className="grid gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Sayılar / istatistikler</span>
                    {block.stats.map((stat, statIndex) => (
                      <div key={`${index}-stat-${statIndex}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                        <input
                          value={stat.label}
                          onChange={(event) => {
                            const nextStats = [...block.stats];
                            nextStats[statIndex] = { ...stat, label: event.target.value };
                            setBlock(index, updateBlock(block, { stats: nextStats }));
                          }}
                          placeholder="Etiket"
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                        <input
                          value={stat.value}
                          onChange={(event) => {
                            const nextStats = [...block.stats];
                            nextStats[statIndex] = { ...stat, value: event.target.value };
                            setBlock(index, updateBlock(block, { stats: nextStats }));
                          }}
                          placeholder="Değer"
                          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600"
                        />
                        <button type="button" onClick={() => setBlock(index, updateBlock(block, { stats: block.stats.filter((_, nextIndex) => nextIndex !== statIndex) }))} className="rounded-2xl border border-zinc-800 px-3 text-zinc-400 hover:text-white">
                          Sil
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setBlock(index, updateBlock(block, { stats: [...block.stats, { label: "", value: "" }] }))} className="justify-self-start rounded-2xl border border-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:text-white">
                      Sayı ekle
                    </button>
                  </div>
                </>
              ) : null}

              {block.type === "cta" ? (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs leading-5 text-zinc-400">
                    Butonlu çağrı alanı: Kullanıcıyı iletişim, proje başlatma
                    veya detay sayfasına yönlendiren bölüm.
                  </div>
                  <Field label="Başlık" value={block.heading} onChange={(value) => setBlock(index, updateBlock(block, { heading: value }))} />
                  <Field label="Açıklama / içerik" value={block.body ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { body: value }))} multiline />
                  <div className="flex flex-wrap gap-2">
                    {ctaPresets.map((preset) => (
                      <button
                        key={preset.href}
                        type="button"
                        onClick={() => applyCtaPreset(index, block, preset)}
                        className="rounded-full border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Buton yazısı" value={block.ctaLabel ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { ctaLabel: value }))} />
                    <Field label="Buton bağlantısı" value={block.ctaHref ?? ""} onChange={(value) => setBlock(index, updateBlock(block, { ctaHref: value }))} />
                  </div>
                </>
              ) : null}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}
