export type ProductStatus = "draft" | "active" | "archived";

export type ProductFilterStatus = ProductStatus | "all";

export type ProductFilters = {
  q: string;
  status: ProductFilterStatus;
  categoryId: string | "all";
};

export type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  status?: string | null;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  shortDescription: string | null;
  description: string | null;
  imageUrl: string | null;
  datasheetUrl: string | null;
  basePrice: string | null;
  weightKg: string | null;
  powerDrawWatts: string | null;
  powerSupplyWatts: string | null;
  status: ProductStatus;
  lifecycleNote:
    | "legacy_active_downgraded"
    | "legacy_active_aligned_to_draft"
    | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  datasheetUrl: string;
  basePrice: string;
  weightKg: string;
  powerDrawWatts: string;
  powerSupplyWatts: string;
  status: ProductStatus;
};

export type ProductActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};
