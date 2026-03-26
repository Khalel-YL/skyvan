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
};