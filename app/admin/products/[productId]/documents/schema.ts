import { z } from "zod";
import {
  PRODUCT_DOCUMENT_STATUSES,
  PRODUCT_DOCUMENT_TYPES,
} from "./constants";
import { normalizeDocumentUrl } from "./lib";

const optionalText = z.string().trim().optional().or(z.literal(""));

const requiredUrl = z
  .string()
  .trim()
  .min(1, "Belge linki zorunlu.")
  .refine((value) => {
    const normalized = normalizeDocumentUrl(value);

    if (!normalized) {
      return false;
    }

    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  }, "Geçerli bir belge linki girin.");

const optionalNonNegativeIntegerString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0;
  }, "0 veya daha büyük tam sayı girin.");

export const productDocumentTypeSchema = z.enum(PRODUCT_DOCUMENT_TYPES);
export const productDocumentStatusSchema = z.enum(PRODUCT_DOCUMENT_STATUSES);

export const createProductDocumentSchema = z.object({
  productId: z.string().trim().uuid("Geçerli ürün kimliği zorunlu."),
  type: productDocumentTypeSchema,
  title: z
    .string()
    .trim()
    .min(2, "Belge başlığı en az 2 karakter olmalı."),
  url: requiredUrl,
  note: optionalText,
  sortOrder: optionalNonNegativeIntegerString,
});

export const updateProductDocumentSchema = createProductDocumentSchema.extend({
  id: z.string().trim().uuid("Geçerli belge kimliği zorunlu."),
});

export const archiveProductDocumentSchema = z.object({
  id: z.string().trim().uuid("Geçerli belge kimliği zorunlu."),
  productId: z.string().trim().uuid("Geçerli ürün kimliği zorunlu."),
});

export const restoreProductDocumentSchema = archiveProductDocumentSchema;

export const productDocumentFiltersSchema = z.object({
  status: z
    .enum(["all", ...PRODUCT_DOCUMENT_STATUSES])
    .optional()
    .default("active"),
});

export type CreateProductDocumentInput = z.infer<
  typeof createProductDocumentSchema
>;

export type UpdateProductDocumentInput = z.infer<
  typeof updateProductDocumentSchema
>;

export type ArchiveProductDocumentInput = z.infer<
  typeof archiveProductDocumentSchema
>;

export type RestoreProductDocumentInput = z.infer<
  typeof restoreProductDocumentSchema
>;

export type ProductDocumentFiltersInput = z.infer<
  typeof productDocumentFiltersSchema
>;  