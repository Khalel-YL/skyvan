export type CategoryStatus = "draft" | "active" | "archived";

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  status: CategoryStatus;
  sortOrder: number;
};