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

export type AboutEditorialSectionId =
  (typeof ABOUT_EDITORIAL_SECTION_IDS)[number];
export type AboutEditorialLocale = "tr" | "en";
export type AboutEditorialLayout =
  | "text-only"
  | "media-left"
  | "media-right"
  | "wide-media";
export type AboutEditorialVisual = "inherit" | "none";

export type AboutEditorialPageOverride = {
  title?: string;
  eyebrow?: string;
  introduction?: string;
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
  editorial?: {
    sectionId: string;
    visible?: boolean;
  };
};

const sectionIds = new Set<string>(ABOUT_EDITORIAL_SECTION_IDS);
const layouts = new Set<string>([
  "text-only",
  "media-left",
  "media-right",
  "wide-media",
]);

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
  for (const value of input.blocks) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }

    const raw = value as Record<string, unknown>;
    if (raw.editorial === undefined) {
      if (input.slug === ABOUT_EDITORIAL_SLUG && raw.type !== "hero") {
        errors.push("Hakkımızda sayfasına serbest ek içerik bloğu eklenemez.");
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
  }

  return errors;
}

export function mergeAboutEditorialSections<
  T extends { id: string; heading: string; body: string },
>(fallbackSections: readonly T[], overrides: readonly AboutEditorialSectionOverride[]) {
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

    return [{
      ...baseline,
      heading: override?.heading?.trim() || baseline.heading,
      body: override?.body?.trim() || override?.content?.trim() || baseline.body,
    } as T];
  });
}
