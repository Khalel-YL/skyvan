import {
  PRODUCT_DOCUMENT_TYPE_LABELS,
  PRODUCT_DOCUMENT_TYPES,
  REQUIRED_PRODUCT_DOCUMENT_TYPES,
} from "./constants";
import type {
  ProductDocumentListItem,
  ProductDocumentType,
  ProductDocumentsSummary,
} from "./types";

const productDocumentTypeSet = new Set<string>(PRODUCT_DOCUMENT_TYPES);

export function emptyToNull(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function normalizeDocumentUrl(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(normalized).toString();
  } catch {
    return normalized;
  }
}

export function stringIntegerToNumber(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export function isValidProductDocumentType(
  value: string
): value is ProductDocumentType {
  return productDocumentTypeSet.has(value);
}

export function getProductDocumentTypeLabel(type: string) {
  if (!isValidProductDocumentType(type)) {
    return type;
  }

  return PRODUCT_DOCUMENT_TYPE_LABELS[type];
}

export function buildDocumentDuplicateKey(
  type: ProductDocumentType,
  url: string
) {
  const normalizedUrl = normalizeDocumentUrl(url) ?? "";
  return `${type}::${normalizedUrl.toLowerCase()}`;
}

export function buildProductDocumentsSummary(
  documents: ProductDocumentListItem[]
): ProductDocumentsSummary {
  const activeDocuments = documents.filter(
    (document) => document.status === "active"
  );

  const presentRequiredTypes = REQUIRED_PRODUCT_DOCUMENT_TYPES.filter((type) =>
    activeDocuments.some((document) => document.type === type)
  );

  const missingRequiredTypes = REQUIRED_PRODUCT_DOCUMENT_TYPES.filter(
    (type) => !presentRequiredTypes.includes(type)
  );

  return {
    total: documents.length,
    active: activeDocuments.length,
    archived: documents.filter((document) => document.status === "archived")
      .length,
    presentRequiredTypes: [...presentRequiredTypes],
    missingRequiredTypes: [...missingRequiredTypes],
    completeRequiredSet: missingRequiredTypes.length === 0,
  };
}
