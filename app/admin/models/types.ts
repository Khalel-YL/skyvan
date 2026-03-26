export type ModelStatus = "draft" | "active" | "archived";

export type ModelListItem = {
  id: string;
  slug: string;
  baseWeightKg: string | number;
  maxPayloadKg: string | number;
  wheelbaseMm: number;
  roofLengthMm: number | null;
  roofWidthMm: number | null;
  status: ModelStatus;
  updatedAt?: Date | string | null;
};

export type ModelFormValues = {
  id?: string;
  slug: string;
  baseWeightKg: string;
  maxPayloadKg: string;
  wheelbaseMm: string;
  roofLengthMm: string;
  roofWidthMm: string;
  status: ModelStatus;
};

export type ModelFieldName =
  | "slug"
  | "baseWeightKg"
  | "maxPayloadKg"
  | "wheelbaseMm"
  | "roofLengthMm"
  | "roofWidthMm"
  | "status";

export type ModelFormState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Partial<Record<ModelFieldName, string>>;
  suggestedSlug: string | null;
};

export const initialModelFormState: ModelFormState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  suggestedSlug: null,
};

export type ConvertibleVehiclePreset = {
  key: string;
  title: string;
  marketTag: string;
  bodyType: string;
  conversionClass: string;
  summary: string;
  slugSuggestion: string;
};