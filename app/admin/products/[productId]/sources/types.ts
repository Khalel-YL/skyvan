export type ProductSourceBindingStatus = "draft" | "active" | "archived";

export type ProductSourceBindingFilterStatus =
  | "all"
  | ProductSourceBindingStatus;

export type ProductSourceBindingFilters = {
  q: string;
  status: ProductSourceBindingFilterStatus;
};

export type ProductSourceBindingsPageProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: ProductSourceBindingStatus;
  categoryName: string;
};

export type ManufacturerSourceBindingOption = {
  id: string;
  manufacturerName: string;
  domain: string;
  normalizedDomain: string;
  allowedContentTypes: string[];
  defaultFetchMode: string;
};

export type ProductSourceBindingListItem = {
  id: string;
  productId: string;
  manufacturerSourceRegistryId: string;
  manufacturerName: string;
  domain: string;
  normalizedDomain: string;
  allowedContentTypes: string[];
  defaultFetchMode: string;
  pathHint: string;
  bindingNotes: string | null;
  priority: number;
  status: ProductSourceBindingStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductSourceBindingActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export type ProductSourceBindingFormValues = {
  manufacturerSourceRegistryId: string;
  pathHint: string;
  bindingNotes: string;
  priority: string;
  status: ProductSourceBindingStatus;
};