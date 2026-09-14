export const ABOUT_EDITORIAL_SLUG = "hakkimizda" as const;

export const ABOUT_EDITORIAL_SECTION_IDS = [
  "why-skyvan-exists",
  "hands-on-build-experience",
  "lightweight-material-decisions",
  "organized-service-access",
  "living-space-and-engineering",
  "open-technical-questions",
  "workshop-extension",
  "human-responsibility",
] as const;

export const ABOUT_EDITORIAL_CTA_SLUGS = [
  "karavan-deneyimi",
  "muhendislik",
  "workshop",
  "nasil-calisir",
  "uretim-sureci",
  "sss",
  "iletisim",
  "proje-baslat",
] as const;

export const PUBLIC_SUPPLEMENTARY_BLOCK_TYPES = [
  "text",
  "feature-list",
  "stats",
  "cta",
] as const;

export const PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS = [
  "standard",
  "surface",
  "wide",
] as const;

export const MAX_PUBLIC_SUPPLEMENTARY_BLOCKS = 12;

export type AboutEditorialSectionId =
  (typeof ABOUT_EDITORIAL_SECTION_IDS)[number];
export type AboutEditorialLocale = "tr" | "en";
export type AboutEditorialCtaSlug =
  (typeof ABOUT_EDITORIAL_CTA_SLUGS)[number];
export type AboutEditorialLayout =
  | "text-only"
  | "media-left"
  | "media-right"
  | "wide-media";
export type AboutEditorialVisual = "inherit" | "none";
export type PublicSupplementaryBlockType =
  (typeof PUBLIC_SUPPLEMENTARY_BLOCK_TYPES)[number];
export type PublicSupplementaryBlockLayout =
  (typeof PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS)[number];

export type PublicSupplementaryBlockPresentation = {
  id: string;
  visible: boolean;
  layout: PublicSupplementaryBlockLayout;
};

export type AboutEditorialPageOverride = {
  title?: string;
  eyebrow?: string;
  introduction?: string;
};

export type AboutEditorialSectionCta = {
  label: string;
  href: string;
};

export type AboutEditorialSectionPresentation = {
  sectionId: AboutEditorialSectionId;
  visible: boolean;
  visual: AboutEditorialVisual;
  layout?: AboutEditorialLayout;
};

export type AboutEditorialSectionOverride = {
  heading?: string;
  body?: string;
  content?: string;
  ctaLabel?: string;
  ctaHref?: string;
  editorial?: {
    sectionId: string;
    visible?: boolean;
  };
};

const sectionIds = new Set<string>(ABOUT_EDITORIAL_SECTION_IDS);
const ctaSlugs = new Set<string>(ABOUT_EDITORIAL_CTA_SLUGS);
const layouts = new Set<string>([
  "text-only",
  "media-left",
  "media-right",
  "wide-media",
]);
const supplementaryBlockTypes = new Set<string>(PUBLIC_SUPPLEMENTARY_BLOCK_TYPES);
const supplementaryBlockLayouts = new Set<string>(PUBLIC_SUPPLEMENTARY_BLOCK_LAYOUTS);
const supplementaryBlockIdPattern = /^supplemental-[a-z0-9][a-z0-9-]{7,79}$/;

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function isAboutEditorialLocale(value: string): value is AboutEditorialLocale {
  return value === "tr" || value === "en";
}

export function isAboutEditorialSectionId(
  value: string,
): value is AboutEditorialSectionId {
  return sectionIds.has(value);
}

export function isAboutEditorialPage(locale: string, slug: string) {
  return isAboutEditorialLocale(locale) && slug === ABOUT_EDITORIAL_SLUG;
}

export function getAboutEditorialCtaHref(
  locale: AboutEditorialLocale,
  slug: AboutEditorialCtaSlug,
) {
  return `/${locale}/${slug}`;
}

export function getAboutEditorialCtaSlug(
  locale: string,
  href: string,
): AboutEditorialCtaSlug | undefined {
  if (!isAboutEditorialLocale(locale)) {
    return undefined;
  }

  const prefix = `/${locale}/`;
  if (!href.startsWith(prefix)) {
    return undefined;
  }

  const slug = href.slice(prefix.length);
  return ctaSlugs.has(slug) ? slug as AboutEditorialCtaSlug : undefined;
}

export function normalizeAboutEditorialSectionCta(
  locale: string,
  labelValue: unknown,
  hrefValue: unknown,
): AboutEditorialSectionCta | undefined {
  const label = optionalString(labelValue);
  const href = optionalString(hrefValue);
  if (!label || !href || !getAboutEditorialCtaSlug(locale, href)) {
    return undefined;
  }

  return { label, href };
}

export function normalizeAboutEditorialPageOverride(
  value: unknown,
): AboutEditorialPageOverride | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const normalized = {
    title: optionalString(raw.title),
    eyebrow: optionalString(raw.eyebrow),
    introduction: optionalString(raw.introduction),
  };

  return normalized.title || normalized.eyebrow || normalized.introduction
    ? normalized
    : undefined;
}

export function normalizeAboutEditorialPresentation(
  value: unknown,
): AboutEditorialSectionPresentation | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const sectionId = optionalString(raw.sectionId);
  if (!sectionId || !isAboutEditorialSectionId(sectionId)) {
    return undefined;
  }

  const visual = raw.visual === "none" ? "none" : "inherit";
  const layout = typeof raw.layout === "string" && layouts.has(raw.layout)
    ? (raw.layout as AboutEditorialLayout)
    : undefined;

  return {
    sectionId,
    visible: typeof raw.visible === "boolean" ? raw.visible : true,
    visual,
    layout,
  };
}

export function normalizePublicSupplementaryBlockPresentation(
  value: unknown,
): PublicSupplementaryBlockPresentation | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const id = optionalString(raw.id)?.toLowerCase();
  if (!id || !supplementaryBlockIdPattern.test(id)) {
    return undefined;
  }

  const layout = typeof raw.layout === "string" && supplementaryBlockLayouts.has(raw.layout)
    ? raw.layout as PublicSupplementaryBlockLayout
    : "standard";

  return {
    id,
    visible: typeof raw.visible === "boolean" ? raw.visible : true,
    layout,
  };
}

export function validateAboutEditorialContract(input: {
  locale: string;
  slug: string;
  editorialPage: unknown;
  blocks: unknown[];
}) {
  const hasEditorialOverlay = input.editorialPage !== undefined || input.blocks.some((value) =>
    Boolean(value && typeof value === "object" && !Array.isArray(value) && "editorial" in value),
  );

  if (input.slug !== ABOUT_EDITORIAL_SLUG && !hasEditorialOverlay) {
    return [];
  }

  const errors: string[] = [];
  if (input.slug !== ABOUT_EDITORIAL_SLUG) {
    errors.push("Hakkımızda editoryal içeriği canonical hakkimizda slug değerini kullanmalıdır.");
  }
  if (!isAboutEditorialLocale(input.locale)) {
    errors.push("Hakkımızda editoryal içeriği yalnızca tr veya en locale kullanabilir.");
  }

  if (
    input.editorialPage !== undefined &&
    (!input.editorialPage ||
      typeof input.editorialPage !== "object" ||
      Array.isArray(input.editorialPage))
  ) {
    errors.push("Hakkımızda sayfa üst bilgisi geçerli bir nesne olmalıdır.");
  } else if (input.editorialPage && typeof input.editorialPage === "object") {
    const page = input.editorialPage as Record<string, unknown>;
    for (const key of ["title", "eyebrow", "introduction"] as const) {
      if (page[key] !== undefined && typeof page[key] !== "string") {
        errors.push(`Hakkımızda ${key} değeri metin olmalıdır.`);
      }
    }
  }

  const seen = new Set<string>();
  const seenSupplementaryIds = new Set<string>();
  let supplementaryCount = 0;
  let heroCount = 0;
  for (const value of input.blocks) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const raw = value as Record<string, unknown>;
    if (raw.editorial === undefined) {
      if (input.slug !== ABOUT_EDITORIAL_SLUG) {
        continue;
      }
      if (raw.type === "hero") {
        heroCount += 1;
        if (raw.cms !== undefined) {
          errors.push("Hakkımızda hero bloğu ek CMS kimliği taşıyamaz.");
        }
        continue;
      }

      const cms = normalizePublicSupplementaryBlockPresentation(raw.cms);
      const type = optionalString(raw.type);
      supplementaryCount += 1;

      if (!cms) {
        errors.push("Hakkımızda ek bloğu geçerli ve sabit bir CMS kimliği taşımalıdır.");
        continue;
      }
      const rawCms = raw.cms as Record<string, unknown>;
      if (rawCms.visible !== undefined && typeof rawCms.visible !== "boolean") {
        errors.push(`${cms.id}: görünürlük true veya false olmalıdır.`);
      }
      if (
        rawCms.layout !== undefined &&
        (typeof rawCms.layout !== "string" || !supplementaryBlockLayouts.has(rawCms.layout))
      ) {
        errors.push(`${cms.id}: ek blok sunumu desteklenmiyor.`);
      }
      if (!type || !supplementaryBlockTypes.has(type)) {
        errors.push(`${cms.id}: bu ek blok türü desteklenmiyor.`);
      }
      if (seenSupplementaryIds.has(cms.id)) {
        errors.push(`Ek blok kimliği birden fazla kullanılamaz: ${cms.id}.`);
      }
      seenSupplementaryIds.add(cms.id);
      if (raw.media !== undefined) {
        errors.push(`${cms.id}: yönetilen medya değişimi henüz desteklenmiyor.`);
      }

      const ctaLabel = optionalString(raw.ctaLabel);
      const ctaHref = optionalString(raw.ctaHref);
      if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
        errors.push(`${cms.id}: CTA etiketi ve hedefi birlikte tanımlanmalıdır.`);
      }
      if (ctaLabel && ctaLabel.length > 80) {
        errors.push(`${cms.id}: CTA etiketi 80 karakterden uzun olamaz.`);
      }
      if (ctaHref && !getAboutEditorialCtaSlug(input.locale, ctaHref)) {
        errors.push(`${cms.id}: CTA hedefi yalnızca aynı dildeki onaylı public rotalardan biri olabilir.`);
      }
      continue;
    }

    if (!raw.editorial || typeof raw.editorial !== "object" || Array.isArray(raw.editorial)) {
      errors.push("Hakkımızda bölüm sunumu geçerli bir nesne olmalıdır.");
      continue;
    }

    const editorial = raw.editorial as Record<string, unknown>;
    const sectionId = optionalString(editorial.sectionId);
    if (!sectionId || !isAboutEditorialSectionId(sectionId)) {
      errors.push(`Bilinmeyen Hakkımızda bölüm kimliği: ${sectionId || "(boş)"}.`);
      continue;
    }

    if (seen.has(sectionId)) {
      errors.push(`Hakkımızda bölüm kimliği birden fazla kullanılamaz: ${sectionId}.`);
    }
    seen.add(sectionId);

    if (editorial.visible !== undefined && typeof editorial.visible !== "boolean") {
      errors.push(`${sectionId}: görünürlük true veya false olmalıdır.`);
    }

    if (editorial.visual !== undefined && editorial.visual !== "inherit" && editorial.visual !== "none") {
      errors.push(`${sectionId}: medya seçimi inherit veya none olmalıdır.`);
    }

    if (editorial.layout !== undefined && (
      typeof editorial.layout !== "string" || !layouts.has(editorial.layout)
    )) {
      errors.push(`${sectionId}: sunum seçimi desteklenmiyor.`);
    }

    if (raw.type !== "text") {
      errors.push(`${sectionId}: editoryal bölüm text bloğu olmalıdır.`);
    }

    if (raw.media !== undefined) {
      errors.push(`${sectionId}: yönetilen medya değişimi bu batch içinde desteklenmiyor.`);
    }
    if (raw.cms !== undefined) {
      errors.push(`${sectionId}: ana bölüm aynı zamanda ek CMS bloğu olamaz.`);
    }

    if (raw.ctaLabel !== undefined && typeof raw.ctaLabel !== "string") {
      errors.push(`${sectionId}: CTA etiketi metin olmalıdır.`);
    }
    if (raw.ctaHref !== undefined && typeof raw.ctaHref !== "string") {
      errors.push(`${sectionId}: CTA hedefi metin olmalıdır.`);
    }

    const ctaLabel = optionalString(raw.ctaLabel);
    const ctaHref = optionalString(raw.ctaHref);
    if ((ctaLabel && !ctaHref) || (!ctaLabel && ctaHref)) {
      errors.push(`${sectionId}: CTA etiketi ve hedefi birlikte tanımlanmalıdır.`);
    }
    if (ctaLabel && ctaLabel.length > 80) {
      errors.push(`${sectionId}: CTA etiketi 80 karakterden uzun olamaz.`);
    }
    if (ctaHref && !getAboutEditorialCtaSlug(input.locale, ctaHref)) {
      errors.push(`${sectionId}: CTA hedefi yalnızca aynı dildeki onaylı public rotalardan biri olabilir.`);
    }
  }

  if (supplementaryCount > MAX_PUBLIC_SUPPLEMENTARY_BLOCKS) {
    errors.push(`Hakkımızda sayfasında en fazla ${MAX_PUBLIC_SUPPLEMENTARY_BLOCKS} ek blok kullanılabilir.`);
  }
  if (heroCount > 1) {
    errors.push("Hakkımızda sayfasında birden fazla hero bloğu kullanılamaz.");
  }

  return errors;
}

export function mergeAboutEditorialSections<
  T extends { id: string; heading: string; body: string; cta?: AboutEditorialSectionCta },
>(
  fallbackSections: readonly T[],
  overrides: readonly AboutEditorialSectionOverride[],
  locale?: AboutEditorialLocale,
) {
  const firstById = new Map<AboutEditorialSectionId, AboutEditorialSectionOverride>();
  for (const override of overrides) {
    const sectionId = override.editorial?.sectionId;
    if (sectionId && isAboutEditorialSectionId(sectionId) && !firstById.has(sectionId)) {
      firstById.set(sectionId, override);
    }
  }

  const orderedIds = [
    ...firstById.keys(),
    ...ABOUT_EDITORIAL_SECTION_IDS.filter((sectionId) => !firstById.has(sectionId)),
  ];
  const fallbackById = new Map(fallbackSections.map((section) => [section.id, section]));

  return orderedIds.flatMap((sectionId) => {
    const baseline = fallbackById.get(sectionId);
    const override = firstById.get(sectionId);
    if (!baseline || override?.editorial?.visible === false) {
      return [];
    }

    const cta = locale
      ? normalizeAboutEditorialSectionCta(locale, override?.ctaLabel, override?.ctaHref)
      : undefined;

    return [{
      ...baseline,
      heading: override?.heading?.trim() || baseline.heading,
      body: override?.body?.trim() || override?.content?.trim() || baseline.body,
      cta: cta ?? baseline.cta,
    } as T];
  });
}
