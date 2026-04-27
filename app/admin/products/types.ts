export type ProductStatus = "draft" | "active" | "archived";

export type WorkshopEffect = "none" | "layer" | "mesh" | "material";

export type WorkshopVisibility =
  | "selectable_visual"
  | "selectable_hidden"
  | "ai_package_only";

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
  categorySlug: string;
  categoryLabel: string;
  isVisual: boolean;
  targetLayer: ProductTargetLayer;
  status?: string | null;
};

export type ProductTargetLayer =
  | "kitchen"
  | "bed"
  | "storage"
  | "seat"
  | "table"
  | "bathroom"
  | null;

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productType: string | null;
  productSubType: string | null;
  workshopEffect: WorkshopEffect;
  workshopVisibility: WorkshopVisibility;
  targetLayer: ProductTargetLayer;
  meshKey: string | null;
  materialKey: string | null;
  technicalSpecs: Record<string, unknown>;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryLabel: string;
  isVisual: boolean;
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
  productType: string;
  productSubType: string;
  workshopEffect: WorkshopEffect;
  workshopVisibility: WorkshopVisibility;
  targetLayer: string;
  meshKey: string;
  materialKey: string;
  technicalSpecs: string;
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
  fieldErrors?: Record<string, string[]>;
  errors?: Record<string, string[]>;
  values?: ProductFormValues;
};
