import { z } from "zod";

export const createProductSourceBindingSchema = z.object({
  productId: z.string().trim().uuid("Geçerli ürün kaydı zorunlu."),
  manufacturerSourceRegistryId: z
    .string()
    .trim()
    .uuid("Geçerli kaynak kaydı zorunlu."),
  pathHint: z
    .string()
    .trim()
    .max(180, "Path hint en fazla 180 karakter olabilir.")
    .optional()
    .default(""),
  bindingNotes: z
    .string()
    .trim()
    .max(1000, "Not alanı en fazla 1000 karakter olabilir.")
    .optional()
    .default(""),
  priority: z.coerce
    .number()
    .int("Öncelik tam sayı olmalı.")
    .min(0, "Öncelik 0 veya daha büyük olmalı.")
    .max(9999, "Öncelik en fazla 9999 olabilir."),
  status: z.enum(["draft", "active", "archived"]).default("active"),
});

export const productSourceBindingFiltersSchema = z.object({
  q: z.string().trim().optional().default(""),
  status: z
    .enum(["all", "draft", "active", "archived"])
    .optional()
    .default("active"),
});

export type CreateProductSourceBindingInput = z.infer<
  typeof createProductSourceBindingSchema
>;

export type ProductSourceBindingFiltersInput = z.infer<
  typeof productSourceBindingFiltersSchema
>;