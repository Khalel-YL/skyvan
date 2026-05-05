export type WorkshopAssetActionStatus = "idle" | "error";

export type WorkshopAssetFieldName =
  | "id"
  | "productId"
  | "modelId"
  | "cameraView"
  | "zIndexLayer"
  | "assetUrl"
  | "fallbackUrl";

export type WorkshopAssetFormState = {
  status: WorkshopAssetActionStatus;
  message: string | null;
  fieldErrors: Partial<Record<WorkshopAssetFieldName, string>>;
};

export const initialWorkshopAssetFormState: WorkshopAssetFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export type WorkshopAssetOption = {
  id: string;
  label: string;
  slug: string;
};

export type WorkshopAssetListItem = {
  id: string;
  productId: string;
  productLabel: string;
  productSlug: string | null;
  productMissing: boolean;
  modelId: string;
  modelLabel: string;
  modelSlug: string | null;
  modelMissing: boolean;
  cameraView: string;
  zIndexLayer: number;
  assetUrl: string;
  fallbackUrl: string | null;
};
