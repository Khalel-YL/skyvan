import type { ProductFormValues, ProductListItem } from "./types";

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

export function normalizeSku(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-_]/g, "");
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