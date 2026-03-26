import type {
  DEFAULT_PRODUCT_DOCUMENT_FILTERS,
  PRODUCT_DOCUMENT_STATUSES,
  PRODUCT_DOCUMENT_TYPES,
  REQUIRED_PRODUCT_DOCUMENT_TYPES,
} from "./constants";

export type ProductDocumentType = (typeof PRODUCT_DOCUMENT_TYPES)[number];
export type ProductDocumentStatus = (typeof PRODUCT_DOCUMENT_STATUSES)[number];
export type ProductDocumentFilterStatus =
  | ProductDocumentStatus
  | "all";

export type RequiredProductDocumentType =
  (typeof REQUIRED_PRODUCT_DOCUMENT_TYPES)[number];

export type ProductDocumentFilters = {
  status: ProductDocumentFilterStatus;
};

export type ProductDocumentListItem = {
  id: string;
  productId: string;
  type: ProductDocumentType;
  title: string;
  url: string;
  note: string | null;
  sortOrder: number;
  status: ProductDocumentStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDocumentFormValues = {
  type: ProductDocumentType;
  title: string;
  url: string;
  note: string;
  sortOrder: string;
};

export type ProductDocumentActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type ProductDocumentsSummary = {
  total: number;
  active: number;
  archived: number;
  presentRequiredTypes: ProductDocumentType[];
  missingRequiredTypes: ProductDocumentType[];
  completeRequiredSet: boolean;
};

export type ProductDocumentsPageProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: "draft" | "active" | "archived";
  categoryName: string;
};

export type DefaultProductDocumentFilters =
  typeof DEFAULT_PRODUCT_DOCUMENT_FILTERS;