export type ModelStatus = "draft" | "active" | "archived";

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