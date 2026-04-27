export const PRODUCT_DOCUMENT_TYPES = [
  "datasheet",
  "install_manual",
  "user_manual",
  "warranty",
  "certificate",
  "technical_note",
] as const;

export const PRODUCT_DOCUMENT_STATUSES = ["draft", "active", "archived"] as const;

export const PRODUCT_DOCUMENT_TYPE_OPTIONS = [
  { value: "datasheet", label: "Datasheet" },
  { value: "install_manual", label: "Montaj Kılavuzu" },
  { value: "user_manual", label: "Kullanım Kılavuzu" },
  { value: "warranty", label: "Garanti Belgesi" },
  { value: "certificate", label: "Sertifika" },
  { value: "technical_note", label: "Teknik Not" },
] as const;

export const PRODUCT_DOCUMENT_STATUS_OPTIONS = [
  { value: "draft", label: "Taslak" },
  { value: "active", label: "Aktif" },
  { value: "archived", label: "Arşiv" },
] as const;

export const PRODUCT_DOCUMENT_TYPE_LABELS = {
  datasheet: "Datasheet",
  install_manual: "Montaj Kılavuzu",
  user_manual: "Kullanım Kılavuzu",
  warranty: "Garanti Belgesi",
  certificate: "Sertifika",
  technical_note: "Teknik Not",
} as const;

export const PRODUCT_DOCUMENT_STATUS_LABELS = {
  draft: "Taslak",
  active: "Aktif",
  archived: "Arşiv",
} as const;

export const REQUIRED_PRODUCT_DOCUMENT_TYPES = [
  "datasheet",
  "install_manual",
  "user_manual",
] as const;

export const DEFAULT_PRODUCT_DOCUMENT_FILTERS = {
  status: "all",
} as const;
