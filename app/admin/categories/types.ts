export type CategoryStatus = "draft" | "active" | "archived";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: CategoryStatus;
  sortOrder: number;
};

export type CategoryFieldName =
  | "name"
  | "slug"
  | "icon"
  | "status"
  | "sortOrder";

export type CategoryFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<CategoryFieldName, string>>;
};

export const initialCategoryFormState: CategoryFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
