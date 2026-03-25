export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Archived", value: "archived" },
] as const;

export const DEFAULT_PRODUCT_FILTERS = {
  q: "",
  status: "all",
  categoryId: "all",
} as const;

export const PRODUCT_DOCUMENT_PLACEHOLDER_NOTE =
  "Product Documents ayrı batch ile eklenecek. Şimdilik datasheetUrl geçici alan olarak korunuyor.";