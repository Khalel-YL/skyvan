export type PackageListItem = {
  id: string;
  modelId: string | null;
  modelSlug: string | null;
  name: string;
  slug: string;
  tierLevel: number | null;
  isDefault: boolean;
  createdAt: Date | string | null;
};

export type PackageFormValues = {
  id?: string;
  modelId: string;
  name: string;
  slug: string;
  tierLevel: string;
  isDefault: boolean;
};

export type PackageFieldName =
  | "modelId"
  | "name"
  | "slug"
  | "tierLevel"
  | "isDefault";

export type PackageFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<PackageFieldName, string>>;
  suggestedSlug: string | null;
};

export const initialPackageFormState: PackageFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  suggestedSlug: null,
};

export type PackageFilterView = "all" | "default" | "custom";

export type AvailableModelOption = {
  id: string;
  slug: string;
};