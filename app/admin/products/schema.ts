import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Geçerli bir URL girin." }
  );

const optionalNonNegativeNumberString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) return true;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0;
  }, "Negatif olmayan geçerli bir sayı girin.");

export const productStatusSchema = z.enum(["draft", "active", "archived"]);
export const workshopEffectSchema = z.enum(["none", "layer", "mesh", "material"]);
export const workshopVisibilitySchema = z.enum([
  "selectable_visual",
  "selectable_hidden",
  "ai_package_only",
]);

const optionalGeneratedText = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.length >= 2, message);

export const createProductSchema = z.object({
  name: z.string().trim().min(2, "Ürün adı en az 2 karakter olmalı."),
  slug: optionalGeneratedText("Slug en az 2 karakter olmalı."),
  sku: optionalGeneratedText("SKU en az 2 karakter olmalı."),
  productType: z.string().trim().optional().or(z.literal("")),
  productSubType: z.string().trim().optional().or(z.literal("")),
  workshopEffect: workshopEffectSchema,
  workshopVisibility: workshopVisibilitySchema,
  targetLayer: z.string().trim().optional().or(z.literal("")),
  meshKey: z.string().trim().optional().or(z.literal("")),
  materialKey: z.string().trim().optional().or(z.literal("")),
  technicalSpecs: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, "Teknik özellikler geçerli JSON olmalı."),
  categoryId: z.string().trim().min(1, "Kategori seçimi zorunlu."),
  shortDescription: z.string().trim().optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  imageUrl: optionalUrl,
  datasheetUrl: optionalUrl,
  basePrice: optionalNonNegativeNumberString,
  weightKg: optionalNonNegativeNumberString,
  powerDrawWatts: optionalNonNegativeNumberString,
  powerSupplyWatts: optionalNonNegativeNumberString,
  status: productStatusSchema,
});

export const updateProductSchema = createProductSchema.extend({
  id: z.string().trim().min(1, "Ürün ID zorunlu."),
});

export const productFiltersSchema = z.object({
  q: z.string().trim().optional().default(""),
  status: z.enum(["all", "draft", "active", "archived"]).optional().default("all"),
  categoryId: z.string().trim().optional().default("all"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFiltersInput = z.infer<typeof productFiltersSchema>;
