export type PageContentBlock =
  | {
      type: "hero";
      heading: string;
      subtext?: string;
      body?: string;
      ctaLabel?: string;
      ctaHref?: string;
    }
  | {
      type: "text";
      heading?: string;
      body?: string;
      content?: string;
    }
  | {
      type: "feature-list";
      heading?: string;
      subtext?: string;
      items: string[];
    }
  | {
      type: "stats";
      heading?: string;
      stats: Array<{ label: string; value: string }>;
    }
  | {
      type: "cta";
      heading: string;
      body?: string;
      ctaLabel?: string;
      ctaHref?: string;
    };

export type PageContentJson = {
  isPublished: boolean;
  blocks: PageContentBlock[];
};

export type PageBlockValidationInput = {
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  blocks: PageContentBlock[];
};

export type PageBlockValidationResult = {
  blockers: string[];
  warnings: string[];
};

export type PageTemplateKey =
  | "standard-info"
  | "about"
  | "project-start"
  | "blank";

const supportedBlockTypes = new Set<PageContentBlock["type"]>([
  "hero",
  "text",
  "feature-list",
  "stats",
  "cta",
]);

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function optionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.map((item) => cleanString(item)).filter(Boolean).slice(0, 12);
}

function normalizeStats(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<{ label: string; value: string }>;
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const label = cleanString(raw.label);
      const statValue = cleanString(raw.value);

      return label && statValue ? { label, value: statValue } : null;
    })
    .filter((item): item is { label: string; value: string } => item !== null)
    .slice(0, 8);
}

function normalizeBlock(value: unknown): PageContentBlock | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const type = cleanString(raw.type).toLowerCase();
  const safeType = supportedBlockTypes.has(type as PageContentBlock["type"])
    ? (type as PageContentBlock["type"])
    : "text";

  if (safeType === "hero") {
    return {
      type: "hero",
      heading: cleanString(raw.heading),
      subtext: optionalString(raw.subtext),
      body: optionalString(raw.body),
      ctaLabel: optionalString(raw.ctaLabel),
      ctaHref: optionalString(raw.ctaHref),
    };
  }

  if (safeType === "feature-list") {
    return {
      type: "feature-list",
      heading: optionalString(raw.heading),
      subtext: optionalString(raw.subtext),
      items: normalizeItems(raw.items),
    };
  }

  if (safeType === "stats") {
    return {
      type: "stats",
      heading: optionalString(raw.heading),
      stats: normalizeStats(raw.stats),
    };
  }

  if (safeType === "cta") {
    return {
      type: "cta",
      heading: cleanString(raw.heading),
      body: optionalString(raw.body),
      ctaLabel: optionalString(raw.ctaLabel),
      ctaHref: optionalString(raw.ctaHref),
    };
  }

  return {
    type: "text",
    heading: optionalString(raw.heading),
    body: optionalString(raw.body),
    content: optionalString(raw.content),
  };
}

export function createDefaultPageBlocks(params?: {
  title?: string;
  description?: string;
  locale?: string;
}): PageContentBlock[] {
  const title = cleanString(params?.title) || "Yeni sayfa";
  const description =
    cleanString(params?.description) ||
    "Bu sayfa Skyvan yönetim panelinden yapılandırılmış bloklarla yönetilir.";
  const localeLabel = (cleanString(params?.locale) || "tr").toUpperCase();

  return [
    {
      type: "hero",
      heading: title,
      subtext: `Skyvan ${localeLabel} public sayfası`,
      body: description,
      ctaLabel: "İletişime geç",
      ctaHref: "/",
    },
    {
      type: "text",
      heading: "İçerik özeti",
      body: "Sayfanın ana anlatımı, marka dili ve kullanıcıya verilecek net mesaj burada yer alır.",
    },
  ];
}

export function normalizePageContentJson(
  value: unknown,
  fallback?: {
    title?: string;
    description?: string;
    locale?: string;
    isPublished?: boolean;
  },
): PageContentJson {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const blocks = Array.isArray(raw.blocks)
    ? raw.blocks.map(normalizeBlock).filter((block): block is PageContentBlock => block !== null)
    : [];
  const published =
    typeof raw.isPublished === "boolean"
      ? raw.isPublished
      : typeof fallback?.isPublished === "boolean"
        ? fallback.isPublished
        : true;

  return {
    isPublished: published,
    blocks: blocks.length > 0 ? blocks : createDefaultPageBlocks(fallback),
  };
}

export function validatePageBlocks(input: PageBlockValidationInput): PageBlockValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.title.trim()) {
    blockers.push("Sayfa başlığı zorunludur.");
  }

  if (!input.slug.trim()) {
    blockers.push("Publish için slug zorunludur.");
  }

  if (!input.seoTitle.trim()) {
    blockers.push("Publish için SEO başlığı zorunludur.");
  }

  if (!input.seoDescription.trim()) {
    blockers.push("Publish için SEO açıklaması zorunludur.");
  }

  if (input.seoTitle.length > 90) {
    warnings.push("SEO başlığı 90 karakterden uzun.");
  }

  if (input.seoDescription.length > 170) {
    warnings.push("SEO açıklaması 170 karakterden uzun.");
  }

  if (input.blocks.length === 0) {
    blockers.push("Publish için en az bir içerik bloğu gerekir.");
  }

  for (const [index, block] of input.blocks.entries()) {
    const label = `${getBlockLabel(block.type)} #${index + 1}`;

    if (block.type === "hero" && !block.heading.trim()) {
      blockers.push(`${label}: Başlık zorunludur.`);
    }

    if (block.type === "text" && !block.heading?.trim() && !block.body?.trim() && !block.content?.trim()) {
      blockers.push(`${label}: Başlık veya açıklama/içerik gerekir.`);
    }

    if (block.type === "feature-list" && block.items.filter((item) => item.trim()).length === 0) {
      blockers.push(`${label}: En az bir liste maddesi gerekir.`);
    }

    if (block.type === "stats" && block.stats.filter((stat) => stat.label.trim() && stat.value.trim()).length === 0) {
      blockers.push(`${label}: En az bir etiket/değer satırı gerekir.`);
    }

    if (block.type === "cta" && !block.heading.trim() && !block.ctaLabel?.trim()) {
      blockers.push(`${label}: Başlık veya buton yazısı gerekir.`);
    }
  }

  return { blockers, warnings };
}

export function serializePageContentJson(input: PageContentJson) {
  const normalizedBlocks = input.blocks
    .map((block) => normalizeBlock(block))
    .filter((block): block is PageContentBlock => block !== null);
  const normalized = {
    isPublished: input.isPublished,
    blocks: normalizedBlocks,
  };

  return JSON.stringify(normalized);
}

export function getPagePublishWarnings(input: PageBlockValidationInput) {
  return validatePageBlocks(input).warnings;
}

export function getBlockLabel(type: PageContentBlock["type"]) {
  switch (type) {
    case "hero":
      return "Hero / Ana giriş alanı";
    case "text":
      return "Metin bölümü";
    case "feature-list":
      return "Öne çıkanlar listesi";
    case "stats":
      return "Sayılar / istatistikler";
    case "cta":
      return "Butonlu çağrı alanı";
    default:
      return "Blok";
  }
}

export function getBlockHelperText(type: PageContentBlock["type"]) {
  switch (type) {
    case "hero":
      return "Sayfanın ilk güçlü giriş alanı. Ana başlık, kısa alt metin ve isteğe bağlı buton içerir.";
    case "text":
      return "Açıklama, hikaye veya bilgilendirme metni için sade içerik bölümü.";
    case "feature-list":
      return "Öne çıkan maddeleri kısa ve taranabilir şekilde gösterir.";
    case "stats":
      return "Sayı, kapasite, deneyim veya operasyon bilgisini etiket/değer olarak sunar.";
    case "cta":
      return "Butonlu çağrı alanı: Kullanıcıyı iletişim, proje başlatma veya detay sayfasına yönlendiren bölüm.";
    default:
      return "Public sayfada render edilen içerik bloğu.";
  }
}

export function createTemplateBlocks(template: PageTemplateKey): PageContentBlock[] {
  if (template === "about") {
    return [
      {
        type: "hero",
        heading: "Hakkımızda",
        subtext: "Skyvan yaklaşımını ve üretim omurgasını anlatan giriş alanı.",
        body: "",
      },
      {
        type: "text",
        heading: "Skyvan yaklaşımı",
        body: "",
      },
      {
        type: "stats",
        heading: "Kısa bakış",
        stats: [{ label: "Odak", value: "Premium üretim" }],
      },
      {
        type: "cta",
        heading: "Bir sonraki adım",
        body: "",
        ctaLabel: "Proje Başlat",
        ctaHref: "/proje-baslat",
      },
    ];
  }

  if (template === "project-start") {
    return [
      {
        type: "hero",
        heading: "Proje başlat",
        subtext: "Karavan fikrini kontrollü bir hazırlık akışına taşı.",
        body: "",
      },
      {
        type: "feature-list",
        heading: "Başlamadan önce",
        items: ["Rota ve kullanım amacı", "Yaşam beklentisi", "Teknik sınırlar"],
      },
      {
        type: "cta",
        heading: "Görüşmeye hazırlan",
        body: "",
        ctaLabel: "İletişime Geç",
        ctaHref: "/iletisim",
      },
    ];
  }

  if (template === "blank") {
    return [
      {
        type: "hero",
        heading: "",
        subtext: "",
        body: "",
      },
    ];
  }

  return [
    {
      type: "hero",
      heading: "Yeni bilgi sayfası",
      subtext: "Sayfanın ana vaadini kısa ve net anlat.",
      body: "",
    },
    {
      type: "text",
      heading: "Genel bilgi",
      body: "",
    },
    {
      type: "feature-list",
      heading: "Öne çıkanlar",
      items: ["İlk madde"],
    },
    {
      type: "cta",
      heading: "Sonraki adım",
      body: "",
      ctaLabel: "Proje Başlat",
      ctaHref: "/proje-baslat",
    },
  ];
}
