import type {
  CategoryOption,
  ProductFormValues,
  ProductListItem,
  ProductTargetLayer,
  WorkshopVisibility,
  WorkshopEffect,
} from "./types";

export const categoryTypeOptionsBySlug: Record<
  string,
  Array<{ value: string; label: string }>
> = {
  kitchen: [
    { value: "ocak", label: "ocak" },
    { value: "evye", label: "evye" },
    { value: "buzdolabı", label: "buzdolabı" },
    { value: "tezgah", label: "tezgah" },
    { value: "musluk", label: "musluk" },
  ],
  bed: [
    { value: "sabit_yatak", label: "sabit_yatak" },
    { value: "katlanır_yatak", label: "katlanır_yatak" },
    { value: "minder", label: "minder" },
  ],
  storage: [
    { value: "üst_dolap", label: "üst_dolap" },
    { value: "alt_dolap", label: "alt_dolap" },
    { value: "çekmece", label: "çekmece" },
    { value: "gardırop", label: "gardırop" },
  ],
  seat: [
    { value: "koltuk", label: "koltuk" },
    { value: "bank", label: "bank" },
    { value: "minder", label: "minder" },
  ],
  table: [
    { value: "masa", label: "masa" },
    { value: "katlanır_masa", label: "katlanır_masa" },
  ],
  bathroom: [
    { value: "duş", label: "duş" },
    { value: "wc", label: "wc" },
    { value: "lavabo", label: "lavabo" },
  ],
  electrical: [
    { value: "solar", label: "solar" },
    { value: "akü", label: "akü" },
    { value: "inverter", label: "inverter" },
    { value: "mppt", label: "mppt" },
    { value: "sigorta", label: "sigorta" },
    { value: "kablo", label: "kablo" },
  ],
  plumbing: [
    { value: "temiz_su_tankı", label: "temiz_su_tankı" },
    { value: "gri_su_tankı", label: "gri_su_tankı" },
    { value: "pompa", label: "pompa" },
    { value: "hidrofor", label: "hidrofor" },
    { value: "vana", label: "vana" },
    { value: "hortum", label: "hortum" },
  ],
  climate: [
    { value: "webasto", label: "webasto" },
    { value: "klima", label: "klima" },
    { value: "fan", label: "fan" },
    { value: "havalandırma", label: "havalandırma" },
    { value: "kombi", label: "kombi" },
  ],
};

export const workshopEffectOptions: Array<{
  value: WorkshopEffect;
  label: string;
}> = [
  { value: "none", label: "Yok" },
  { value: "layer", label: "Katman" },
  { value: "mesh", label: "Mesh" },
  { value: "material", label: "Malzeme" },
];

export const workshopVisibilityOptions: Array<{
  value: WorkshopVisibility;
  label: string;
}> = [
  { value: "selectable_visual", label: "Workshop’ta Görsel" },
  { value: "selectable_hidden", label: "Workshop’ta Görünmeyen Seçilebilir" },
  { value: "ai_package_only", label: "Sadece AI/Paket" },
];

export const targetLayerOptions: Array<{
  value: Exclude<ProductTargetLayer, null>;
  label: string;
}> = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bed", label: "Bed" },
  { value: "storage", label: "Storage" },
  { value: "seat", label: "Seat" },
  { value: "table", label: "Table" },
  { value: "bathroom", label: "Bathroom" },
];

const categoryPresentationBySlug: Record<
  string,
  { isVisual: boolean; targetLayer: ProductTargetLayer }
> = {
  kitchen: { isVisual: true, targetLayer: "kitchen" },
  bed: { isVisual: true, targetLayer: "bed" },
  storage: { isVisual: true, targetLayer: "storage" },
  seat: { isVisual: true, targetLayer: "seat" },
  table: { isVisual: true, targetLayer: "table" },
  bathroom: { isVisual: true, targetLayer: "bathroom" },
  electrical: { isVisual: false, targetLayer: null },
  plumbing: { isVisual: false, targetLayer: null },
  climate: { isVisual: false, targetLayer: null },
};

export function getDerivedCategoryFields(input: {
  name: string;
  slug: string;
}) {
  const categorySlug = input.slug.trim();
  const categoryLabel = input.name.trim() || categorySlug;
  const presentation = categoryPresentationBySlug[categorySlug] ?? {
    isVisual: false,
    targetLayer: null,
  };

  return {
    categorySlug,
    categoryLabel,
    isVisual: presentation.isVisual,
    targetLayer: presentation.targetLayer,
  };
}

export function enrichCategoryOption<T extends {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
}>(category: T): CategoryOption {
  return {
    ...category,
    ...getDerivedCategoryFields(category),
  };
}

export function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function generateProductSlug(name: string) {
  return normalizeSlug(name);
}

export function normalizeSku(input: string) {
  return normalizeSlug(input)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, "");
}

export function generateProductSku(name: string) {
  const normalizedParts = normalizeSlug(name)
    .split("-")
    .filter((part) => part.length > 0);

  if (!normalizedParts.length) {
    return "";
  }

  const prefix =
    normalizedParts.length > 1
      ? normalizedParts
          .slice(0, 2)
          .map((part) => part.slice(0, 3))
          .join("-")
      : normalizedParts[0].slice(0, 3);

  return `${prefix.toUpperCase()}-001`;
}

export function normalizeWorkshopEffect(value?: string | null): WorkshopEffect {
  if (
    value === "layer" ||
    value === "mesh" ||
    value === "material" ||
    value === "none"
  ) {
    return value;
  }

  return "none";
}

export function normalizeWorkshopVisibility(
  value?: string | null
): WorkshopVisibility {
  if (
    value === "selectable_visual" ||
    value === "selectable_hidden" ||
    value === "ai_package_only"
  ) {
    return value;
  }

  return "selectable_visual";
}

export function normalizeTargetLayer(value?: string | null): ProductTargetLayer {
  if (
    value === "kitchen" ||
    value === "bed" ||
    value === "storage" ||
    value === "seat" ||
    value === "table" ||
    value === "bathroom"
  ) {
    return value;
  }

  return null;
}

export function parseTechnicalSpecs(value?: string | null): Record<string, unknown> {
  if (!value?.trim()) {
    return {};
  }

  const parsed = JSON.parse(value);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

export function formatTechnicalSpecs(value?: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function emptyToNull(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function stringNumberToDbNumeric(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function productToFormValues(product: ProductListItem): ProductFormValues {
  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    productType: product.productType ?? "",
    productSubType: product.productSubType ?? "",
    workshopEffect: product.workshopEffect ?? "none",
    workshopVisibility: product.workshopVisibility ?? "selectable_visual",
    targetLayer: product.targetLayer ?? "",
    meshKey: product.meshKey ?? "",
    materialKey: product.materialKey ?? "",
    technicalSpecs: formatTechnicalSpecs(product.technicalSpecs),
    categoryId: product.categoryId ?? "",
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    datasheetUrl: product.datasheetUrl ?? "",
    basePrice: product.basePrice ?? "",
    weightKg: product.weightKg ?? "",
    powerDrawWatts: product.powerDrawWatts ?? "",
    powerSupplyWatts: product.powerSupplyWatts ?? "",
    status: product.status,
  };
}

export function formatMoney(value: string | null) {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatMetric(value: string | null, suffix: string) {
  if (!value) return "—";
  return `${value} ${suffix}`;
}

export function formatWatts(value: string | null) {
  if (!value) return "—";
  const num = Number(value);
  if (!Number.isFinite(num)) return `${value} W`;
  return `${num} W`;
}
