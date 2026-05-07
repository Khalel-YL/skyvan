export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { label: "Taslak", value: "draft" },
  { label: "Aktif", value: "active" },
  { label: "Arşiv", value: "archived" },
] as const;

export const DEFAULT_PRODUCT_FILTERS = {
  q: "",
  status: "all",
  categoryId: "all",
} as const;

export const PRODUCT_DOCUMENT_PLACEHOLDER_NOTE =
  "Ürün belgeleri ayrı toplu geçişle eklenecek. Şimdilik datasheetUrl geçici alan olarak korunuyor.";
