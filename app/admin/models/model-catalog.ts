import type { ConvertibleVehiclePreset } from "./model-form.types";
import { officialVehicleSeeds } from "./official-vehicle-catalog";

export const convertibleVehicleCatalog: ConvertibleVehiclePreset[] =
  officialVehicleSeeds.map((item) => ({
    key: item.key,
    title: `${item.manufacturerLabel} ${item.variantLabel}`,
    marketTag: item.marketScope,
    bodyType: item.platformClass,
    conversionClass: item.familyLabel,
    summary: item.note,
    slugSuggestion: item.slug,
  }));